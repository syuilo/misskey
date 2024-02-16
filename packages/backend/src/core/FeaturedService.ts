/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { MiGalleryPost, MiNote, MiUser } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

const GLOBAL_NOTES_RANKING_WINDOW = 1000 * 60 * 60 * 24 * 3; // 3日ごと
export const GALLERY_POSTS_RANKING_WINDOW = 1000 * 60 * 60 * 24 * 3; // 3日ごと
const PER_USER_NOTES_RANKING_WINDOW = 1000 * 60 * 60 * 24 * 7; // 1週間ごと
const HASHTAG_RANKING_WINDOW = 1000 * 60 * 60; // 1時間ごと

const featuredEpoc = new Date('2023-01-01T00:00:00Z').getTime();

@Injectable()
export class FeaturedService {
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis, // TODO: 専用のRedisサーバーを設定できるようにする
	) {
	}

	@bindThis
	private getCurrentWindow(windowRange: number): number {
		const passed = new Date().getTime() - featuredEpoc;
		return Math.floor(passed / windowRange);
	}

	@bindThis
	private async updateRankingOf(name: string, windowRange: number, element: string, score = 1): Promise<void> {
		const currentWindow = this.getCurrentWindow(windowRange);
		const redisTransaction = this.redisClient.multi();
		redisTransaction.zincrby(
			`${name}:${currentWindow}`,
			score,
			element);
		redisTransaction.expire(
			`${name}:${currentWindow}`,
			(windowRange * 3) / 1000,
			'NX'); // "NX -- Set expiry only when the key has no expiry" = 有効期限がないときだけ設定
		await redisTransaction.exec();
	}

	@bindThis
	private async getRankingOf(name: string, windowRange: number, threshold: number): Promise<string[]> {
		const currentWindow = this.getCurrentWindow(windowRange);
		const previousWindow = currentWindow - 1;

		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.zrange(
			`${name}:${currentWindow}`, 0, threshold, 'REV', 'WITHSCORES');
		redisPipeline.zrange(
			`${name}:${previousWindow}`, 0, threshold, 'REV', 'WITHSCORES');
		const [currentRankingResult, previousRankingResult] = await redisPipeline.exec().then(result => result ? result.map(r => (r[1] ?? []) as string[]) : [[], []]);

		const ranking = new Map<string, number>();
		for (let i = 0; i < currentRankingResult.length; i += 2) {
			const noteId = currentRankingResult[i];
			const score = parseInt(currentRankingResult[i + 1], 10);
			ranking.set(noteId, score);
		}
		for (let i = 0; i < previousRankingResult.length; i += 2) {
			const noteId = previousRankingResult[i];
			const score = parseInt(previousRankingResult[i + 1], 10);
			const exist = ranking.get(noteId);
			if (exist != null) {
				ranking.set(noteId, (exist + score) / 2);
			} else {
				ranking.set(noteId, score);
			}
		}

		return Array.from(ranking.keys());
	}

	// TODO: find better place?
	@bindThis
	public shouldBeIncludedInGlobalOrUserFeatured(note: MiNote): boolean {
		if (note.visibility !== 'public') return false; // non-public note
		if (note.userHost != null) return false; // remote
		if (note.replyId != null) return false; // reply
		// Channels are checked outside

		// In nirila misskey, it was very common to notes with `:ohayo_nirila_misskey:` or `:oyasumi_nirila_misskey:`
		// Will get many reaction`:ohayo_nirila_misskey:` or `:oyasumi_nirila_misskey:` so exclude them
		// if they don't have any images.
		if (note.fileIds.length === 0) {
			for (const exclusion of ["おはよう", "おやすみ", ":ohayo_nirila_misskey:", ":oyasumi_nirila_misskey:", ":kon_nirila_misskey:"]) {
				if (note.text?.includes(exclusion)) return false;
				if (note.cw?.includes(exclusion)) return false;
			}
		}

		return true;
	}

	@bindThis
	private removeNoteFromRankingOf(name: string, windowRange: number, element: string, redisPipeline: Redis.ChainableCommander) {
		// removing from current & previous window is enough
		const currentWindow = this.getCurrentWindow(windowRange);
		const previousWindow = currentWindow - 1;

		redisPipeline.zrem(`${name}:${currentWindow}`, element);
		redisPipeline.zrem(`${name}:${previousWindow}`, element);
	}

	@bindThis
	public async removeNote(note: MiNote): Promise<void> {
		const redisPipeline = this.redisClient.pipeline();
		this.removeNoteFromRankingOf('featuredGlobalNotesRanking', GLOBAL_NOTES_RANKING_WINDOW, note.id, redisPipeline);
		this.removeNoteFromRankingOf(`featuredPerUserNotesRanking:${note.userId}`, PER_USER_NOTES_RANKING_WINDOW, note.id, redisPipeline);

		if (note.channelId) {
			this.removeNoteFromRankingOf(`featuredInChannelNotesRanking:${note.channelId}`, GLOBAL_NOTES_RANKING_WINDOW, note.id, redisPipeline);
		}

		await redisPipeline.exec();
	}

	@bindThis
	private async removeFromRanking(name: string, windowRange: number, element: string): Promise<void> {
		const currentWindow = this.getCurrentWindow(windowRange);
		const previousWindow = currentWindow - 1;

		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.zrem(`${name}:${currentWindow}`, element);
		redisPipeline.zrem(`${name}:${previousWindow}`, element);
		await redisPipeline.exec();
	}

	@bindThis
	public updateGlobalNotesRanking(noteId: MiNote['id'], score = 1): Promise<void> {
		return this.updateRankingOf('featuredGlobalNotesRanking', GLOBAL_NOTES_RANKING_WINDOW, noteId, score);
	}

	@bindThis
	public updateGalleryPostsRanking(galleryPostId: MiGalleryPost['id'], score = 1): Promise<void> {
		return this.updateRankingOf('featuredGalleryPostsRanking', GALLERY_POSTS_RANKING_WINDOW, galleryPostId, score);
	}

	@bindThis
	public updateInChannelNotesRanking(channelId: MiNote['channelId'], noteId: MiNote['id'], score = 1): Promise<void> {
		return this.updateRankingOf(`featuredInChannelNotesRanking:${channelId}`, GLOBAL_NOTES_RANKING_WINDOW, noteId, score);
	}

	@bindThis
	public updatePerUserNotesRanking(userId: MiUser['id'], noteId: MiNote['id'], score = 1): Promise<void> {
		return this.updateRankingOf(`featuredPerUserNotesRanking:${userId}`, PER_USER_NOTES_RANKING_WINDOW, noteId, score);
	}

	@bindThis
	public updateHashtagsRanking(hashtag: string, score = 1): Promise<void> {
		return this.updateRankingOf('featuredHashtagsRanking', HASHTAG_RANKING_WINDOW, hashtag, score);
	}

	@bindThis
	public getGlobalNotesRanking(threshold: number): Promise<MiNote['id'][]> {
		return this.getRankingOf('featuredGlobalNotesRanking', GLOBAL_NOTES_RANKING_WINDOW, threshold);
	}

	@bindThis
	public getGalleryPostsRanking(threshold: number): Promise<MiGalleryPost['id'][]> {
		return this.getRankingOf('featuredGalleryPostsRanking', GALLERY_POSTS_RANKING_WINDOW, threshold);
	}

	@bindThis
	public getInChannelNotesRanking(channelId: MiNote['channelId'], threshold: number): Promise<MiNote['id'][]> {
		return this.getRankingOf(`featuredInChannelNotesRanking:${channelId}`, GLOBAL_NOTES_RANKING_WINDOW, threshold);
	}

	@bindThis
	public getPerUserNotesRanking(userId: MiUser['id'], threshold: number): Promise<MiNote['id'][]> {
		return this.getRankingOf(`featuredPerUserNotesRanking:${userId}`, PER_USER_NOTES_RANKING_WINDOW, threshold);
	}

	@bindThis
	public getHashtagsRanking(threshold: number): Promise<string[]> {
		return this.getRankingOf('featuredHashtagsRanking', HASHTAG_RANKING_WINDOW, threshold);
	}

	@bindThis
	public removeHashtagsFromRanking(hashtag: string): Promise<void> {
		return this.removeFromRanking('featuredHashtagsRanking', HASHTAG_RANKING_WINDOW, hashtag);
	}
}
