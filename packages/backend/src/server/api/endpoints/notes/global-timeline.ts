import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, Note, DriveFilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { MetaService } from '@/core/MetaService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes'],

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
		gtlDisabled: {
			message: 'Global timeline has been disabled.',
			code: 'GTL_DISABLED',
			id: '0332fc13-6ab2-4427-ae80-a9fadffd1a6b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		withFiles: { type: 'boolean', default: false },
		withReplies: { type: 'boolean', default: false },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		doNotShowNsfwContentsOnTheTimeline: { type: 'boolean', default: false },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private metaService: MetaService,
		private roleService: RoleService,
		private activeUsersChart: ActiveUsersChart,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me ? me.id : null);
			if (!policies.gtlAvailable) {
				throw new ApiError(meta.errors.gtlDisabled);
			}

			//#region Construct query
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'),
				ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('note.visibility = \'public\'')
				.andWhere('note.channelId IS NULL')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			this.queryService.generateRepliesQuery(query, ps.withReplies, me);
			if (me) {
				this.queryService.generateMutedUserQuery(query, me);
				this.queryService.generateMutedNoteQuery(query, me);
				this.queryService.generateBlockedUserQuery(query, me);
				this.queryService.generateMutedUserRenotesQueryForNotes(query, me);
			}

			if (ps.withFiles) {
				query.andWhere('note.fileIds != \'{}\'');
			}
			//#endregion

			const timeline = await query.take(ps.limit).getMany();
			let result: Note[] = [];

			if (ps.doNotShowNsfwContentsOnTheTimeline) {
				for (const timelineNote of timeline) {
					let renoteNoteFileIds: string[] = [];
					let replyNoteFileIds: string[] = [];
					if (timelineNote.renoteId) {
						renoteNoteFileIds = (await this.notesRepository.findOneByOrFail({
							id: timelineNote.renoteId,
						})).fileIds;
					}
					if (timelineNote.replyId) {
						replyNoteFileIds = (await this.notesRepository.findOneByOrFail({
							id: timelineNote.replyId,
						})).fileIds;
					}
					if (timelineNote.fileIds.length > 0 || renoteNoteFileIds.length > 0 || replyNoteFileIds.length > 0) {
						const query = this.driveFilesRepository.createQueryBuilder('files');
						query.where('files.id IN (:...noteFileIds)', { noteFileIds: [...timelineNote.fileIds, ...renoteNoteFileIds, ...replyNoteFileIds] });
						query.andWhere('files.isSensitive = true');
						if (!(await query.getExists())) result.push(timelineNote);
					} else {
						result.push(timelineNote);
					}
				}
			} else {
				result = timeline;
			}

			process.nextTick(() => {
				if (me) {
					this.activeUsersChart.read(me);
				}
			});

			return await this.noteEntityService.packMany(result, me);
		});
	}
}
