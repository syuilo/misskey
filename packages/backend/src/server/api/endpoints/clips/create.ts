import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/services/IdService.js';
import type { Clips } from '@/models/index.js';
import { ClipEntityService } from '@/services/entities/ClipEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['clips'],

	requireCredential: true,

	kind: 'write:account',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Clip',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
		isPublic: { type: 'boolean', default: false },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: typeof Clips,

		private clipEntityService: ClipEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const clip = await this.clipsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				name: ps.name,
				isPublic: ps.isPublic,
				description: ps.description,
			}).then(x => this.clipsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.clipEntityService.pack(clip);
		});
	}
}
