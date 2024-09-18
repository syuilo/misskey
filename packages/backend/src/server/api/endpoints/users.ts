/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserPvChart from '@/core/chart/charts/per-user-pv.js';
import { QueryService } from '@/core/QueryService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserDetailed',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		sort: { type: 'string', enum: ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt', '+pv', '-pv'] },
		state: { type: 'string', enum: ['all', 'alive'], default: 'all' },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'local' },
		hostname: {
			type: 'string',
			nullable: true,
			default: null,
			description: 'The local host is represented with `null`.',
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		private perUserPvChart: PerUserPvChart,

		private userEntityService: UserEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.usersRepository.createQueryBuilder('user')
				.where('user.isExplorable = TRUE')
				.andWhere('user.isSuspended = FALSE');

			switch (ps.state) {
				case 'alive': query.andWhere('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }); break;
			}

			switch (ps.origin) {
				case 'local': query.andWhere('user.host IS NULL'); break;
				case 'remote': query.andWhere('user.host IS NOT NULL'); break;
			}

			if (ps.hostname) {
				query.andWhere('user.host = :hostname', { hostname: ps.hostname.toLowerCase() });
			}

			let pvRankedUsers: { userId: string; count: number; }[] | undefined = undefined;
			if (ps.sort?.endsWith('pv')) {
				// 直近12時間のPVランキングを取得
				pvRankedUsers = await this.perUserPvChart.getUsersRanking(
					'hour', ps.sort.startsWith('+') ? 'DESC' : 'ASC',
					12, null, ps.limit, ps.offset,
				);
			}

			switch (ps.sort) {
				case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
				case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
				case '+createdAt': query.orderBy('user.id', 'DESC'); break;
				case '-createdAt': query.orderBy('user.id', 'ASC'); break;
				case '+updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'DESC'); break;
				case '-updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'ASC'); break;
				case '+pv': query.andWhere((pvRankedUsers?.length ?? 0) > 0 ? 'user.id IN (:...userIds)' : '1 = 0', { userIds: pvRankedUsers?.map(user => user.userId) ?? [] }); break;
				case '-pv': query.andWhere((pvRankedUsers?.length ?? 0) > 0 ? 'user.id IN (:...userIds)' : '1 = 0', { userIds: pvRankedUsers?.map(user => user.userId) ?? [] }); break;
				default: query.orderBy('user.id', 'ASC'); break;
			}

			if (me) this.queryService.generateMutedUserQueryForUsers(query, me);
			if (me) this.queryService.generateBlockQueryForUsers(query, me);

			query.limit(ps.limit);
			query.offset(ps.offset);

			const users = await query.getMany();
			if (ps.sort === '+pv') {
				users.sort((a, b) => {
					const aPv = pvRankedUsers?.find(u => u.userId === a.id)?.count ?? 0;
					const bPv = pvRankedUsers?.find(u => u.userId === b.id)?.count ?? 0;
					return bPv - aPv;
				});
			} else if (ps.sort === '-pv') {
				users.sort((a, b) => {
					const aPv = pvRankedUsers?.find(u => u.userId === a.id)?.count ?? 0;
					const bPv = pvRankedUsers?.find(u => u.userId === b.id)?.count ?? 0;
					return aPv - bPv;
				});
			}

			return await this.userEntityService.packMany(users, me, { schema: 'UserDetailed' });
		});
	}
}
