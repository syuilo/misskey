/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import * as Bull from 'bullmq';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { baseQueueOptions, QUEUE } from '@/queue/const.js';
import { allSettled } from '@/misc/promise-tracker.js';
import {
	DeliverJobData,
	EndedPollNotificationJobData,
	InboxJobData,
	RelationshipJobData,
	UserWebhookDeliverJobData,
	SystemWebhookDeliverJobData,
	LocalUserDeliverJobData,
} from '../queue/types.js';
import type { Provider } from '@nestjs/common';

export type SystemQueue = Bull.Queue<Record<string, unknown>>;
export type EndedPollNotificationQueue = Bull.Queue<EndedPollNotificationJobData>;
export type DeliverQueue = Bull.Queue<DeliverJobData>;
export type InboxQueue = Bull.Queue<InboxJobData>;
export type DbQueue = Bull.Queue;
export type RelationshipQueue = Bull.Queue<RelationshipJobData>;
export type ObjectStorageQueue = Bull.Queue;
export type UserWebhookDeliverQueue = Bull.Queue<UserWebhookDeliverJobData>;
export type SystemWebhookDeliverQueue = Bull.Queue<SystemWebhookDeliverJobData>;
export type LocalUserDeliverQueue = Bull.Queue<LocalUserDeliverJobData>;

const $system: Provider = {
	provide: 'queue:system',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.SYSTEM, baseQueueOptions(config, QUEUE.SYSTEM)),
	inject: [DI.config],
};

const $endedPollNotification: Provider = {
	provide: 'queue:endedPollNotification',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.ENDED_POLL_NOTIFICATION, baseQueueOptions(config, QUEUE.ENDED_POLL_NOTIFICATION)),
	inject: [DI.config],
};

const $deliver: Provider = {
	provide: 'queue:deliver',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.DELIVER, baseQueueOptions(config, QUEUE.DELIVER)),
	inject: [DI.config],
};

const $inbox: Provider = {
	provide: 'queue:inbox',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.INBOX, baseQueueOptions(config, QUEUE.INBOX)),
	inject: [DI.config],
};

const $db: Provider = {
	provide: 'queue:db',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.DB, baseQueueOptions(config, QUEUE.DB)),
	inject: [DI.config],
};

const $relationship: Provider = {
	provide: 'queue:relationship',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.RELATIONSHIP, baseQueueOptions(config, QUEUE.RELATIONSHIP)),
	inject: [DI.config],
};

const $objectStorage: Provider = {
	provide: 'queue:objectStorage',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.OBJECT_STORAGE, baseQueueOptions(config, QUEUE.OBJECT_STORAGE)),
	inject: [DI.config],
};

const $userWebhookDeliver: Provider = {
	provide: 'queue:userWebhookDeliver',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.USER_WEBHOOK_DELIVER, baseQueueOptions(config, QUEUE.USER_WEBHOOK_DELIVER)),
	inject: [DI.config],
};

const $systemWebhookDeliver: Provider = {
	provide: 'queue:systemWebhookDeliver',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.SYSTEM_WEBHOOK_DELIVER, baseQueueOptions(config, QUEUE.SYSTEM_WEBHOOK_DELIVER)),
	inject: [DI.config],
};

const $localUserDeliver: Provider = {
	provide: 'queue:localUserDeliver',
	useFactory: (config: Config) => new Bull.Queue(QUEUE.LOCAL_USER_DELIVER, baseQueueOptions(config, QUEUE.LOCAL_USER_DELIVER)),
	inject: [DI.config],
};

@Module({
	imports: [
	],
	providers: [
		$system,
		$endedPollNotification,
		$deliver,
		$inbox,
		$db,
		$relationship,
		$objectStorage,
		$userWebhookDeliver,
		$systemWebhookDeliver,
		$localUserDeliver,
	],
	exports: [
		$system,
		$endedPollNotification,
		$deliver,
		$inbox,
		$db,
		$relationship,
		$objectStorage,
		$userWebhookDeliver,
		$systemWebhookDeliver,
		$localUserDeliver,
	],
})
export class QueueModule implements OnApplicationShutdown {
	constructor(
		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:relationship') public relationshipQueue: RelationshipQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:userWebhookDeliver') public userWebhookDeliverQueue: UserWebhookDeliverQueue,
		@Inject('queue:systemWebhookDeliver') public systemWebhookDeliverQueue: SystemWebhookDeliverQueue,
		@Inject('queue:localUserDeliver') public localUserDeliverQueue: LocalUserDeliverQueue,
	) {}

	public async dispose(): Promise<void> {
		// Wait for all potential queue jobs
		await allSettled();
		// And then close all queues
		await Promise.all([
			this.systemQueue.close(),
			this.endedPollNotificationQueue.close(),
			this.deliverQueue.close(),
			this.inboxQueue.close(),
			this.dbQueue.close(),
			this.relationshipQueue.close(),
			this.objectStorageQueue.close(),
			this.userWebhookDeliverQueue.close(),
			this.systemWebhookDeliverQueue.close(),
			this.localUserDeliverQueue.close(),
		]);
	}

	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}
