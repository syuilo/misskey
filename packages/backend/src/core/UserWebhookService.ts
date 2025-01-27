/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { MiUser, type WebhooksRepository } from '@/models/_.js';
import { MiWebhook, WebhookEventTypes } from '@/models/Webhook.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { GlobalEvents } from '@/core/GlobalEventService.js';
import type { Packed } from '@/misc/json-schema.js';
import { QueueService } from '@/core/QueueService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

export type UserWebhookPayload<T extends WebhookEventTypes> =
	T extends 'note' | 'reply' | 'renote' | 'mention' ? {
		note: Packed<'Note'>,
	} :
	T extends 'follow' | 'unfollow' ? {
		user: Packed<'UserDetailedNotMe'>,
	} :
	T extends 'followed' ? {
		user: Packed<'UserLite'>,
	} : never;

@Injectable()
export class UserWebhookService implements OnApplicationShutdown {
	private activeWebhooksFetched = false;
	private activeWebhooks: MiWebhook[] = [];

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,
		private queueService: QueueService,
	) {
		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	public async getActiveWebhooks() {
		if (!this.activeWebhooksFetched) {
			this.activeWebhooks = await this.webhooksRepository.findBy({
				active: true,
			});
			this.activeWebhooksFetched = true;
		}

		return this.activeWebhooks;
	}

	/**
	 * UserWebhook の一覧を取得する.
	 */
	@bindThis
	public fetchWebhooks(params?: {
		ids?: MiWebhook['id'][];
		isActive?: MiWebhook['active'];
		on?: MiWebhook['on'];
	}): Promise<MiWebhook[]> {
		const query = this.webhooksRepository.createQueryBuilder('webhook');
		if (params) {
			if (params.ids && params.ids.length > 0) {
				query.andWhere('webhook.id IN (:...ids)', { ids: params.ids });
			}
			if (params.isActive !== undefined) {
				query.andWhere('webhook.active = :isActive', { isActive: params.isActive });
			}
			if (params.on && params.on.length > 0) {
				query.andWhere(':on <@ webhook.on', { on: params.on });
			}
		}

		return query.getMany();
	}

	/**
	 * UserWebhook をWebhook配送キューに追加する
	 * @see QueueService.userWebhookDeliver
	 */
	@bindThis
	public async enqueueUserWebhook<T extends WebhookEventTypes>(
		userId: MiUser['id'],
		type: T,
		content: UserWebhookPayload<T>,
	) {
		const webhooks = await this.getActiveWebhooks()
			.then(webhooks => webhooks.filter(webhook => webhook.userId === userId && webhook.on.includes(type)));
		return Promise.all(
			webhooks.map(webhook => {
				return this.queueService.userWebhookDeliver(webhook, type, content);
			}),
		);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);
		if (obj.channel !== 'internal') {
			return;
		}

		const { type, body } = obj.message as GlobalEvents['internal']['payload'];
		switch (type) {
			case 'webhookCreated': {
				if (body.active) {
					this.activeWebhooks.push({ // TODO: このあたりのデシリアライズ処理は各modelファイル内に関数としてexportしたい
						...body,
						latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
						user: null, // joinなカラムは通常取ってこないので
					});
				}
				break;
			}
			case 'webhookUpdated': {
				if (body.active) {
					const i = this.activeWebhooks.findIndex(a => a.id === body.id);
					if (i > -1) {
						this.activeWebhooks[i] = { // TODO: このあたりのデシリアライズ処理は各modelファイル内に関数としてexportしたい
							...body,
							latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
							user: null, // joinなカラムは通常取ってこないので
						};
					} else {
						this.activeWebhooks.push({ // TODO: このあたりのデシリアライズ処理は各modelファイル内に関数としてexportしたい
							...body,
							latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
							user: null, // joinなカラムは通常取ってこないので
						});
					}
				} else {
					this.activeWebhooks = this.activeWebhooks.filter(a => a.id !== body.id);
				}
				break;
			}
			case 'webhookDeleted': {
				this.activeWebhooks = this.activeWebhooks.filter(a => a.id !== body.id);
				break;
			}
			default:
				break;
		}
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
