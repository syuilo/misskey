import define from '../../define';
import { SwSubscriptions } from '../../../../models';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	params: {
		type: 'object',
		properties: {
			endpoint: { type: 'string', },
		},
		required: ['endpoint'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	await SwSubscriptions.delete({
		userId: user.id,
		endpoint: ps.endpoint,
	});
});
