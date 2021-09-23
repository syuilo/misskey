import * as Misskey from 'misskey-js';

export type swMessageOrderType = 'post' | 'push';

export type SwMessage = {
	type: 'order';
	order: swMessageOrderType;
	loginId: string;
	url: string;
	[x: string]: any;
};

// Defined also @/services/push-notification.ts#L7-L14
type pushNotificationDataSourceMap = {
	notification: Misskey.entities.Notification;
	unreadMessagingMessage: Misskey.entities.MessagingMessage;
	readNotifications: { notificationIds: string[] };
	readAllNotifications: undefined;
	readAllMessagingMessages: undefined;
	readAllMessagingMessagesOfARoom: { userId: string } | { groupId: string };
};

export type pushNotificationData<K extends keyof pushNotificationDataSourceMap> = {
	type: K;
	body: pushNotificationDataSourceMap[K];
	userId: string;
};

export type pushNotificationDataMap = {
	[K in keyof pushNotificationDataSourceMap]: pushNotificationData<K>;
};
