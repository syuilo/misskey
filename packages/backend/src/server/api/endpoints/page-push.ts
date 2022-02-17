import define from '../define';
import { publishMainStream } from '@/services/stream';
import { Users, Pages } from '@/models/index';
import { ApiError } from '../error';

export const meta = {
	requireCredential: true,
	secure: true,

	params: {
		type: 'object',
		properties: {
			pageId: { type: 'string', format: 'misskey:id', },
			event: { type: 'string', },
			var: { type: ['string', 'number', 'boolean', 'object', 'array', 'null'], nullable: true, },
		},
		required: ['pageId', 'event'],
	},

	errors: {
		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '4a13ad31-6729-46b4-b9af-e86b265c2e74',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const page = await Pages.findOne(ps.pageId);
	if (page == null) {
		throw new ApiError(meta.errors.noSuchPage);
	}

	publishMainStream(page.userId, 'pageEvent', {
		pageId: ps.pageId,
		event: ps.event,
		var: ps.var,
		userId: user.id,
		user: await Users.pack(user.id, { id: page.userId }, {
			detail: true,
		}),
	});
});
