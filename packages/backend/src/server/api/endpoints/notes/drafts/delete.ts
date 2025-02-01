/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteDraftService } from '@/core/NoteDraftService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['notes', 'drafts'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:account',

	errors: {
		noSuchNoteDraft: {
			message: 'No such note draft.',
			code: 'NO_SUCH_NOTE_DRAFT',
			id: '49cd6b9d-848e-41ee-b0b9-adaca711a6b1',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		draftId: { type: 'string', nullable: false, format: 'misskey:id' },
	},
	required: ['draftId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private noteDraftService: NoteDraftService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const draft = await this.noteDraftService.get(me, ps.draftId);
			if (draft == null) {
				throw new ApiError(meta.errors.noSuchNoteDraft);
			}

			if (draft.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.noteDraftService.delete(me, draft.id);
		});
	}
}
