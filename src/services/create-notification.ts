import { publishMainStream } from './stream';
import pushSw from './push-notification';
import { Notifications, Mutings } from '../models';
import { genId } from '../misc/gen-id';
import { User } from '../models/entities/user';
import { Note } from '../models/entities/note';
import { Notification } from '../models/entities/notification';

export async function createNotification(
	notifieeId: User['id'],
	notifierId: User['id'],
	type: string,
	content?: {
		noteId?: Note['id'];
		reaction?: string;
	}
) {
	if (notifieeId === notifierId) {
		return null;
	}

	const data = {
		id: genId(),
		createdAt: new Date(),
		notifieeId: notifieeId,
		notifierId: notifierId,
		type: type,
		isRead: false,
	} as Partial<Notification>;

	if (content) {
		if (content.noteId) data.noteId = content.noteId;
		if (content.reaction) data.reaction = content.reaction;
	}

	// Create notification
	const notification = await Notifications.save(data);

	const packed = await Notifications.pack(notification);

	// Publish notification event
	publishMainStream(notifieeId, 'notification', packed);

	// 2秒経っても(今回作成した)通知が既読にならなかったら「未読の通知がありますよ」イベントを発行する
	setTimeout(async () => {
		const fresh = await Notifications.findOne(notification.id);
		if (!fresh.isRead) {
			//#region ただしミュートしているユーザーからの通知なら無視
			const mutings = await Mutings.find({
				muterId: notifieeId
			});
			const mutedUserIds = mutings.map(m => m.muteeId);
			if (mutedUserIds.includes(notifierId)) {
				return;
			}
			//#endregion

			publishMainStream(notifieeId, 'unreadNotification', packed);

			pushSw(notifieeId, 'notification', packed);
		}
	}, 2000);

	return notification;
}
