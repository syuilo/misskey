/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { AnnouncementsRepository, AnnouncementReadsRepository } from '@/models/_.js';
import type { MiAnnouncement } from '@/models/Announcement.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:announcements',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				updatedAt: {
					type: 'string',
					optional: false, nullable: true,
					format: 'date-time',
				},
				text: {
					type: 'string',
					optional: false, nullable: false,
				},
				title: {
					type: 'string',
					optional: false, nullable: false,
				},
				imageUrl: {
					type: 'string',
					optional: false, nullable: true,
				},
				icon: {
					type: 'string',
					optional: false, nullable: false,
					enum: ['info', 'warning', 'error', 'success'],
				},
				display: {
					type: 'string',
					optional: false, nullable: false,
					enum: ['normal', 'banner', 'dialog'],
				},
				isActive: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				forExistingUsers: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				silence: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				needConfirmationToRead: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				userId: {
					type: 'string',
					optional: false, nullable: true,
					format: 'id',
				},
				reads: {
					type: 'number',
					optional: false, nullable: false,
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id', nullable: true },
		status: { type: 'string', enum: ['all', 'active', 'archived'], default: 'active' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		@Inject(DI.announcementReadsRepository)
		private announcementReadsRepository: AnnouncementReadsRepository,

		private queryService: QueryService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.announcementsRepository.createQueryBuilder('announcement'), ps.sinceId, ps.untilId);

			if (ps.status === 'archived') {
				query.andWhere('announcement.isActive = false');
			} else if (ps.status === 'active') {
				query.andWhere('announcement.isActive = true');
			}

			if (ps.userId) {
				query.andWhere('announcement.userId = :userId', { userId: ps.userId });
			} else {
				query.andWhere('announcement.userId IS NULL');
			}

			const announcements = await query.limit(ps.limit).getMany();

			const reads = new Map<MiAnnouncement, number>();

			for (const announcement of announcements) {
				reads.set(announcement, await this.announcementReadsRepository.countBy({
					announcementId: announcement.id,
				}));
			}

			return announcements.map(announcement => ({
				id: announcement.id,
				createdAt: this.idService.parse(announcement.id).date.toISOString(),
				updatedAt: announcement.updatedAt?.toISOString() ?? null,
				title: announcement.title,
				text: announcement.text,
				imageUrl: announcement.imageUrl,
				icon: announcement.icon,
				display: announcement.display,
				isActive: announcement.isActive,
				forExistingUsers: announcement.forExistingUsers,
				silence: announcement.silence,
				needConfirmationToRead: announcement.needConfirmationToRead,
				userId: announcement.userId,
				reads: reads.get(announcement) ?? 0,
			}));
		});
	}
}
