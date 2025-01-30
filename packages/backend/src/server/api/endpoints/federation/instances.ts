/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { InstancesRepository } from '@/models/_.js';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,
	allowGet: true,
	cacheSec: 3600,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'FederationInstance',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string', nullable: true, description: 'Omit or use `null` to not filter by host.' },
		blocked: { type: 'boolean', nullable: true },
		notResponding: { type: 'boolean', nullable: true },
		suspended: { type: 'boolean', nullable: true },
		silenced: { type: 'boolean', nullable: true },
		federating: { type: 'boolean', nullable: true },
		subscribing: { type: 'boolean', nullable: true },
		publishing: { type: 'boolean', nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		offset: { type: 'integer', default: 0 },
		sort: {
			type: 'string',
			nullable: true,
			enum: [
				'+pubSub',
				'-pubSub',
				'+notes',
				'-notes',
				'+users',
				'-users',
				'+following',
				'-following',
				'+followers',
				'-followers',
				'+firstRetrievedAt',
				'-firstRetrievedAt',
				'+latestRequestReceivedAt',
				'-latestRequestReceivedAt',
				null,
			],
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private instanceEntityService: InstanceEntityService,
		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.instancesRepository.createQueryBuilder('instance');

			switch (ps.sort) {
				case '+pubSub': query.orderBy('instance.followingCount', 'DESC').orderBy('instance.followersCount', 'DESC'); break;
				case '-pubSub': query.orderBy('instance.followingCount', 'ASC').orderBy('instance.followersCount', 'ASC'); break;
				case '+notes': query.orderBy('instance.notesCount', 'DESC'); break;
				case '-notes': query.orderBy('instance.notesCount', 'ASC'); break;
				case '+users': query.orderBy('instance.usersCount', 'DESC'); break;
				case '-users': query.orderBy('instance.usersCount', 'ASC'); break;
				case '+following': query.orderBy('instance.followingCount', 'DESC'); break;
				case '-following': query.orderBy('instance.followingCount', 'ASC'); break;
				case '+followers': query.orderBy('instance.followersCount', 'DESC'); break;
				case '-followers': query.orderBy('instance.followersCount', 'ASC'); break;
				case '+firstRetrievedAt': query.orderBy('instance.firstRetrievedAt', 'DESC'); break;
				case '-firstRetrievedAt': query.orderBy('instance.firstRetrievedAt', 'ASC'); break;
				case '+latestRequestReceivedAt': query.orderBy('instance.latestRequestReceivedAt', 'DESC', 'NULLS LAST'); break;
				case '-latestRequestReceivedAt': query.orderBy('instance.latestRequestReceivedAt', 'ASC', 'NULLS FIRST'); break;

				default: query.orderBy('instance.id', 'DESC'); break;
			}

			if (typeof ps.blocked === 'boolean') {
				const meta = await this.metaService.fetch(true);
				if (ps.blocked) {
					query.andWhere(meta.blockedHosts.length === 0 ? '1=0' : 'instance.host ILIKE ANY(ARRAY[:...blocks])', { blocks: meta.blockedHosts.flatMap(x => [x, `%.${x}`]) });
				} else {
					query.andWhere(meta.blockedHosts.length === 0 ? '1=1' : 'instance.host NOT ILIKE ALL(ARRAY[:...blocks])', { blocks: meta.blockedHosts.flatMap(x => [x, `%.${x}`]) });
				}
			}

			if (typeof ps.notResponding === 'boolean') {
				if (ps.notResponding) {
					query.andWhere('instance.isNotResponding = TRUE');
				} else {
					query.andWhere('instance.isNotResponding = FALSE');
				}
			}

			if (typeof ps.suspended === 'boolean') {
				if (ps.suspended) {
					query.andWhere('instance.suspensionState != \'none\'');
				} else {
					query.andWhere('instance.suspensionState = \'none\'');
				}
			}

			if (typeof ps.silenced === 'boolean') {
				const meta = await this.metaService.fetch(true);

				if (ps.silenced) {
					if (meta.silencedHosts.length === 0) {
						return [];
					}
					query.andWhere('instance.host ILIKE ANY(ARRAY[:...silences])', {
						silences: meta.silencedHosts.flatMap(x => [x, `%.${x}`]),
					});
				} else if (meta.silencedHosts.length > 0) {
					query.andWhere('instance.host NOT ILIKE ALL(ARRAY[:...silences])', {
						silences: meta.silencedHosts.flatMap(x => [x, `%.${x}`]),
					});
				}
			}

			if (typeof ps.federating === 'boolean') {
				if (ps.federating) {
					query.andWhere('((instance.followingCount > 0) OR (instance.followersCount > 0))');
				} else {
					query.andWhere('((instance.followingCount = 0) AND (instance.followersCount = 0))');
				}
			}

			if (typeof ps.subscribing === 'boolean') {
				if (ps.subscribing) {
					query.andWhere('instance.followersCount > 0');
				} else {
					query.andWhere('instance.followersCount = 0');
				}
			}

			if (typeof ps.publishing === 'boolean') {
				if (ps.publishing) {
					query.andWhere('instance.followingCount > 0');
				} else {
					query.andWhere('instance.followingCount = 0');
				}
			}

			if (ps.host) {
				query.andWhere('instance.host like :host', { host: '%' + sqlLikeEscape(ps.host.toLowerCase()) + '%' });
			}

			const instances = await query.limit(ps.limit).offset(ps.offset).getMany();

			return await this.instanceEntityService.packMany(instances, me);
		});
	}
}
