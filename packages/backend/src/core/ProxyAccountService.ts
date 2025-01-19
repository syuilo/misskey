/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import type { MiMeta, UsersRepository } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { CreateSystemUserService } from '@/core/CreateSystemUserService.js';
import { MemorySingleCache } from '@/misc/cache.js';
import { MetaService } from '@/core/MetaService.js';

const ACTOR_USERNAME = 'proxy.actor' as const;

@Injectable()
export class ProxyAccountService {
	private cache: MemorySingleCache<MiLocalUser>;

	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private createSystemUserService: CreateSystemUserService,
		private metaService: MetaService,
	) {
		this.cache = new MemorySingleCache<MiLocalUser>(Infinity);
	}

	@bindThis
	public async fetch(): Promise<MiLocalUser | null> {
		if (this.meta.proxyAccountId == null) return null;
		const cached = this.cache.get();
		if (cached) return cached;

		const user = await this.usersRepository.findOneBy({
			host: IsNull(),
			username: ACTOR_USERNAME,
		}) as MiLocalUser | undefined;

		if (user) {
			this.cache.set(user);
			return user;
		} else {
			const created = await this.createSystemUserService.createSystemUser(ACTOR_USERNAME) as MiLocalUser;
			this.cache.set(created);
			const set = {} as Partial<MiMeta>;
			set.proxyAccountId = created.id;
			await this.metaService.update(set);
			return created;
		}
	}
}
