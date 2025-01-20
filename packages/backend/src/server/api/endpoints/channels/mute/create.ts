/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ChannelsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { ChannelMutingService } from '@/core/ChannelMutingService.js';

export const meta = {
	tags: ['channels', 'mute'],

	requireCredential: true,
	prohibitMoved: true,

	kind: 'write:channels',

	errors: {
		noSuchChannel: {
			message: 'No such Channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '7174361e-d58f-31d6-2e7c-6fb830786a3f',
		},

		alreadyMuting: {
			message: 'You are already muting that user.',
			code: 'ALREADY_MUTING_CHANNEL',
			id: '5a251978-769a-da44-3e89-3931e43bb592',
		},

		expiresAtIsPast: {
			message: 'Cannot set past date to "expiresAt".',
			code: 'EXPIRES_AT_IS_PAST',
			id: '42b32236-df2c-a45f-fdbf-def67268f749',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		channelId: { type: 'string', format: 'misskey:id' },
		expiresAt: {
			type: 'integer',
			nullable: true,
			description: 'A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.',
		},
	},
	required: ['channelId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,
		private channelMutingService: ChannelMutingService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Check if exists the channel
			const targetChannel = await this.channelsRepository.findOneBy({ id: ps.channelId });
			if (!targetChannel) {
				throw new ApiError(meta.errors.noSuchChannel);
			}

			// Check if already muting
			const exist = await this.channelMutingService.isMuted({
				requestUserId: me.id,
				targetChannelId: targetChannel.id,
			});
			if (exist) {
				throw new ApiError(meta.errors.alreadyMuting);
			}

			// Check if expiresAt is past
			if (ps.expiresAt && ps.expiresAt <= Date.now()) {
				throw new ApiError(meta.errors.expiresAtIsPast);
			}

			await this.channelMutingService.mute({
				requestUserId: me.id,
				targetChannelId: targetChannel.id,
				expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
			});
		});
	}
}
