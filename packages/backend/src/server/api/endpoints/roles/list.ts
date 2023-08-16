/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MiRolesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';

export const meta = {
	tags: ['role'],

	requireCredential: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
	},
	required: [
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: MiRolesRepository,

		private roleEntityService: RoleEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const roles = await this.rolesRepository.findBy({
				isPublic: true,
				isExplorable: true,
			});
			return await this.roleEntityService.packMany(roles, me);
		});
	}
}
