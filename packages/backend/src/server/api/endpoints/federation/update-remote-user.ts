import define from '../../define';
import { getRemoteUser } from '../../common/getters';
import { updatePerson } from '@/remote/activitypub/models/person';

export const meta = {
	tags: ['federation'],

	requireCredential: true,

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
	const user = await getRemoteUser(ps.userId);
	await updatePerson(user.uri!);
});
