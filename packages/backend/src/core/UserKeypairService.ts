/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import { genEd25519KeyPair, importPrivateKey, PrivateKey, PrivateKeyWithPem } from '@misskey-dev/node-http-message-signatures';
import type { MiUser } from '@/models/User.js';
import type { UserKeypairsRepository } from '@/models/_.js';
import { RedisKVCache, MemoryKVCache } from '@/misc/cache.js';
import type { MiUserKeypair } from '@/models/UserKeypair.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService, GlobalEvents } from '@/core/GlobalEventService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { webcrypto } from 'node:crypto';

@Injectable()
export class UserKeypairService implements OnApplicationShutdown {
	private keypairEntityCache: RedisKVCache<MiUserKeypair>;
	private privateKeyObjectCache: MemoryKVCache<webcrypto.CryptoKey>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.userKeypairsRepository)
		private userKeypairsRepository: UserKeypairsRepository,

		private globalEventService: GlobalEventService,
		private userEntityService: UserEntityService,
	) {
		this.keypairEntityCache = new RedisKVCache<MiUserKeypair>(this.redisClient, 'userKeypair', {
			lifetime: 1000 * 60 * 60 * 24, // 24h
			memoryCacheLifetime: 1000 * 60 * 60, // 1h
			fetcher: (key) => this.userKeypairsRepository.findOneByOrFail({ userId: key }),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => JSON.parse(value),
		});
		this.privateKeyObjectCache = new MemoryKVCache<webcrypto.CryptoKey>(1000 * 60 * 60 * 1);

		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	public async getUserKeypair(userId: MiUser['id']): Promise<MiUserKeypair> {
		return await this.keypairEntityCache.fetch(userId);
	}

	/**
	 * Get private key [Only PrivateKeyWithPem for queue data etc.]
	 * @param userIdOrHint user id or MiUserKeypair
	 * @param preferType
	 *		If ed25519-like(`ed25519`, `01`, `11`) is specified, ed25519 keypair will be returned if exists.
	 *		Otherwise, main keypair will be returned.
	 * @returns
	 */
	@bindThis
	public async getLocalUserPrivateKeyPem(
		userIdOrHint: MiUser['id'] | MiUserKeypair,
		preferType?: string,
	): Promise<PrivateKeyWithPem> {
		const keypair = typeof userIdOrHint === 'string' ? await this.getUserKeypair(userIdOrHint) : userIdOrHint;
		if (
			preferType && ['01', '11', 'ed25519'].includes(preferType.toLowerCase()) &&
			keypair.ed25519PublicKey != null && keypair.ed25519PrivateKey != null
		) {
			return {
				keyId: `${this.userEntityService.genLocalUserUri(keypair.userId)}#ed25519-key`,
				privateKeyPem: keypair.ed25519PrivateKey,
			};
		}
		return {
			keyId: `${this.userEntityService.genLocalUserUri(keypair.userId)}#main-key`,
			privateKeyPem: keypair.privateKey,
		};
	}

	/**
	 * Get private key [Only PrivateKey for ap request]
	 * Using cache due to performance reasons of `crypto.subtle.importKey`
	 * @param userIdOrHint user id, MiUserKeypair, or PrivateKeyWithPem
	 * @param preferType
	 * 		If ed25519-like(`ed25519`, `01`, `11`) is specified, ed25519 keypair will be returned if exists.
	 *		Otherwise, main keypair will be returned. (ignored if userIdOrHint is PrivateKeyWithPem)
	 * @returns
	 */
	@bindThis
	public async getLocalUserPrivateKey(
		userIdOrHint: MiUser['id'] | MiUserKeypair | PrivateKeyWithPem,
		preferType?: string,
	): Promise<PrivateKey> {
		if (typeof userIdOrHint === 'object' && 'privateKeyPem' in userIdOrHint) {
			// userIdOrHint is PrivateKeyWithPem
			return {
				keyId: userIdOrHint.keyId,
				privateKey: await this.privateKeyObjectCache.fetch(userIdOrHint.keyId, async () => {
					return await importPrivateKey(userIdOrHint.privateKeyPem);
				}),
			};
		}

		const userId = typeof userIdOrHint === 'string' ? userIdOrHint : userIdOrHint.userId;
		const getKeypair = () => typeof userIdOrHint === 'string' ? this.getUserKeypair(userId) : userIdOrHint;

		if (preferType && ['01', '11', 'ed25519'].includes(preferType.toLowerCase())) {
			const keyId = `${this.userEntityService.genLocalUserUri(userId)}#ed25519-key`;
			const fetched = await this.privateKeyObjectCache.fetchMaybe(keyId, async () => {
				const keypair = await getKeypair();
				if (keypair.ed25519PublicKey != null && keypair.ed25519PrivateKey != null) {
					return await importPrivateKey(keypair.ed25519PrivateKey);
				}
				return;
			});
			if (fetched) {
				return {
					keyId,
					privateKey: fetched,
				};
			}
		}

		const keyId = `${this.userEntityService.genLocalUserUri(userId)}#main-key`;
		return {
			keyId,
			privateKey: await this.privateKeyObjectCache.fetch(keyId, async () => {
				const keypair = await getKeypair();
				return await importPrivateKey(keypair.privateKey);
			}),
		};
	}

	@bindThis
	public async refresh(userId: MiUser['id']): Promise<void> {
		return await this.keypairEntityCache.refresh(userId);
	}

	/**
	 * If DB has ed25519 keypair, refresh cache and return it.
	 * If not, create, save and return ed25519 keypair.
	 * @param userId user id
	 * @returns MiUserKeypair if keypair is created, void if keypair is already exists
	 */
	@bindThis
	public async refreshAndPrepareEd25519KeyPair(userId: MiUser['id']): Promise<MiUserKeypair | void> {
		await this.refresh(userId);
		const keypair = await this.keypairEntityCache.fetch(userId);
		if (keypair.ed25519PublicKey != null) {
			return;
		}

		const ed25519 = await genEd25519KeyPair();
		await this.userKeypairsRepository.update({ userId }, {
			ed25519PublicKey: ed25519.publicKey,
			ed25519PrivateKey: ed25519.privateKey,
		});
		this.globalEventService.publishInternalEvent('userKeypairUpdated', { userId });
		const result = {
			...keypair,
			ed25519PublicKey: ed25519.publicKey,
			ed25519PrivateKey: ed25519.privateKey,
		};
		this.keypairEntityCache.set(userId, result);
		return result;
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'userKeypairUpdated': {
					this.refresh(body.userId);
					break;
				}
			}
		}
	}
	@bindThis
	public dispose(): void {
		this.keypairEntityCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
