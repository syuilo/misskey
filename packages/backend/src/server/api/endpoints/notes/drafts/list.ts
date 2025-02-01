/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiNoteDraft, NoteDraftsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteDraftEntityService } from '@/core/entities/NoteDraftEntityService.js';

export const meta = {
	tags: ['notes', 'drafts'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'NoteDraft',
		},
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.noteDraftsRepository)
		private noteDraftsRepository: NoteDraftsRepository,

		private queryService: QueryService,
		private noteDraftEntityService: NoteDraftEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery<MiNoteDraft>(this.noteDraftsRepository.createQueryBuilder('drafts'), ps.sinceId, ps.untilId)
				.where('drafts.userId = :meId', { meId: me.id });

			const drafts = await query
				.limit(ps.limit)
				.getMany();

			return await this.noteDraftEntityService.packMany(drafts, me);
		});
	}
}
