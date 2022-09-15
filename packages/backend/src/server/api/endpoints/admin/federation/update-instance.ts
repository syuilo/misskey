import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Instances } from '@/models/index.js';
import { UtilityService } from '@/services/UtilityService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string' },
		isSuspended: { type: 'boolean' },
	},
	required: ['host', 'isSuspended'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('instancesRepository')
		private instancesRepository: typeof Instances,

		private utilityService: UtilityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.instancesRepository.findOneBy({ host: this.utilityService.toPuny(ps.host) });

			if (instance == null) {
				throw new Error('instance not found');
			}

			this.instancesRepository.update({ host: this.utilityService.toPuny(ps.host) }, {
				isSuspended: ps.isSuspended,
			});
		});
	}
}
