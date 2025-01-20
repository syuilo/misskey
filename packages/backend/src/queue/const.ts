/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Config } from '@/config.js';
import type * as Bull from 'bullmq';

export const QUEUE = {
	DELIVER: 'deliver',
	INBOX: 'inbox',
	SYSTEM: 'system',
	ENDED_POLL_NOTIFICATION: 'endedPollNotification',
	DB: 'db',
	RELATIONSHIP: 'relationship',
	OBJECT_STORAGE: 'objectStorage',
	USER_WEBHOOK_DELIVER: 'userWebhookDeliver',
	SYSTEM_WEBHOOK_DELIVER: 'systemWebhookDeliver',
	LOCAL_USER_DELIVER: 'localUserDeliver',
};

export function baseQueueOptions(config: Config, queueName: typeof QUEUE[keyof typeof QUEUE]): Bull.QueueOptions {
	return {
		connection: {
			...config.redisForJobQueue,
			keyPrefix: undefined,
		},
		prefix: config.redisForJobQueue.prefix ? `${config.redisForJobQueue.prefix}:queue:${queueName}` : `queue:${queueName}`,
	};
}
