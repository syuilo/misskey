import ms from 'ms';
import { Inject, Injectable } from '@/di-decorators.js';
import type { FlashsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';

export const meta = {
	tags: ['flash'],

	requireCredential: true,

	kind: 'write:flash',

	limit: {
		duration: ms('1hour'),
		max: 10,
	},

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		summary: { type: 'string' },
		script: { type: 'string' },
		permissions: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['title', 'summary', 'script', 'permissions'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.FlashEntityService)
		private flashEntityService: FlashEntityService,

		@Inject(DI.IdService)
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const flash = await this.flashsRepository.insert({
				id: this.idService.genId(),
				userId: me.id,
				createdAt: new Date(),
				updatedAt: new Date(),
				title: ps.title,
				summary: ps.summary,
				script: ps.script,
				permissions: ps.permissions,
			}).then(x => this.flashsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.flashEntityService.pack(flash);
		});
	}
}
