import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { Notes } from '@/models/index.js';
import config from '@/config/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/services/QueryService.js';
import es from '../../../../db/elasticsearch.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string' },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		host: {
			type: 'string',
			nullable: true,
			description: 'The local host is represented with `null`.',
		},
		userId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		channelId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['query'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (es == null) {
				const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId);

				if (ps.userId) {
					query.andWhere('note.userId = :userId', { userId: ps.userId });
				} else if (ps.channelId) {
					query.andWhere('note.channelId = :channelId', { channelId: ps.channelId });
				}

				query
					.andWhere('note.text ILIKE :q', { q: `%${ps.query}%` })
					.innerJoinAndSelect('note.user', 'user')
					.leftJoinAndSelect('user.avatar', 'avatar')
					.leftJoinAndSelect('user.banner', 'banner')
					.leftJoinAndSelect('note.reply', 'reply')
					.leftJoinAndSelect('note.renote', 'renote')
					.leftJoinAndSelect('reply.user', 'replyUser')
					.leftJoinAndSelect('replyUser.avatar', 'replyUserAvatar')
					.leftJoinAndSelect('replyUser.banner', 'replyUserBanner')
					.leftJoinAndSelect('renote.user', 'renoteUser')
					.leftJoinAndSelect('renoteUser.avatar', 'renoteUserAvatar')
					.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner');

				this.queryService.generateVisibilityQuery(query, me);
				if (me) this.queryService.generateMutedUserQuery(query, me);
				if (me) this.queryService.generateBlockedUserQuery(query, me);

				const notes = await query.take(ps.limit).getMany();

				return await this.notesRepository.packMany(notes, me);
			} else {
				const userQuery = ps.userId != null ? [{
					term: {
						userId: ps.userId,
					},
				}] : [];

				const hostQuery = ps.userId == null ?
					ps.host === null ? [{
						bool: {
							must_not: {
								exists: {
									field: 'userHost',
								},
							},
						},
					}] : ps.host !== undefined ? [{
						term: {
							userHost: ps.host,
						},
					}] : []
					: [];

				const result = await es.search({
					index: config.elasticsearch.index || 'misskey_note',
					body: {
						size: ps.limit,
						from: ps.offset,
						query: {
							bool: {
								must: [{
									simple_query_string: {
										fields: ['text'],
										query: ps.query.toLowerCase(),
										default_operator: 'and',
									},
								}, ...hostQuery, ...userQuery],
							},
						},
						sort: [{
							_doc: 'desc',
						}],
					},
				});

				const hits = result.body.hits.hits.map((hit: any) => hit._id);

				if (hits.length === 0) return [];

				// Fetch found notes
				const notes = await this.notesRepository.find({
					where: {
						id: In(hits),
					},
					order: {
						id: -1,
					},
				});

				return await this.notesRepository.packMany(notes, me);
			}
		});
	}
}
