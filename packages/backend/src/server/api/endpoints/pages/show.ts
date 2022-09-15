import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { Users , Pages } from '@/models/index.js';
import type { Page } from '@/models/entities/Page.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { PageEntityService } from '@/services/entities/PageEntityService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['pages'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Page',
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '222120c0-3ead-4528-811b-b96f233388d7',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	anyOf: [
		{
			properties: {
				pageId: { type: 'string', format: 'misskey:id' },
			},
			required: ['pageId'],
		},
		{
			properties: {
				name: { type: 'string' },
				username: { type: 'string' },
			},
			required: ['name', 'username'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('pagesRepository')
		private pagesRepository: typeof Pages,

		private pageEntityService: PageEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let page: Page | null = null;

			if (ps.pageId) {
				page = await this.pagesRepository.findOneBy({ id: ps.pageId });
			} else if (ps.name && ps.username) {
				const author = await this.usersRepository.findOneBy({
					host: IsNull(),
					usernameLower: ps.username.toLowerCase(),
				});
				if (author) {
					page = await this.pagesRepository.findOneBy({
						name: ps.name,
						userId: author.id,
					});
				}
			}

			if (page == null) {
				throw new ApiError(meta.errors.noSuchPage);
			}

			return await this.pageEntityService.pack(page, me);
		});
	}
}
