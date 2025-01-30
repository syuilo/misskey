/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { In } from 'typeorm';
import * as Redis from 'ioredis';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { FilterUnionByProperty, notificationTypes, obsoleteNotificationTypes } from '@/types.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteReadService } from '@/core/NoteReadService.js';
import { NotificationEntityService } from '@/core/entities/NotificationEntityService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { MiNotification } from '@/models/Notification.js';

export const meta = {
	tags: ['account', 'notifications'],

	requireCredential: true,

	limit: {
		duration: 30000,
		max: 30,
	},

	kind: 'read:notifications',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Notification',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		markAsRead: { type: 'boolean', default: true },
		// 後方互換のため、廃止された通知タイプも受け付ける
		includeTypes: { type: 'array', items: {
			type: 'string', enum: [...notificationTypes, ...obsoleteNotificationTypes],
		} },
		excludeTypes: { type: 'array', items: {
			type: 'string', enum: [...notificationTypes, ...obsoleteNotificationTypes],
		} },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private idService: IdService,
		private notificationEntityService: NotificationEntityService,
		private notificationService: NotificationService,
		private noteReadService: NoteReadService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// includeTypes が空の場合はクエリしない
			if (ps.includeTypes && ps.includeTypes.length === 0) {
				return [];
			}
			// excludeTypes に全指定されている場合はクエリしない
			if (notificationTypes.every(type => ps.excludeTypes?.includes(type))) {
				return [];
			}

			const includeTypes = ps.includeTypes && ps.includeTypes.filter(type => !(obsoleteNotificationTypes).includes(type as any)) as typeof notificationTypes[number][];
			const excludeTypes = ps.excludeTypes && ps.excludeTypes.filter(type => !(obsoleteNotificationTypes).includes(type as any)) as typeof notificationTypes[number][];

			const notifications = await this.notificationService.getNotifications(me.id, {
				sinceId: ps.sinceId,
				untilId: ps.untilId,
				limit: ps.limit,
				includeTypes,
				excludeTypes,
			});

			// Mark all as read
			if (ps.markAsRead) {
				this.notificationService.readAllNotification(me.id);
			}

			const noteIds = notifications
				.filter((notification): notification is FilterUnionByProperty<MiNotification, 'type', 'mention' | 'reply' | 'quote'> => ['mention', 'reply', 'quote'].includes(notification.type))
				.map(notification => notification.noteId);

			if (noteIds.length > 0) {
				const notes = await this.notesRepository.findBy({ id: In(noteIds) });
				this.noteReadService.read(me.id, notes);
			}

			return await this.notificationEntityService.packMany(notifications, me.id);
		});
	}
}
