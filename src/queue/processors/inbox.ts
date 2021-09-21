import { URL } from 'url';
import * as Bull from 'bull';
import * as httpSignature from 'http-signature';
import perform from '@/remote/activitypub/perform';
import Logger from '@/services/logger';
import { registerOrFetchInstanceDoc } from '@/services/register-or-fetch-instance-doc';
import { Instances } from '@/models/index';
import { instanceChart } from '@/services/chart/index';
import { fetchMeta } from '@/misc/fetch-meta';
import { toPuny, extractDbHost } from '@/misc/convert-host';
import { getApId } from '@/remote/activitypub/type';
import { fetchInstanceMetadata } from '@/services/fetch-instance-metadata';
import { InboxJobData } from '../types';
import DbResolver from '@/remote/activitypub/db-resolver';
import { resolvePerson } from '@/remote/activitypub/models/person';
import { LdSignature } from '@/remote/activitypub/misc/ld-signature';
import { StatusError } from '@/misc/fetch';

const logger = new Logger('inbox');

// ユーザーのinboxにアクティビティが届いた時の処理
export default async (job: Bull.Job<InboxJobData>): Promise<string> => {
	const signature = job.data.signature;	// HTTP-signature
	const activity = job.data.activity;

	//#region Log
	const info = Object.assign({}, activity) as any;
	delete info['@context'];
	logger.debug(JSON.stringify(info, null, 2));
	//#endregion

	const host = toPuny(new URL(signature.keyId).hostname);

	// ブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(host)) {
		return `Blocked request: ${host}`;
	}

	const keyIdLower = signature.keyId.toLowerCase();
	if (keyIdLower.startsWith('acct:')) {
		return `Old keyId is no longer supported. ${keyIdLower}`;
	}

	// TDOO: キャッシュ
	const dbResolver = new DbResolver();

	// HTTP-Signature keyIdを元にDBから取得
	let authUser = await dbResolver.getAuthUserFromKeyId(signature.keyId);

	// keyIdでわからなければ、activity.actorを元にDBから取得 || activity.actorを元にリモートから取得
	if (authUser == null) {
		try {
			authUser = await dbResolver.getAuthUserFromApId(getApId(activity.actor));
		} catch (e) {
			// 対象が4xxならスキップ
			if (e instanceof StatusError && e.isClientError) {
				return `skip: Ignored deleted actors on both ends ${activity.actor} - ${e.statusCode}`;
			}
			throw `Error in actor ${activity.actor} - ${e.statusCode || e}`;
		}
	}

	// それでもわからなければ終了
	if (authUser == null) {
		return `skip: failed to resolve user`;
	}

	// publicKey がなくても終了
	if (authUser.key == null) {
		return `skip: failed to resolve user publicKey`;
	}

	// HTTP-Signatureの検証
	const httpSignatureValidated = httpSignature.verifySignature(signature, authUser.key.keyPem);

	// また、signatureのsignerは、activity.actorと一致する必要がある
	if (!httpSignatureValidated || authUser.user.uri !== activity.actor) {
		// 一致しなくても、でもLD-Signatureがありそうならそっちも見る
		if (activity.signature) {
			if (activity.signature.type !== 'RsaSignature2017') {
				return `skip: unsupported LD-signature type ${activity.signature.type}`;
			}

			// activity.signature.creator: https://example.oom/users/user#main-key
			// みたいになっててUserを引っ張れば公開キーも入ることを期待する
			if (activity.signature.creator) {
				const candicate = activity.signature.creator.replace(/#.*/, '');
				await resolvePerson(candicate).catch(() => null);
			}

			// keyIdからLD-Signatureのユーザーを取得
			authUser = await dbResolver.getAuthUserFromKeyId(activity.signature.creator);
			if (authUser == null) {
				return `skip: LD-Signatureのユーザーが取得できませんでした`;
			}

			if (authUser.key == null) {
				return `skip: LD-SignatureのユーザーはpublicKeyを持っていませんでした`;
			}

			// LD-Signature検証
			const ldSignature = new LdSignature();
			const verified = await ldSignature.verifyRsaSignature2017(activity, authUser.key.keyPem).catch(() => false);
			if (!verified) {
				return `skip: LD-Signatureの検証に失敗しました`;
			}

			// もう一度actorチェック
			if (authUser.user.uri !== activity.actor) {
				return `skip: LD-Signature user(${authUser.user.uri}) !== activity.actor(${activity.actor})`;
			}

			// ブロックしてたら中断
			const ldHost = extractDbHost(authUser.user.uri);
			if (meta.blockedHosts.includes(ldHost)) {
				return `Blocked request: ${ldHost}`;
			}
		} else {
			return `skip: http-signature verification failed and no LD-Signature. keyId=${signature.keyId}`;
		}
	}

	// activity.idがあればホストが署名者のホストであることを確認する
	if (typeof activity.id === 'string') {
		const signerHost = extractDbHost(authUser.user.uri!);
		const activityIdHost = extractDbHost(activity.id);
		if (signerHost !== activityIdHost) {
			return `skip: signerHost(${signerHost}) !== activity.id host(${activityIdHost}`;
		}
	}

	// Update stats
	registerOrFetchInstanceDoc(authUser.user.host).then(i => {
		Instances.update(i.id, {
			latestRequestReceivedAt: new Date(),
			lastCommunicatedAt: new Date(),
			isNotResponding: false
		});

		fetchInstanceMetadata(i);

		instanceChart.requestReceived(i.host);
	});

	// アクティビティを処理
	await perform(authUser.user, activity);
	return `ok`;
};
