/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { IdService } from '@/core/IdService.js';
import type { MiHashtag } from '@/models/Hashtag.js';
import type { HashtagsRepository, MiMeta } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { UtilityService } from '@/core/UtilityService.js';

@Injectable()
export class HashtagService {
	constructor(
		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.redis)
		private redisClient: Redis.Redis, // TODO: 専用のRedisサーバーを設定できるようにする

		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

		private userEntityService: UserEntityService,
		private featuredService: FeaturedService,
		private idService: IdService,
		private utilityService: UtilityService,
	) {
	}

	@bindThis
	public async updateHashtags(user: { id: MiUser['id']; host: MiUser['host']; }, tags: string[]) {
		for (const tag of tags) {
			await this.updateHashtag(user, tag);
		}
	}

	@bindThis
	public async updateUsertags(user: MiUser, tags: string[]) {
		for (const tag of tags) {
			await this.updateHashtag(user, tag, true, true);
		}

		for (const tag of user.tags.filter(x => !tags.includes(x))) {
			await this.updateHashtag(user, tag, true, false);
		}
	}

	@bindThis
	public async updateHashtag(user: { id: MiUser['id']; host: MiUser['host']; }, tag: string, isUserAttached = false, inc = true) {
		tag = normalizeForSearch(tag);

		// TODO: サンプリング
		this.updateHashtagsRanking(tag, user.id);

		const index = await this.hashtagsRepository.findOneBy({ name: tag });

		if (index == null && !inc) return;

		if (index != null) {
			const q = this.hashtagsRepository.createQueryBuilder('tag').update()
				.where('name = :name', { name: tag });

			const set = {} as Record<string, () => string>;

			if (isUserAttached) {
				if (inc) {
				// 自分が初めてこのタグを使ったなら
					if (!index.attachedUserIds.some(id => id === user.id)) {
						set.attachedUserIds = () => `array_append("attachedUserIds", '${user.id}')`;
						set.attachedUsersCount = () => '"attachedUsersCount" + 1';
					}
					// 自分が(ローカル内で)初めてこのタグを使ったなら
					if (this.userEntityService.isLocalUser(user) && !index.attachedLocalUserIds.some(id => id === user.id)) {
						set.attachedLocalUserIds = () => `array_append("attachedLocalUserIds", '${user.id}')`;
						set.attachedLocalUsersCount = () => '"attachedLocalUsersCount" + 1';
					}
					// 自分が(リモートで)初めてこのタグを使ったなら
					if (this.userEntityService.isRemoteUser(user) && !index.attachedRemoteUserIds.some(id => id === user.id)) {
						set.attachedRemoteUserIds = () => `array_append("attachedRemoteUserIds", '${user.id}')`;
						set.attachedRemoteUsersCount = () => '"attachedRemoteUsersCount" + 1';
					}
				} else {
					set.attachedUserIds = () => `array_remove("attachedUserIds", '${user.id}')`;
					set.attachedUsersCount = () => '"attachedUsersCount" - 1';
					if (this.userEntityService.isLocalUser(user)) {
						set.attachedLocalUserIds = () => `array_remove("attachedLocalUserIds", '${user.id}')`;
						set.attachedLocalUsersCount = () => '"attachedLocalUsersCount" - 1';
					} else {
						set.attachedRemoteUserIds = () => `array_remove("attachedRemoteUserIds", '${user.id}')`;
						set.attachedRemoteUsersCount = () => '"attachedRemoteUsersCount" - 1';
					}
				}
			} else {
				// 自分が初めてこのタグを使ったなら
				if (!index.mentionedUserIds.some(id => id === user.id)) {
					set.mentionedUserIds = () => `array_append("mentionedUserIds", '${user.id}')`;
					set.mentionedUsersCount = () => '"mentionedUsersCount" + 1';
				}
				// 自分が(ローカル内で)初めてこのタグを使ったなら
				if (this.userEntityService.isLocalUser(user) && !index.mentionedLocalUserIds.some(id => id === user.id)) {
					set.mentionedLocalUserIds = () => `array_append("mentionedLocalUserIds", '${user.id}')`;
					set.mentionedLocalUsersCount = () => '"mentionedLocalUsersCount" + 1';
				}
				// 自分が(リモートで)初めてこのタグを使ったなら
				if (this.userEntityService.isRemoteUser(user) && !index.mentionedRemoteUserIds.some(id => id === user.id)) {
					set.mentionedRemoteUserIds = () => `array_append("mentionedRemoteUserIds", '${user.id}')`;
					set.mentionedRemoteUsersCount = () => '"mentionedRemoteUsersCount" + 1';
				}
			}

			if (Object.keys(set).length > 0) {
				q.set(set);
				q.execute();
			}
		} else {
			if (isUserAttached) {
				this.hashtagsRepository.insert({
					id: this.idService.gen(),
					name: tag,
					mentionedUserIds: [],
					mentionedUsersCount: 0,
					mentionedLocalUserIds: [],
					mentionedLocalUsersCount: 0,
					mentionedRemoteUserIds: [],
					mentionedRemoteUsersCount: 0,
					attachedUserIds: [user.id],
					attachedUsersCount: 1,
					attachedLocalUserIds: this.userEntityService.isLocalUser(user) ? [user.id] : [],
					attachedLocalUsersCount: this.userEntityService.isLocalUser(user) ? 1 : 0,
					attachedRemoteUserIds: this.userEntityService.isRemoteUser(user) ? [user.id] : [],
					attachedRemoteUsersCount: this.userEntityService.isRemoteUser(user) ? 1 : 0,
				} as MiHashtag);
			} else {
				this.hashtagsRepository.insert({
					id: this.idService.gen(),
					name: tag,
					mentionedUserIds: [user.id],
					mentionedUsersCount: 1,
					mentionedLocalUserIds: this.userEntityService.isLocalUser(user) ? [user.id] : [],
					mentionedLocalUsersCount: this.userEntityService.isLocalUser(user) ? 1 : 0,
					mentionedRemoteUserIds: this.userEntityService.isRemoteUser(user) ? [user.id] : [],
					mentionedRemoteUsersCount: this.userEntityService.isRemoteUser(user) ? 1 : 0,
					attachedUserIds: [],
					attachedUsersCount: 0,
					attachedLocalUserIds: [],
					attachedLocalUsersCount: 0,
					attachedRemoteUserIds: [],
					attachedRemoteUsersCount: 0,
				} as MiHashtag);
			}
		}
	}

	@bindThis
	public async updateHashtagsRanking(hashtag: string, userId: MiUser['id']): Promise<void> {
		const hiddenTags = this.meta.hiddenTags.map(t => normalizeForSearch(t));
		if (hiddenTags.includes(hashtag)) return;
		if (this.utilityService.isKeyWordIncluded(hashtag, this.meta.sensitiveWords)) return;

		// YYYYMMDDHHmm (10分間隔)
		const now = new Date();
		now.setMinutes(Math.floor(now.getMinutes() / 10) * 10, 0, 0);
		const window = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}`;

		const exist = await this.redisClient.sismember(`hashtagUsers:${hashtag}`, userId);
		if (exist === 1) return;

		this.featuredService.updateHashtagsRanking(hashtag, 1);

		const redisPipeline = this.redisClient.pipeline();

		// チャート用
		redisPipeline.pfadd(`hashtagUsers:${hashtag}:${window}`, userId);
		redisPipeline.expire(`hashtagUsers:${hashtag}:${window}`,
			60 * 60 * 24 * 3, // 3日間
			'NX', // "NX -- Set expiry only when the key has no expiry" = 有効期限がないときだけ設定
		);

		// ユニークカウント用
		// TODO: Bloom Filter を使うようにしても良さそう
		redisPipeline.sadd(`hashtagUsers:${hashtag}`, userId);
		redisPipeline.expire(`hashtagUsers:${hashtag}`,
			60 * 60, // 1時間
			'NX', // "NX -- Set expiry only when the key has no expiry" = 有効期限がないときだけ設定
		);

		redisPipeline.exec();
	}

	@bindThis
	public async getChart(hashtag: string, range: number): Promise<number[]> {
		const now = new Date();
		now.setMinutes(Math.floor(now.getMinutes() / 10) * 10, 0, 0);

		const redisPipeline = this.redisClient.pipeline();

		for (let i = 0; i < range; i++) {
			const window = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}`;
			redisPipeline.pfcount(`hashtagUsers:${hashtag}:${window}`);
			now.setMinutes(now.getMinutes() - (i * 10), 0, 0);
		}

		const result = await redisPipeline.exec();

		if (result == null) return [];

		return result.map(x => x[1]) as number[];
	}

	@bindThis
	public async getCharts(hashtags: string[], range: number): Promise<Record<string, number[]>> {
		const now = new Date();
		now.setMinutes(Math.floor(now.getMinutes() / 10) * 10, 0, 0);

		const redisPipeline = this.redisClient.pipeline();

		for (let i = 0; i < range; i++) {
			const window = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}`;
			for (const hashtag of hashtags) {
				redisPipeline.pfcount(`hashtagUsers:${hashtag}:${window}`);
			}
			now.setMinutes(now.getMinutes() - (i * 10), 0, 0);
		}

		const result = await redisPipeline.exec();

		if (result == null) return {};

		// key is hashtag
		const charts = {} as Record<string, number[]>;
		for (const hashtag of hashtags) {
			charts[hashtag] = [];
		}

		for (let i = 0; i < range; i++) {
			for (let j = 0; j < hashtags.length; j++) {
				charts[hashtags[j]].push(result[(i * hashtags.length) + j][1] as number);
			}
		}

		return charts;
	}
}
