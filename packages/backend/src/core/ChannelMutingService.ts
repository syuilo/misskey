/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Brackets, In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { ChannelMutingRepository, ChannelsRepository, MiChannel, MiChannelMuting, MiUser } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEvents, GlobalEventService } from '@/core/GlobalEventService.js';
import { bindThis } from '@/decorators.js';
import { RedisKVCache } from '@/misc/cache.js';

@Injectable()
export class ChannelMutingService {
	public mutingChannelsCache: RedisKVCache<Set<string>>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,
		@Inject(DI.channelMutingRepository)
		private channelMutingRepository: ChannelMutingRepository,
		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		this.mutingChannelsCache = new RedisKVCache<Set<string>>(this.redisClient, 'channelMutingChannels', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (userId) => this.channelMutingRepository.find({
				where: { userId: userId },
				select: ['channelId'],
			}).then(xs => new Set(xs.map(x => x.channelId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.redisForSub.on('message', this.onMessage);
	}

	/**
	 * ミュートしているチャンネルの一覧を取得する.
	 * @param params
	 * @param [opts]
	 * @param	{(boolean|undefined)} [opts.idOnly=false] チャンネルIDのみを取得するかどうか. ID以外のフィールドに値がセットされなくなり、他テーブルとのJOINも一切されなくなるので注意.
	 * @param {(boolean|undefined)} [opts.joinUser=undefined] チャンネルオーナーのユーザ情報をJOINするかどうか(falseまたは省略時はJOINしない).
	 * @param {(boolean|undefined)} [opts.joinBannerFile=undefined] バナー画像のドライブファイルをJOINするかどうか(falseまたは省略時はJOINしない).
	 */
	@bindThis
	public async list(
		params: {
			requestUserId: MiUser['id'],
		},
		opts?: {
			idOnly?: boolean;
			joinUser?: boolean;
			joinBannerFile?: boolean;
		},
	): Promise<MiChannel[]> {
		if (opts?.idOnly) {
			const q = this.channelMutingRepository.createQueryBuilder('channel_muting')
				.select('channel_muting.channelId')
				.where('channel_muting.userId = :userId', { userId: params.requestUserId })
				.andWhere(new Brackets(qb => {
					qb.where('channel_muting.expiresAt IS NULL')
						.orWhere('channel_muting.expiresAt > :now', { now: new Date() });
				}));

			return q
				.getRawMany<{ channel_muting_channelId: string }>()
				.then(xs => xs.map(x => ({ id: x.channel_muting_channelId } as MiChannel)));
		} else {
			const q = this.channelsRepository.createQueryBuilder('channel')
				.innerJoin('channel_muting', 'channel_muting', 'channel_muting.channelId = channel.id')
				.where('channel_muting.userId = :userId', { userId: params.requestUserId })
				.andWhere(new Brackets(qb => {
					qb.where('channel_muting.expiresAt IS NULL')
						.orWhere('channel_muting.expiresAt > :now', { now: new Date() });
				}));

			if (opts?.joinUser) {
				q.innerJoinAndSelect('channel.user', 'user');
			}

			if (opts?.joinBannerFile) {
				q.leftJoinAndSelect('channel.banner', 'drive_file');
			}

			return q.getMany();
		}
	}

	/**
	 * 期限切れのチャンネルミュート情報を取得する.
	 *
	 * @param [opts]
	 * @param {(boolean|undefined)} [opts.joinUser=undefined] チャンネルミュートを設定したユーザ情報をJOINするかどうか(falseまたは省略時はJOINしない).
	 * @param {(boolean|undefined)} [opts.joinChannel=undefined] ミュート先のチャンネル情報をJOINするかどうか(falseまたは省略時はJOINしない).
	 */
	public async findExpiredMutings(opts?: {
		joinUser?: boolean;
		joinChannel?: boolean;
	}): Promise<MiChannelMuting[]> {
		const now = new Date();
		const q = this.channelMutingRepository.createQueryBuilder('channel_muting')
			.where('channel_muting.expiresAt < :now', { now });

		if (opts?.joinUser) {
			q.innerJoinAndSelect('channel_muting.user', 'user');
		}

		if (opts?.joinChannel) {
			q.leftJoinAndSelect('channel_muting.channel', 'channel');
		}

		return q.getMany();
	}

	/**
	 * 既にミュートされているかどうかをキャッシュから取得する.
	 * @param params
	 * @param params.requestUserId
	 */
	@bindThis
	public async isMuted(params: {
		requestUserId: MiUser['id'],
		targetChannelId: MiChannel['id'],
	}): Promise<boolean> {
		const mutedChannels = await this.mutingChannelsCache.get(params.requestUserId);
		return (mutedChannels?.has(params.targetChannelId) ?? false);
	}

	/**
	 * チャンネルをミュートする.
	 * @param params
	 * @param {(Date|null|undefined)} [params.expiresAt] ミュートの有効期限. nullまたは省略時は無期限.
	 */
	@bindThis
	public async mute(params: {
		requestUserId: MiUser['id'],
		targetChannelId: MiChannel['id'],
		expiresAt?: Date | null,
	}): Promise<void> {
		await this.channelMutingRepository.insert({
			id: this.idService.gen(),
			userId: params.requestUserId,
			channelId: params.targetChannelId,
			expiresAt: params.expiresAt,
		});

		this.globalEventService.publishInternalEvent('muteChannel', {
			userId: params.requestUserId,
			channelId: params.targetChannelId,
		});
	}

	/**
	 * チャンネルのミュートを解除する.
	 * @param params
	 */
	@bindThis
	public async unmute(params: {
		requestUserId: MiUser['id'],
		targetChannelId: MiChannel['id'],
	}): Promise<void> {
		await this.channelMutingRepository.delete({
			userId: params.requestUserId,
			channelId: params.targetChannelId,
		});

		this.globalEventService.publishInternalEvent('unmuteChannel', {
			userId: params.requestUserId,
			channelId: params.targetChannelId,
		});
	}

	/**
	 * 期限切れのチャンネルミュート情報を削除する.
	 */
	@bindThis
	public async eraseExpiredMutings(): Promise<void> {
		const expiredMutings = await this.findExpiredMutings();
		await this.channelMutingRepository.delete({ id: In(expiredMutings.map(x => x.id)) });

		const userIds = [...new Set(expiredMutings.map(x => x.userId))];
		for (const userId of userIds) {
			this.mutingChannelsCache.refresh(userId).then();
		}
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'muteChannel': {
					this.mutingChannelsCache.refresh(body.userId).then();
					break;
				}
				case 'unmuteChannel': {
					this.mutingChannelsCache.delete(body.userId).then();
					break;
				}
			}
		}
	}

	@bindThis
	public dispose(): void {
		this.mutingChannelsCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
