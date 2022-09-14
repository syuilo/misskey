import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Channels, DriveFiles } from '@/models/index.js';
import type { Channel } from '@/models/entities/channel.js';
import { IdService } from '@/services/IdService.js';
import { ChannelEntityService } from '@/services/entities/ChannelEntityService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['channels'],

	requireCredential: true,

	kind: 'write:channels',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'Channel',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'cd1e9f3e-5a12-4ab4-96f6-5d0a2cc32050',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 128 },
		description: { type: 'string', nullable: true, minLength: 1, maxLength: 2048 },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

		@Inject('channelsRepository')
		private channelsRepository: typeof Channels,

		private idService: IdService,
		private channelEntityService: ChannelEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let banner = null;
			if (ps.bannerId != null) {
				banner = await this.driveFilesRepository.findOneBy({
					id: ps.bannerId,
					userId: me.id,
				});

				if (banner == null) {
					throw new ApiError(meta.errors.noSuchFile);
				}
			}

			const channel = await this.channelsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				name: ps.name,
				description: ps.description || null,
				bannerId: banner ? banner.id : null,
			} as Channel).then(x => this.channelsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.channelEntityService.pack(channel, me);
		});
	}
}
