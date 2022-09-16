import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Emojis } from '@/models/index.js';
import { QueryService } from '@/services/QueryService.js';
import { UtilityService } from '@/services/UtilityService.js';
import { EmojiEntityService } from '@/services/entities/EmojiEntityService.js';
import { DI } from '@/di-symbols.js';

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
				},
				aliases: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'string',
						optional: false, nullable: false,
					},
				},
				name: {
					type: 'string',
					optional: false, nullable: false,
				},
				category: {
					type: 'string',
					optional: false, nullable: true,
				},
				host: {
					type: 'string',
					optional: false, nullable: true,
					description: 'The local host is represented with `null`.',
				},
				url: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string', nullable: true, default: null },
		host: {
			type: 'string',
			nullable: true,
			default: null,
			description: 'Use `null` to represent the local host.',
		},
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
		@Inject(DI.emojisRepository)
		private emojisRepository: typeof Emojis,

		private utilityService: UtilityService,
		private queryService: QueryService,
		private emojiEntityService: EmojiEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const q = this.queryService.makePaginationQuery(this.emojisRepository.createQueryBuilder('emoji'), ps.sinceId, ps.untilId);

			if (ps.host == null) {
				q.andWhere('emoji.host IS NOT NULL');
			} else {
				q.andWhere('emoji.host = :host', { host: this.utilityService.toPuny(ps.host) });
			}

			if (ps.query) {
				q.andWhere('emoji.name like :query', { query: '%' + ps.query + '%' });
			}

			const emojis = await q
				.orderBy('emoji.id', 'DESC')
				.take(ps.limit)
				.getMany();

			return this.emojiEntityService.packMany(emojis);
		});
	}
}
