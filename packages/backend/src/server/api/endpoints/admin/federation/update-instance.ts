import define from '../../../define';
import { Instances } from '@/models/index';
import { toPuny } from '@/misc/convert-host';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		type: 'object',
		properties: {
			host: { type: 'string', },
			isSuspended: { type: 'boolean', },
		},
		required: ['host', 'isSuspended'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const instance = await Instances.findOne({ host: toPuny(ps.host) });

	if (instance == null) {
		throw new Error('instance not found');
	}

	Instances.update({ host: toPuny(ps.host) }, {
		isSuspended: ps.isSuspended,
	});
});
