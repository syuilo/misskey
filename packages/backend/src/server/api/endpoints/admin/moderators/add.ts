import define from '../../../define';
import { Users } from '@/models/index';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,

	params: {
		type: 'object',
		properties: {
			userId: { type: 'string', format: 'misskey:id', },
		},
		required: ['userId'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps) => {
	const user = await Users.findOne(ps.userId as string);

	if (user == null) {
		throw new Error('user not found');
	}

	if (user.isAdmin) {
		throw new Error('cannot mark as moderator if admin user');
	}

	await Users.update(user.id, {
		isModerator: true,
	});
});
