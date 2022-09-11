import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { readNotification } from '../../common/read-notification.js';

export const meta = {
	tags: ['notifications', 'account'],

	requireCredential: true,

	kind: 'write:notifications',

	description: 'Mark a notification as read.',

	errors: {
		noSuchNotification: {
			message: 'No such notification.',
			code: 'NO_SUCH_NOTIFICATION',
			id: 'efa929d5-05b5-47d1-beec-e6a4dbed011e',
		},
	},
} as const;

export const paramDef = {
	oneOf: [
		{
			type: 'object',
			properties: {
				notificationId: { type: 'string', format: 'misskey:id' },
			},
			required: ['notificationId'],
		},
		{
			type: 'object',
			properties: {
				notificationIds: {
					type: 'array',
					items: { type: 'string', format: 'misskey:id' },
					maxItems: 100,
				},
			},
			required: ['notificationIds'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			if ('notificationId' in ps) return readNotification(me.id, [ps.notificationId]);
			return readNotification(me.id, ps.notificationIds);
		});
	}
}
