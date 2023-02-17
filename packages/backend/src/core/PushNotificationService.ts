import { Inject, Injectable } from '@nestjs/common';
import push from 'web-push';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { Packed } from '@/misc/schema';
import { getNoteSummary } from '@/misc/get-note-summary.js';
import type { SwSubscriptionsRepository } from '@/models/index.js';
import { MetaService } from '@/core/MetaService.js';
import { bindThis } from '@/decorators.js';

// Defined also packages/sw/types.ts#L13
type pushNotificationsTypes = {
	'notification': Packed<'Notification'>;
	'unreadAntennaNote': {
		antenna: { id: string, name: string };
		note: Packed<'Note'>;
	};
	'readNotifications': { notificationIds: string[] };
	'readAllNotifications': undefined;
	'readAntenna': { antennaId: string };
	'readAllAntennas': undefined;
};

type bodyWithNotes = pushNotificationsTypes['notification' | 'unreadAntennaNote'];
function hasNote(body: pushNotificationsTypes[keyof pushNotificationsTypes]): body is bodyWithNotes {
	return typeof body === 'object' && 'note' in body;
}
function hasRenoteType(body: bodyWithNotes): body is pushNotificationsTypes['notification'] {
	return 'type' in body && body.type === 'renote';
}

// Reduce length because push message servers have character limits
function truncateBody<T extends keyof pushNotificationsTypes>(type: T, body: pushNotificationsTypes[T]): pushNotificationsTypes[T] {
	if (body === undefined) return body;

	return {
		...body,
		...((hasNote(body) && body.note) ? {
			note: {
				...body.note,
				// textをgetNoteSummaryしたものに置き換える
				text: getNoteSummary((hasRenoteType(body) && body.note.renote) ? body.note.renote : body.note),

				cw: undefined,
				reply: undefined,
				renote: undefined,
				user: type === 'notification' ? undefined as any : body.note.user,
			},
		} : {}),
	};
}

@Injectable()
export class PushNotificationService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,

		private metaService: MetaService,
	) {
	}

	@bindThis
	public async pushNotification<T extends keyof pushNotificationsTypes>(userId: string, type: T, body: pushNotificationsTypes[T]) {
		const meta = await this.metaService.fetch();
	
		if (!meta.enableServiceWorker || meta.swPublicKey == null || meta.swPrivateKey == null) return;
	
		// アプリケーションの連絡先と、サーバーサイドの鍵ペアの情報を登録
		push.setVapidDetails(this.config.url,
			meta.swPublicKey,
			meta.swPrivateKey);
	
		// Fetch
		const subscriptions = await this.swSubscriptionsRepository.findBy({
			userId: userId,
		});
	
		for (const subscription of subscriptions) {
			// Continue if sendReadMessage is false
			if ([
				'readNotifications',
				'readAllNotifications',
				'readAntenna',
				'readAllAntennas',
			].includes(type) && !subscription.sendReadMessage) continue;

			const pushSubscription = {
				endpoint: subscription.endpoint,
				keys: {
					auth: subscription.auth,
					p256dh: subscription.publickey,
				},
			};

			push.sendNotification(pushSubscription, JSON.stringify({
				type,
				body: (type === 'notification' || type === 'unreadAntennaNote') ? truncateBody(type, body) : body,
				userId,
				dateTime: (new Date()).getTime(),
			}), {
				proxy: this.config.proxy,
			}).catch((err: any) => {
				//swLogger.info(err.statusCode);
				//swLogger.info(err.headers);
				//swLogger.info(err.body);
	
				if (err.statusCode === 410) {
					this.swSubscriptionsRepository.delete({
						userId: userId,
						endpoint: subscription.endpoint,
						auth: subscription.auth,
						publickey: subscription.publickey,
					});
				}
			});
		}
	}
}
