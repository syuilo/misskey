import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { Notes } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/services/QueryService.js';
import { NoteEntityService } from '@/services/entities/NoteEntityService';

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
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId)
				.andWhere(new Brackets(qb => { qb
					.where('note.replyId = :noteId', { noteId: ps.noteId })
					.orWhere(new Brackets(qb => { qb
						.where('note.renoteId = :noteId', { noteId: ps.noteId })
						.andWhere(new Brackets(qb => { qb
							.where('note.text IS NOT NULL')
							.orWhere('note.fileIds != \'{}\'')
							.orWhere('note.hasPoll = TRUE');
						}));
					}));
				}))
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
			if (me) {
				this.queryService.generateMutedUserQuery(query, me);
				this.queryService.generateBlockedUserQuery(query, me);
			}

			const notes = await query.take(ps.limit).getMany();

			return await this.noteEntityService.packMany(notes, me);
		});
	}
}
