/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MahjongService } from '@/core/MahjongService.js';
import { ApiError } from '../../error.js';

export const meta = {
	requireCredential: true,

	kind: 'read:account',

	errors: {
		noSuchRoom: {
			message: 'No such room.',
			code: 'NO_SUCH_ROOM',
			id: 'd77df68f-06f3-492b-9078-e6f72f4acf23',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MahjongRoomDetailed',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roomId: { type: 'string', format: 'misskey:id' },
	},
	required: ['roomId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private mahjongService: MahjongService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const room = await this.mahjongService.getRoom(ps.roomId);

			if (room == null) {
				throw new ApiError(meta.errors.noSuchRoom);
			}

			return await this.mahjongService.packRoom(room, me);
		});
	}
}
