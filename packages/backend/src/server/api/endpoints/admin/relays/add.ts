import { URL } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { addRelay } from '@/services/relay.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		invalidUrl: {
			message: 'Invalid URL',
			code: 'INVALID_URL',
			id: 'fb8c92d3-d4e5-44e7-b3d4-800d5cef8b2c',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			inbox: {
				type: 'string',
				optional: false, nullable: false,
				format: 'url',
			},
			status: {
				type: 'string',
				optional: false, nullable: false,
				default: 'requesting',
				enum: [
					'requesting',
					'accepted',
					'rejected',
				],
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		inbox: { type: 'string' },
	},
	required: ['inbox'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			try {
				if (new URL(ps.inbox).protocol !== 'https:') throw 'https only';
			} catch {
				throw new ApiError(meta.errors.invalidUrl);
			}

			return await addRelay(ps.inbox);
		});
	}
}
