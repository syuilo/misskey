import { Inject, Injectable } from '@nestjs/common';
import type { Notes , NoteThreadMutings } from '@/models/index.js';
import { IdService } from '@/services/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/common/GetterService.js';
import { NoteReadService } from '@/services/NoteReadService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['notes'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '5ff67ada-ed3b-2e71-8e87-a1a421e177d2',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
		private notesRepository: typeof Notes,

		@Inject('noteThreadMutingsRepository')
		private noteThreadMutingsRepository: typeof NoteThreadMutings,

		private getterService: GetterService,
		private noteReadService: NoteReadService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await this.getterService.getNote(ps.noteId).catch(err => {
				if (err.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw err;
			});

			const mutedNotes = await this.notesRepository.find({
				where: [{
					id: note.threadId || note.id,
				}, {
					threadId: note.threadId || note.id,
				}],
			});

			await this.noteReadService.read(me.id, mutedNotes);

			await this.noteThreadMutingsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				threadId: note.threadId || note.id,
				userId: me.id,
			});
		});
	}
}
