import { Inject, Injectable } from '@nestjs/common';
import { Announcements, AnnouncementReads } from '@/models/index.js';
import type { Announcement } from '@/models/entities/announcement.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/services/QueryService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

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
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(Announcements.createQueryBuilder('announcement'), ps.sinceId, ps.untilId);

			const announcements = await query.take(ps.limit).getMany();

			const reads = new Map<Announcement, number>();

			for (const announcement of announcements) {
				reads.set(announcement, await AnnouncementReads.countBy({
					announcementId: announcement.id,
				}));
			}

			return announcements.map(announcement => ({
				id: announcement.id,
				createdAt: announcement.createdAt.toISOString(),
				updatedAt: announcement.updatedAt?.toISOString() ?? null,
				title: announcement.title,
				text: announcement.text,
				imageUrl: announcement.imageUrl,
				reads: reads.get(announcement)!,
			}));
		});
	}
}
