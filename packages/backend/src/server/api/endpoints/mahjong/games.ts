/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ReversiGameEntityService } from '@/core/entities/ReversiGameEntityService.js';
import { DI } from '@/di-symbols.js';
import type { ReversiGamesRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';

export const meta = {
	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: { ref: 'ReversiGameLite' },
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		my: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private reversiGameEntityService: ReversiGameEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.reversiGamesRepository.createQueryBuilder('game'), ps.sinceId, ps.untilId)
				.innerJoinAndSelect('game.user1', 'user1')
				.innerJoinAndSelect('game.user2', 'user2');

			if (ps.my && me) {
				query.andWhere(new Brackets(qb => {
					qb
						.where('game.user1Id = :userId', { userId: me.id })
						.orWhere('game.user2Id = :userId', { userId: me.id });
				}));
			} else {
				query.andWhere('game.isStarted = TRUE');
			}

			const games = await query.take(ps.limit).getMany();

			return await this.reversiGameEntityService.packLiteMany(games);
		});
	}
}
