import { publishMainStream } from '@/services/stream';
import { pushNotification } from '@/services/push-notification';
import { User } from '@/models/entities/user';
import { Notification } from '@/models/entities/notification';
import { Notifications, Users } from '@/models/index';
import { In } from 'typeorm';

export async function readNotification(
	userId: User['id'],
	notificationIds: Notification['id'][]
) {
	// Update documents
	await Notifications.update({
		id: In(notificationIds),
		isRead: false
	}, {
		isRead: true
	});

	if (!await Users.getHasUnreadNotification(userId)) return postReadAllNotifications(userId);
	else return postReadNotifications(userId, notificationIds);
}

export async function readNotificationByQuery(
	userId: User['id'],
	query: Record<string, any>
) {
	const notificationIds = await Notifications.find({
		...query,
		notifieeId: userId,
		isRead: false
	}).then(notifications => notifications.map(notification => notification.id));

	return readNotification(userId, notificationIds);
}

function postReadAllNotifications(userId: User['id']) {
	publishMainStream(userId, 'readAllNotifications');
	return pushNotification(userId, 'readAllNotifications', undefined);
}

function postReadNotifications(userId: User['id'], notificationIds: Notification['id'][]) {
	publishMainStream(userId, 'readNotifications', notificationIds);
	return pushNotification(userId, 'readNotifications', { notificationIds });
}
