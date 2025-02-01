/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import httpSignature from '@peertube/http-signature';
import * as Bull from 'bullmq';
import type Logger from '@/logger.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import FederationChart from '@/core/chart/charts/federation.js';
import { getApId } from '@/core/activitypub/type.js';
import type { IActivity } from '@/core/activitypub/type.js';
import type { MiRemoteUser } from '@/models/User.js';
import type { MiUserPublickey } from '@/models/UserPublickey.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { StatusError } from '@/misc/status-error.js';
import { UtilityService } from '@/core/UtilityService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { JsonLdService } from '@/core/activitypub/JsonLdService.js';
import { ApInboxService } from '@/core/activitypub/ApInboxService.js';
import { bindThis } from '@/decorators.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { CollapsedQueue } from '@/misc/collapsed-queue.js';
import { MiNote } from '@/models/Note.js';
import { MiMeta } from '@/models/Meta.js';
import { DI } from '@/di-symbols.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type { InboxJobData } from '../types.js';

type UpdateInstanceJob = {
	latestRequestReceivedAt: Date,
	shouldUnsuspend: boolean,
};

@Injectable()
export class InboxProcessorService implements OnApplicationShutdown {
	private logger: Logger;
	private updateInstanceQueue: CollapsedQueue<MiNote['id'], UpdateInstanceJob>;

	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		private utilityService: UtilityService,
		private apInboxService: ApInboxService,
		private federatedInstanceService: FederatedInstanceService,
		private fetchInstanceMetadataService: FetchInstanceMetadataService,
		private jsonLdService: JsonLdService,
		private apPersonService: ApPersonService,
		private apDbResolverService: ApDbResolverService,
		private instanceChart: InstanceChart,
		private apRequestChart: ApRequestChart,
		private federationChart: FederationChart,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('inbox');
		this.updateInstanceQueue = new CollapsedQueue(process.env.NODE_ENV !== 'test' ? 60 * 1000 * 5 : 0, this.collapseUpdateInstanceJobs, this.performUpdateInstance);
	}

	@bindThis
	public async process(job: Bull.Job<InboxJobData>): Promise<string> {
		const signature = job.data.signature;	// HTTP-signature
		let activity = job.data.activity;

		//#region Log
		const info = Object.assign({}, activity);
		delete info['@context'];
		this.logger.debug(JSON.stringify(info, null, 2));
		//#endregion

		const host = this.utilityService.toPuny(new URL(signature.keyId).hostname);

		if (!this.utilityService.isFederationAllowedHost(host)) {
			return `Blocked request: ${host}`;
		}

		const keyIdLower = signature.keyId.toLowerCase();
		if (keyIdLower.startsWith('acct:')) {
			return `Old keyId is no longer supported. ${keyIdLower}`;
		}

		// HTTP-Signature keyIdを元にDBから取得
		let authUser: {
			user: MiRemoteUser;
			key: MiUserPublickey | null;
		} | null = await this.apDbResolverService.getAuthUserFromKeyId(signature.keyId);

		// keyIdでわからなければ、activity.actorを元にDBから取得 || activity.actorを元にリモートから取得
		if (authUser == null) {
			try {
				authUser = await this.apDbResolverService.getAuthUserFromApId(getApId(activity.actor));
			} catch (err) {
				// 対象が4xxならスキップ
				if (err instanceof StatusError) {
					if (!err.isRetryable) {
						throw new Bull.UnrecoverableError(`skip: Ignored deleted actors on both ends ${activity.actor} - ${err.statusCode}`);
					}
					throw new Error(`Error in actor ${activity.actor} - ${err.statusCode}`);
				}
			}
		}

		// それでもわからなければ終了
		if (authUser == null) {
			throw new Bull.UnrecoverableError('skip: failed to resolve user');
		}

		// publicKey がなくても終了
		if (authUser.key == null) {
			throw new Bull.UnrecoverableError('skip: failed to resolve user publicKey');
		}

		// HTTP-Signatureの検証
		let httpSignatureValidated = httpSignature.verifySignature(signature, authUser.key.keyPem);

		// If signature validation failed, try refetching the actor
		if (!httpSignatureValidated) {
			authUser.key = await this.apDbResolverService.refetchPublicKeyForApId(authUser.user);

			if (authUser.key == null) {
				throw new Bull.UnrecoverableError('skip: failed to re-resolve user publicKey');
			}

			httpSignatureValidated = httpSignature.verifySignature(signature, authUser.key.keyPem);
		}

		// また、signatureのsignerは、activity.actorと一致する必要がある
		if (!httpSignatureValidated || authUser.user.uri !== activity.actor) {
			// 一致しなくても、でもLD-Signatureがありそうならそっちも見る
			const ldSignature = activity.signature;
			if (ldSignature) {
				if (ldSignature.type !== 'RsaSignature2017') {
					throw new Bull.UnrecoverableError(`skip: unsupported LD-signature type ${ldSignature.type}`);
				}

				// ldSignature.creator: https://example.oom/users/user#main-key
				// みたいになっててUserを引っ張れば公開キーも入ることを期待する
				if (ldSignature.creator) {
					const candicate = ldSignature.creator.replace(/#.*/, '');
					await this.apPersonService.resolvePerson(candicate).catch(() => null);
				}

				// keyIdからLD-Signatureのユーザーを取得
				authUser = await this.apDbResolverService.getAuthUserFromKeyId(ldSignature.creator);
				if (authUser == null) {
					throw new Bull.UnrecoverableError('skip: LD-Signatureのユーザーが取得できませんでした');
				}

				if (authUser.key == null) {
					throw new Bull.UnrecoverableError('skip: LD-SignatureのユーザーはpublicKeyを持っていませんでした');
				}

				const jsonLd = this.jsonLdService.use();

				// LD-Signature検証
				const verified = await jsonLd.verifyRsaSignature2017(activity, authUser.key.keyPem).catch(() => false);
				if (!verified) {
					throw new Bull.UnrecoverableError('skip: LD-Signatureの検証に失敗しました');
				}

				// アクティビティを正規化
				delete activity.signature;
				try {
					activity = await jsonLd.compact(activity) as IActivity;
				} catch (e) {
					throw new Bull.UnrecoverableError(`skip: failed to compact activity: ${e}`);
				}
				// TODO: 元のアクティビティと非互換な形に正規化される場合は転送をスキップする
				// https://github.com/mastodon/mastodon/blob/664b0ca/app/services/activitypub/process_collection_service.rb#L24-L29
				activity.signature = ldSignature;

				//#region Log
				const compactedInfo = Object.assign({}, activity);
				delete compactedInfo['@context'];
				this.logger.debug(`compacted: ${JSON.stringify(compactedInfo, null, 2)}`);
				//#endregion

				// もう一度actorチェック
				if (authUser.user.uri !== activity.actor) {
					throw new Bull.UnrecoverableError(`skip: LD-Signature user(${authUser.user.uri}) !== activity.actor(${activity.actor})`);
				}

				const ldHost = this.utilityService.extractDbHost(authUser.user.uri);
				if (!this.utilityService.isFederationAllowedHost(ldHost)) {
					throw new Bull.UnrecoverableError(`Blocked request: ${ldHost}`);
				}
			} else {
				throw new Bull.UnrecoverableError(`skip: http-signature verification failed and no LD-Signature. keyId=${signature.keyId}`);
			}
		}

		// activity.idがあればホストが署名者のホストであることを確認する
		if (typeof activity.id === 'string') {
			const signerHost = this.utilityService.extractDbHost(authUser.user.uri!);
			const activityIdHost = this.utilityService.extractDbHost(activity.id);
			if (signerHost !== activityIdHost) {
				throw new Bull.UnrecoverableError(`skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`);
			}
		} else {
			throw new Bull.UnrecoverableError('skip: activity id is not a string');
		}

		this.apRequestChart.inbox();
		this.federationChart.inbox(authUser.user.host);

		// Update instance stats
		process.nextTick(async () => {
			const i = await (this.meta.enableStatsForFederatedInstances
				? this.federatedInstanceService.fetchOrRegister(authUser.user.host)
				: this.federatedInstanceService.fetch(authUser.user.host));

			if (i == null) return;

			this.updateInstanceQueue.enqueue(i.id, {
				latestRequestReceivedAt: new Date(),
				shouldUnsuspend: i.suspensionState === 'autoSuspendedForNotResponding',
			});

			if (this.meta.enableChartsForFederatedInstances) {
				this.instanceChart.requestReceived(i.host);
			}

			this.fetchInstanceMetadataService.fetchInstanceMetadata(i);
		});

		// アクティビティを処理
		try {
			const result = await this.apInboxService.performActivity(authUser.user, activity);
			if (result && !result.startsWith('ok')) {
				this.logger.warn(`inbox activity ignored (maybe): id=${activity.id} reason=${result}`);
				return result;
			}
		} catch (e) {
			if (e instanceof IdentifiableError) {
				if (e.id === '689ee33f-f97c-479a-ac49-1b9f8140af99') {
					return 'blocked notes with prohibited words';
				}
				if (e.id === '85ab9bd7-3a41-4530-959d-f07073900109') {
					return 'actor has been suspended';
				}
				if (e.id === 'd450b8a9-48e4-4dab-ae36-f4db763fda7c') { // invalid Note
					return e.message;
				}
			}
			throw e;
		}
		return 'ok';
	}

	@bindThis
	public collapseUpdateInstanceJobs(oldJob: UpdateInstanceJob, newJob: UpdateInstanceJob) {
		const latestRequestReceivedAt = oldJob.latestRequestReceivedAt < newJob.latestRequestReceivedAt
			? newJob.latestRequestReceivedAt
			: oldJob.latestRequestReceivedAt;
		const shouldUnsuspend = oldJob.shouldUnsuspend || newJob.shouldUnsuspend;
		return {
			latestRequestReceivedAt,
			shouldUnsuspend,
		};
	}

	@bindThis
	public async performUpdateInstance(id: string, job: UpdateInstanceJob) {
		await this.federatedInstanceService.update(id, {
			latestRequestReceivedAt: new Date(),
			isNotResponding: false,
			// もしサーバーが死んでるために配信が止まっていた場合には自動的に復活させてあげる
			suspensionState: job.shouldUnsuspend ? 'none' : undefined,
		});
	}

	@bindThis
	public async dispose(): Promise<void> {
		await this.updateInstanceQueue.performAllNow();
	}

	@bindThis
	async onApplicationShutdown(signal?: string) {
		await this.dispose();
	}
}
