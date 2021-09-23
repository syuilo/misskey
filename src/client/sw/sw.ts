/**
 * Service Worker
 */
declare var self: ServiceWorkerGlobalScope;

import { createEmptyNotification, createNotification } from '@client/sw/create-notification';
import { swLang } from '@client/sw/lang';
import { swNotificationRead } from '@client/sw/notification-read';
import { pushNotificationDataMap } from '@client/sw/types';
import * as swos from './operations';
import { getAcct } from '@/misc/acct';

//#region Lifecycle: Install
self.addEventListener('install', ev => {
	ev.waitUntil(self.skipWaiting());
});
//#endregion

//#region Lifecycle: Activate
self.addEventListener('activate', ev => {
	ev.waitUntil(
		caches.keys()
			.then(cacheNames => Promise.all(
				cacheNames
					.filter((v) => v !== swLang.cacheName)
					.map(name => caches.delete(name))
			))
			.then(() => self.clients.claim())
	);
});
//#endregion

//#region When: Fetching
self.addEventListener('fetch', ev => {
	ev.respondWith(
		fetch(ev.request)
		.catch(() => new Response(`Offline. Service Worker @${_VERSION_}`, { status: 200 }))
	);
});
//#endregion

//#region When: Caught Notification
self.addEventListener('push', ev => {
	// クライアント取得
	ev.waitUntil(self.clients.matchAll({
		includeUncontrolled: true,
		type: 'window'
	}).then(async <K extends keyof pushNotificationDataMap>(clients: readonly WindowClient[]) => {
		// // クライアントがあったらストリームに接続しているということなので通知しない
		// if (clients.length != 0) return;

		const data: pushNotificationDataMap[K] = ev.data?.json();

		switch (data.type) {
			// case 'driveFileCreated':
			case 'notification':
			case 'unreadMessagingMessage':
				return createNotification(data);

			case 'readAllNotifications':
				for (const n of await self.registration.getNotifications()) {
					if (n?.data?.type === 'notification') n.close();
				}
				break;
			case 'readAllMessagingMessages':
				for (const n of await self.registration.getNotifications()) {
					if (n?.data?.type === 'unreadMessagingMessage') n.close();
				}
				break;
			case 'readNotifications':
				for (const n of await self.registration.getNotifications()) {
					if (data.body?.notificationIds?.includes(n.data.body.id)) {
						n.close();
					}
				}
				break;
			case 'readAllMessagingMessagesOfARoom':
				for (const n of await self.registration.getNotifications()) {
					if (n.data.type === 'unreadMessagingMessage'
						&& ('userId' in data.body
							? data.body.userId === n.data.body.userId
							: data.body.groupId === n.data.body.groupId)
						) {
							n.close();
						}
				}
				break;
		}

		createEmptyNotification();
	}));
});
//#endregion

//#region Notification
self.addEventListener('notificationclick', <K extends keyof pushNotificationDataMap>(ev: NotificationEvent) => {
	ev.waitUntil((async () => {

	if (_DEV_) {
		console.log('notificationclick', ev.action, ev.notification.data);
	}

	const { action, notification } = ev;
	const data: pushNotificationDataMap[K] = notification.data;
	const { userId: id } = data;
	let client: WindowClient | null = null;

	switch (data.type) {
		case 'notification':
			switch (action) {
				case 'follow':
					if ('userId' in data.body) await swos.api('following/create', id, { userId: data.body.userId });
					break;
				case 'showUser':
					if ('user' in data.body) client = await swos.openUser(getAcct(data.body.user), id);
					break;
				case 'reply':
					if ('note' in data.body) client = await swos.openPost({ reply: data.body.note }, id);
					break;
				case 'renote':
					if ('note' in data.body) await swos.api('notes/create', id, { renoteId: data.body.note.id });
					break;
				case 'accept':
					switch (data.body.type) {
						case 'receiveFollowRequest':
							await swos.api('following/requests/accept', id, { userId: data.body.userId });
							break;
						case 'groupInvited':
							await swos.api('users/groups/invitations/accept', id, { invitationId: data.body.invitation.id });
							break;
					}
					break;
				case 'reject':
					switch (data.body.type) {
						case 'receiveFollowRequest':
							await swos.api('following/requests/reject', id, { userId: data.body.userId });
							break;
						case 'groupInvited':
							await swos.api('users/groups/invitations/reject', id, { invitationId: data.body.invitation.id });
							break;
					}
					break;
				case 'showFollowRequests':
					client = await swos.openClient('push', '/my/follow-requests', id);
					break;
				default:
					switch (data.body.type) {
						case 'receiveFollowRequest':
							client = await swos.openClient('push', '/my/follow-requests', id);
							break;
						case 'groupInvited':
							client = await swos.openClient('push', '/my/groups', id);
							break;
						case 'reaction':
							client = await swos.openNote(data.body.note.id, id);
							break;
						default:
							if ('note' in data.body) {
								client = await swos.openNote(data.body.note.id, id);
							} else if ('user' in data.body) {
								client = await swos.openUser(getAcct(data.body.user), id);
							}
							break;
					}
			}
			break;
		case 'unreadMessagingMessage':
			client = await swos.openChat(data.body, id);
			break;
	}

	if (client) {
		client.focus();
	}
	if (data.type === 'notification') {
		swNotificationRead.then(that => that.read(data));
	}

	notification.close();

	})());
});

self.addEventListener('notificationclose', <K extends keyof pushNotificationDataMap>(ev: NotificationEvent) => {
	const data: pushNotificationDataMap[K] = ev.notification.data;

	if (data.type === 'notification') {
		swNotificationRead.then(that => that.read(data));
	}
});
//#endregion

//#region When: Caught a message from the client
self.addEventListener('message', async ev => {
	switch (ev.data) {
		case 'clear':
			// Cache Storage全削除
			await caches.keys()
				.then(cacheNames => Promise.all(
					cacheNames.map(name => caches.delete(name))
				));
			return; // TODO
	}

	if (typeof ev.data === 'object') {
		// E.g. '[object Array]' → 'array'
		const otype = Object.prototype.toString.call(ev.data).slice(8, -1).toLowerCase();

		if (otype === 'object') {
			if (ev.data.msg === 'initialize') {
				swLang.setLang(ev.data.lang);
			}
		}
	}
});
//#endregion
