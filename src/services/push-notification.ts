import * as push from 'web-push';
import config from '@/config/index';
import { SwSubscriptions } from '@/models/index';
import { fetchMeta } from '@/misc/fetch-meta';
import { Packed } from '@/misc/schema';

// Defined also @client/sw/types.ts#L14-L21
type pushNotificationsTypes = {
	'notification': Packed<'Notification'>;
	'unreadMessagingMessage': Packed<'MessagingMessage'>;
	'readNotifications': { notificationIds: string[] };
	'readAllNotifications': undefined;
	'readAllMessagingMessages': undefined;
	'readAllMessagingMessagesOfARoom': { userId: string } | { groupId: string };
};

export async function pushNotification<T extends keyof pushNotificationsTypes>(userId: string, type: T, body: pushNotificationsTypes[T]) {
	const meta = await fetchMeta();

	if (!meta.enableServiceWorker || meta.swPublicKey == null || meta.swPrivateKey == null) return;

	// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
	push.setVapidDetails(config.url,
		meta.swPublicKey,
		meta.swPrivateKey);

	// Fetch
	const subscriptions = await SwSubscriptions.find({
		userId: userId
	});

	for (const subscription of subscriptions) {
		const pushSubscription = {
			endpoint: subscription.endpoint,
			keys: {
				auth: subscription.auth,
				p256dh: subscription.publickey
			}
		};

		push.sendNotification(pushSubscription, JSON.stringify({
			type, body, userId
		}), {
			proxy: config.proxy
		}).catch((err: any) => {
			//swLogger.info(err.statusCode);
			//swLogger.info(err.headers);
			//swLogger.info(err.body);

			if (err.statusCode === 410) {
				SwSubscriptions.delete({
					userId: userId,
					endpoint: subscription.endpoint,
					auth: subscription.auth,
					publickey: subscription.publickey
				});
			}
		});
	}
}
