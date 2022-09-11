import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { Hashtags } from '@/models/index.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Hashtag',
	},

	errors: {
		noSuchHashtag: {
			message: 'No such hashtag.',
			code: 'NO_SUCH_HASHTAG',
			id: '110ee688-193e-4a3a-9ecf-c167b2e6981e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tag: { type: 'string' },
	},
	required: ['tag'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			const hashtag = await Hashtags.findOneBy({ name: normalizeForSearch(ps.tag) });
			if (hashtag == null) {
				throw new ApiError(meta.errors.noSuchHashtag);
			}

			return await Hashtags.pack(hashtag);
		});
	}
}
