/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ReversiService } from '@/core/ReversiService.js';
import { ReversiGameEntityService } from '@/core/entities/ReversiGameEntityService.js';
import { ApiError } from '../../error.js';

export const meta = {
	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: '8fb05624-b525-43dd-90f7-511852bdfeee',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			desynced: { type: 'boolean' },
			game: {
				type: 'object',
				optional: true, nullable: true,
				ref: 'ReversiGameDetailed',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		gameId: { type: 'string', format: 'misskey:id' },
		crc32: { type: 'string' },
	},
	required: ['gameId', 'crc32'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const game = await this.reversiService.checkCrc(ps.gameId, ps.crc32);
			if (game) {
				return {
					desynced: true,
					game: await this.reversiGameEntityService.packDetail(game),
				};
			} else {
				return {
					desynced: false,
				};
			}
		});
	}
}
