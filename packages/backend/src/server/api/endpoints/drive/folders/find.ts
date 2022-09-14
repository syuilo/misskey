import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFolders } from '@/models/index.js';
import { DriveFolderEntityService } from '@/services/entities/DriveFolderEntityService';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

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

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		parentId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('driveFoldersRepository')
		private driveFoldersRepository: typeof DriveFolders,

		private driveFolderEntityService: DriveFolderEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const folders = await this.driveFoldersRepository.findBy({
				name: ps.name,
				userId: me.id,
				parentId: ps.parentId ?? IsNull(),
			});

			return await Promise.all(folders.map(folder => this.driveFolderEntityService.pack(folder)));
		});
	}
}
