import define from '../../../define';
import { ApiError } from '../../../error';
import { UserLists } from '@/models/index';

export const meta = {
	tags: ['lists'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		type: 'object',
		properties: {
			listId: { type: 'string', format: 'misskey:id', },
		},
		required: ['listId'],
	},

	errors: {
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '78436795-db79-42f5-b1e2-55ea2cf19166',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const userList = await UserLists.findOne({
		id: ps.listId,
		userId: user.id,
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	await UserLists.delete(userList.id);
});
