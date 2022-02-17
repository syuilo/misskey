import define from '../../../define';
import { DriveFolders } from '@/models/index';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	params: {
		type: 'object',
		properties: {
			name: { type: 'string', },
			parentId: { type: 'string', format: 'misskey:id', nullable: true, default: null, },
		},
		required: ['name'],
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'DriveFolder',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const folders = await DriveFolders.find({
		name: ps.name,
		userId: user.id,
		parentId: ps.parentId,
	});

	return await Promise.all(folders.map(folder => DriveFolders.pack(folder)));
});
