/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { PageService } from '@/core/PageService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';

export const meta = {
	tags: ['pages'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Page',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		offset: { type: 'integer', minimum: 0, default: 0 },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private pageService: PageService,
		private pageEntityService: PageEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const result = await this.pageService.featured({
				offset: ps.offset,
				limit: ps.limit,
			});
			return await this.pageEntityService.packMany(result, me);
		});
	}
}
