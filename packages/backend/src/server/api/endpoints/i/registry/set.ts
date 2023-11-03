/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistryItemsRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		key: { type: 'string', minLength: 1 },
		value: {},
		scope: { type: 'array', default: [], items: {
			type: 'string', pattern: /^[a-zA-Z0-9_]+$/.toString().slice(1, -1),
		} },
		domain: { type: 'string', nullable: true },
	},
	required: ['key', 'value'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.registryItemsRepository)
		private registryItemsRepository: RegistryItemsRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me, accessToken) => {
			// TODO: 作成できるキーの数を制限する

			const query = this.registryItemsRepository.createQueryBuilder('item');
			if (accessToken) {
				query.where('item.domain = :domain', { domain: accessToken.id });
			} else {
				if (ps.domain) {
					query.where('item.domain = :domain', { domain: ps.domain });
				} else {
					query.where('item.domain IS NULL');
				}
			}
			query.andWhere('item.userId = :userId', { userId: me.id });
			query.andWhere('item.key = :key', { key: ps.key });
			query.andWhere('item.scope = :scope', { scope: ps.scope });

			const existingItem = await query.getOne();

			if (existingItem) {
				await this.registryItemsRepository.update(existingItem.id, {
					updatedAt: new Date(),
					value: ps.value,
				});
			} else {
				await this.registryItemsRepository.insert({
					id: this.idService.gen(),
					updatedAt: new Date(),
					userId: me.id,
					domain: accessToken ? accessToken.id : (ps.domain ?? null),
					scope: ps.scope,
					key: ps.key,
					value: ps.value,
				});
			}

			if (accessToken == null) {
				// TODO: サードパーティアプリが傍受出来てしまうのでどうにかする
				this.globalEventService.publishMainStream(me.id, 'registryUpdated', {
					scope: ps.scope,
					key: ps.key,
					value: ps.value,
				});
			}
		});
	}
}
