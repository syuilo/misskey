import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { readNotification } from '../../common/read-notification';
import { ApiError } from '../../error';

export const meta = {
	desc: {
		'ja-JP': '通知を既読にします。',
		'en-US': 'Mark a notification as read.'
	},

	tags: ['notifications', 'account'],

	requireCredential: true as const,

	kind: 'write:notifications',

	params: {
		notificationId: {
			validator: $.optional.type(ID),
			desc: {
				'ja-JP': '対象の通知のID',
				'en-US': 'Target notification ID.'
			}
		},

		notificationIds: {
			validator: $.optional.arr($.type(ID)),
			desc: {
				'ja-JP': '対象の通知のIDの配列',
				'en-US': 'Target notification IDs.'
			}
		}
	},

	errors: {
		noNotificationRequested: {
			message: 'You requested no notification.',
			code: 'NO_NOTIFICATION_REQUESTED',
			id: '1dee2109-b88b-21cf-3935-607dad60f5b0'
		},
	},
};

export default define(meta, async (ps, user) => {
	let notificationIds = [] as string[];

	if (ps.notificationId) notificationIds.push(ps.notificationId);
	if (ps.notificationIds) notificationIds = notificationIds.concat(ps.notificationIds);

	if (notificationIds.length === 0) {
		throw new ApiError(meta.errors.noNotificationRequested);
	}

	return readNotification(user.id, notificationIds);
});
