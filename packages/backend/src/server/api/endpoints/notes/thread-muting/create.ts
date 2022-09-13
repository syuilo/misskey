import { Inject, Injectable } from '@nestjs/common';
import { Notes, NoteThreadMutings } from '@/models/index.js';
import type { IdService } from '@/services/IdService.js';
import readNote from '@/services/note/read.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { getNote } from '../../../common/getters.js';
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
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const note = await getNote(ps.noteId).catch(e => {
				if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
				throw e;
			});

			const mutedNotes = await Notes.find({
				where: [{
					id: note.threadId || note.id,
				}, {
					threadId: note.threadId || note.id,
				}],
			});

			await readNote(me.id, mutedNotes);

			await NoteThreadMutings.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				threadId: note.threadId || note.id,
				userId: me.id,
			});
		});
	}
}
