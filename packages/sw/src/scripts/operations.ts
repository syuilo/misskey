/*
 * Operations
 * 各種操作
 */
import * as Misskey from 'misskey-js';
import { SwMessage, SwMessageOrderType } from '@/types';
import { getAccountFromId } from '@/scripts/get-account-from-id';
import { getUrlWithLoginId } from '@/scripts/login-id';

export const cli = new Misskey.api.APIClient({ origin, fetch: (...args) => fetch(...args) });

export async function api<E extends keyof Misskey.Endpoints>(endpoint: E, userId: string, options?: Misskey.Endpoints[E]['req']) {
	const account = await getAccountFromId(userId);
	if (!account) return;

	return cli.request(endpoint, options, account.token);
}

// mark-all-as-read送出を1秒間隔に制限する
const readBlockingStatus = new Map<string, boolean>();
export function sendMarkAllAsRead(userId: string): Promise<null | undefined | void> {
	if (readBlockingStatus.get(userId)) return Promise.resolve();
	readBlockingStatus.set(userId, true);
	return new Promise(resolve => {
		setTimeout(() => {
			readBlockingStatus.set(userId, false);
			api('notifications/mark-all-as-read', userId)
				.then(resolve, resolve);
		}, 1000);
	});
}

// rendered acctからユーザーを開く
export function openUser(acct: string, loginId?: string) {
	return openClient('push', `/@${acct}`, loginId, { acct });
}

// noteIdからノートを開く
export function openNote(noteId: string, loginId?: string) {
	return openClient('push', `/notes/${noteId}`, loginId, { noteId });
}

// noteIdからノートを開く
export function openAntenna(antennaId: string, loginId: string) {
	return openClient('push', `/timeline/antenna/${antennaId}`, loginId, { antennaId });
}

// post-formのオプションから投稿フォームを開く
export async function openPost(options: { initialText?: string; reply?: Misskey.entities.Note; renote?: Misskey.entities.Note }, loginId?: string) {
	// クエリを作成しておく
	let url = '/share';
	const query = new URLSearchParams();
	if (options.initialText) query.set('text', options.initialText);
	if (options.reply) query.set('replyId', options.reply.id);
	if (options.renote) query.set('renoteId', options.renote.id);

	return openClient('post', `${url}?${query}`, loginId, { options });
}

export async function openClient(order: SwMessageOrderType, url: string, loginId?: string, query: Record<string, SwMessage[string]> = {}) {
	const client = await findClient();

	if (client) {
		client.postMessage({ type: 'order', ...query, order, loginId, url } satisfies SwMessage);
		return client;
	}

	return globalThis.clients.openWindow(loginId ? getUrlWithLoginId(url, loginId) : url);
}

export async function findClient() {
	const clients = await globalThis.clients.matchAll({
		type: 'window',
	});
	return clients.find(c => !(new URL(c.url)).searchParams.has('zen')) ?? null;
}
