/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AbuseUserReportsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { DI } from '@/di-symbols.js';
import { AbuseUserReportEntityService } from '@/core/entities/AbuseUserReportEntityService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:abuse-user-reports',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					nullable: false, optional: false,
					format: 'id',
					example: 'xxxxxxxxxx',
				},
				createdAt: {
					type: 'string',
					nullable: false, optional: false,
					format: 'date-time',
				},
				comment: {
					type: 'string',
					nullable: false, optional: false,
				},
				resolved: {
					type: 'boolean',
					nullable: false, optional: false,
					example: false,
				},
				reporterId: {
					type: 'string',
					nullable: false, optional: false,
					format: 'id',
				},
				targetUserId: {
					type: 'string',
					nullable: false, optional: false,
					format: 'id',
				},
				assigneeId: {
					type: 'string',
					nullable: true, optional: false,
					format: 'id',
				},
				reporter: {
					type: 'object',
					nullable: false, optional: false,
					ref: 'UserDetailedNotMe',
				},
				targetUser: {
					type: 'object',
					nullable: false, optional: false,
					ref: 'UserDetailedNotMe',
				},
				assignee: {
					type: 'object',
					nullable: true, optional: true,
					ref: 'UserDetailedNotMe',
				},
				forwarded: {
					type: 'boolean',
					nullable: false, optional: false,
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
		state: { type: 'string', nullable: true, default: null },
		reporterOrigin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'combined' },
		targetUserOrigin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'combined' },
		forwarded: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.abuseUserReportsRepository)
		private abuseUserReportsRepository: AbuseUserReportsRepository,

		private abuseUserReportEntityService: AbuseUserReportEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.abuseUserReportsRepository.createQueryBuilder('report'), ps.sinceId, ps.untilId);

			switch (ps.state) {
				case 'resolved': query.andWhere('report.resolved = TRUE'); break;
				case 'unresolved': query.andWhere('report.resolved = FALSE'); break;
			}

			switch (ps.reporterOrigin) {
				case 'local': query.andWhere('report.reporterHost IS NULL'); break;
				case 'remote': query.andWhere('report.reporterHost IS NOT NULL'); break;
			}

			switch (ps.targetUserOrigin) {
				case 'local': query.andWhere('report.targetUserHost IS NULL'); break;
				case 'remote': query.andWhere('report.targetUserHost IS NOT NULL'); break;
			}

			const reports = await query.limit(ps.limit).getMany();

			return await this.abuseUserReportEntityService.packMany(reports, me);
		});
	}
}
