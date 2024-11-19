/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URL } from 'node:url';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Bull from 'bullmq';
import { verifyDraftSignature } from '@misskey-dev/node-http-message-signatures';
import type Logger from '@/logger.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { FetchInstanceMetadataService } from '@/core/FetchInstanceMetadataService.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import FederationChart from '@/core/chart/charts/federation.js';
import { getApId } from '@/core/activitypub/type.js';
import type { IActivity } from '@/core/activitypub/type.js';
import { ApDbResolverService } from '@/core/activitypub/ApDbResolverService.js';
import { StatusError } from '@/misc/status-error.js';
import * as Acct from '@/misc/acct.js';
import { UtilityService } from '@/core/UtilityService.js';
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
		const signature = job.data.signature ?
			'version' in job.data.signature ? job.data.signature.value : job.data.signature
			: null;
		if (Array.isArray(signature)) {
			// RFC 9401はsignatureが配列になるが、とりあえずエラーにする
			throw new Error('signature is array');
		}
		let activity = job.data.activity;
		let actorUri = getApId(activity.actor);

		//#region Log
		const info = Object.assign({}, activity);
		delete info['@context'];
		this.logger.debug(JSON.stringify(info, null, 2));
		//#endregion

		const host = this.utilityService.toPuny(new URL(actorUri).hostname);

		if (!this.utilityService.isFederationAllowedHost(host)) {
			return `Blocked request: ${host}`;
		}

		// HTTP-Signature keyIdを元にDBから取得
		let authUser: Awaited<ReturnType<typeof this.apDbResolverService.getAuthUserFromApId>> = null;
		let httpSignatureIsValid = null as boolean | null;

		try {
			authUser = await this.apDbResolverService.getAuthUserFromApId(actorUri, signature?.keyId);
		} catch (err) {
			// 対象が4xxならスキップ
			if (err instanceof StatusError) {
				if (!err.isRetryable) {
					throw new Bull.UnrecoverableError(`skip: Ignored deleted actors on both ends ${activity.actor} - ${err.statusCode}`);
				}
				throw new Error(`Error in actor ${activity.actor} - ${err.statusCode}`);
			}
		}

		// authUser.userがnullならスキップ
		if (authUser != null && authUser.user == null) {
			throw new Bull.UnrecoverableError('skip: failed to resolve user');
		}

		if (signature != null && authUser != null) {
			if (signature.keyId.toLowerCase().startsWith('acct:')) {
				this.logger.warn(`Old keyId is no longer supported. lowerKeyId=${signature.keyId.toLowerCase()}`);
			} else if (authUser.key != null) {
				// keyがなかったらLD Signatureで検証するべき
				// HTTP-Signatureの検証
				const errorLogger = (ms: any) => this.logger.error(ms);
				httpSignatureIsValid = await verifyDraftSignature(signature, authUser.key.keyPem, errorLogger);
				this.logger.debug('Inbox message validation: ', {
					userId: authUser.user.id,
					userAcct: Acct.toString(authUser.user),
					parsedKeyId: signature.keyId,
					foundKeyId: authUser.key.keyId,
					httpSignatureValid: httpSignatureIsValid,
				});
			}
		}

		if (
			authUser == null ||
			httpSignatureIsValid !== true ||
			authUser.user.uri !== actorUri // 一応チェック
		) {
			// 一致しなくても、でもLD-Signatureがありそうならそっちも見る
			const ldSignature = activity.signature;

			if (ldSignature && ldSignature.creator) {
				if (ldSignature.type !== 'RsaSignature2017') {
					throw new Bull.UnrecoverableError(`skip: unsupported LD-signature type ${ldSignature.type}`);
				}

				if (ldSignature.creator.toLowerCase().startsWith('acct:')) {
					throw new Bull.UnrecoverableError(`old key not supported ${ldSignature.creator}`);
				}

				authUser = await this.apDbResolverService.getAuthUserFromApId(actorUri, ldSignature.creator);

				if (authUser == null) {
					throw new Bull.UnrecoverableError(`skip: LD-Signatureのactorとcreatorが一致しませんでした uri=${actorUri} creator=${ldSignature.creator}`);
				}
				if (authUser.user == null) {
					throw new Bull.UnrecoverableError(`skip: LD-Signatureのユーザーが取得できませんでした uri=${actorUri} creator=${ldSignature.creator}`);
				}
				// 一応actorチェック
				if (authUser.user.uri !== actorUri) {
					throw new Bull.UnrecoverableError(`skip: LD-Signature user(${authUser.user.uri}) !== activity.actor(${actorUri})`);
				}
				if (authUser.key == null) {
					throw new Bull.UnrecoverableError(`skip: LD-SignatureのユーザーはpublicKeyを持っていませんでした uri=${actorUri} creator=${ldSignature.creator}`);
				}

				const jsonLd = this.jsonLdService.use();

				// LD-Signature検証
				const verified = await jsonLd.verifyRsaSignature2017(activity, authUser.key.keyPem).catch(() => false);
				if (!verified) {
					throw new Bull.UnrecoverableError('skip: LD-Signatureの検証に失敗しました');
				}

				// ブロックしてたら中断
				const ldHost = this.utilityService.extractDbHost(authUser.user.uri);
				if (this.utilityService.isFederationAllowedHost(ldHost)) {
					throw new Bull.UnrecoverableError(`Blocked request: ${ldHost}`);
				}

				// アクティビティを正規化
				// GHSA-2vxv-pv3m-3wvj
				delete activity.signature;
				try {
					activity = await jsonLd.compact(activity) as IActivity;
				} catch (e) {
					throw new Bull.UnrecoverableError(`skip: failed to compact activity: ${e}`);
				}

				// actorが正規化前後で一致しているか確認
				actorUri = getApId(activity.actor);
				if (authUser.user.uri !== actorUri) {
					throw new Bull.UnrecoverableError(`skip: LD-Signature user(${authUser.user.uri}) !== activity(after normalization).actor(${actorUri})`);
				}

				// TODO: 元のアクティビティと非互換な形に正規化される場合は転送をスキップする
				// https://github.com/mastodon/mastodon/blob/664b0ca/app/services/activitypub/process_collection_service.rb#L24-L29
				activity.signature = ldSignature;

				//#region Log
				const compactedInfo = Object.assign({}, activity);
				delete compactedInfo['@context'];
				this.logger.debug(`compacted: ${JSON.stringify(compactedInfo, null, 2)}`);
				//#endregion
			} else {
				throw new Error(`http-signature verification failed and no LD-Signature. http_signature_keyId=${signature?.keyId}`);
			}
		}

		// activity.idがあればホストが署名者のホストであることを確認する
		if (typeof activity.id === 'string') {
			const signerHost = this.utilityService.extractDbHost(authUser.user.uri!);
			const activityIdHost = this.utilityService.extractDbHost(activity.id);
			if (signerHost !== activityIdHost) {
				throw new Bull.UnrecoverableError(`skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`);
			}
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
