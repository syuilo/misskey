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

	kind: 'write:account',

	errors: {

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
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private mahjongService: MahjongService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const room = await this.mahjongService.createRoom(me);
			return await this.mahjongService.packRoom(room, me);
		});
	}
}
