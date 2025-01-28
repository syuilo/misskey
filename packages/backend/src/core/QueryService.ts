/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets, ObjectLiteral } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
import type { UserProfilesRepository, FollowingsRepository, ChannelFollowingsRepository, BlockingsRepository, NoteThreadMutingsRepository, MutingsRepository, RenoteMutingsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import type { SelectQueryBuilder } from 'typeorm';

@Injectable()
export class QueryService {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.noteThreadMutingsRepository)
		private noteThreadMutingsRepository: NoteThreadMutingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		private idService: IdService,
	) {
	}

	public makePaginationQuery<T extends ObjectLiteral>(q: SelectQueryBuilder<T>, sinceId?: string | null, untilId?: string | null, sinceDate?: number | null, untilDate?: number | null): SelectQueryBuilder<T> {
		if (sinceId && untilId) {
			q.andWhere(`${q.alias}.id > :sinceId`, { sinceId: sinceId });
			q.andWhere(`${q.alias}.id < :untilId`, { untilId: untilId });
			q.orderBy(`${q.alias}.id`, 'DESC');
		} else if (sinceId) {
			q.andWhere(`${q.alias}.id > :sinceId`, { sinceId: sinceId });
			q.orderBy(`${q.alias}.id`, 'ASC');
		} else if (untilId) {
			q.andWhere(`${q.alias}.id < :untilId`, { untilId: untilId });
			q.orderBy(`${q.alias}.id`, 'DESC');
		} else if (sinceDate && untilDate) {
			q.andWhere(`${q.alias}.id > :sinceId`, { sinceId: this.idService.gen(sinceDate) });
			q.andWhere(`${q.alias}.id < :untilId`, { untilId: this.idService.gen(untilDate) });
			q.orderBy(`${q.alias}.id`, 'DESC');
		} else if (sinceDate) {
			q.andWhere(`${q.alias}.id > :sinceId`, { sinceId: this.idService.gen(sinceDate) });
			q.orderBy(`${q.alias}.id`, 'ASC');
		} else if (untilDate) {
			q.andWhere(`${q.alias}.id < :untilId`, { untilId: this.idService.gen(untilDate) });
			q.orderBy(`${q.alias}.id`, 'DESC');
		} else {
			q.orderBy(`${q.alias}.id`, 'DESC');
		}
		return q;
	}

	// ここでいうBlockedは被Blockedの意
	@bindThis
	public generateBlockedUserQuery(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
		const blockingQuery = this.blockingsRepository.createQueryBuilder('blocking')
			.select('blocking.blockerId')
			.where('blocking.blockeeId = :blockeeId', { blockeeId: me.id });

		// 投稿の作者にブロックされていない かつ
		// 投稿の返信先の作者にブロックされていない かつ
		// 投稿の引用元の作者にブロックされていない
		q
			.andWhere(`note.userId NOT IN (${ blockingQuery.getQuery() })`)
			.andWhere(new Brackets(qb => {
				qb
					.where('note.replyUserId IS NULL')
					.orWhere(`note.replyUserId NOT IN (${ blockingQuery.getQuery() })`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where('note.renoteUserId IS NULL')
					.orWhere(`note.renoteUserId NOT IN (${ blockingQuery.getQuery() })`);
			}));

		q.setParameters(blockingQuery.getParameters());
	}

	@bindThis
	public generateBlockQueryForUsers(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
		const blockingQuery = this.blockingsRepository.createQueryBuilder('blocking')
			.select('blocking.blockeeId')
			.where('blocking.blockerId = :blockerId', { blockerId: me.id });

		const blockedQuery = this.blockingsRepository.createQueryBuilder('blocking')
			.select('blocking.blockerId')
			.where('blocking.blockeeId = :blockeeId', { blockeeId: me.id });

		q.andWhere(`user.id NOT IN (${ blockingQuery.getQuery() })`);
		q.setParameters(blockingQuery.getParameters());

		q.andWhere(`user.id NOT IN (${ blockedQuery.getQuery() })`);
		q.setParameters(blockedQuery.getParameters());
	}

	@bindThis
	public generateMutedNoteThreadQuery(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
		const mutedQuery = this.noteThreadMutingsRepository.createQueryBuilder('threadMuted')
			.select('threadMuted.threadId')
			.where('threadMuted.userId = :userId', { userId: me.id });

		q.andWhere(`note.id NOT IN (${ mutedQuery.getQuery() })`);
		q.andWhere(new Brackets(qb => {
			qb
				.where('note.threadId IS NULL')
				.orWhere(`note.threadId NOT IN (${ mutedQuery.getQuery() })`);
		}));

		q.setParameters(mutedQuery.getParameters());
	}

	@bindThis
	public generateMutedUserQuery(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }, exclude?: { id: MiUser['id'] }, checkMentions = true): void {
		const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('muting.muteeId')
			.where('muting.muterId = :muterId', { muterId: me.id });

		const mutingArrayQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('array_agg(muting.muteeId)', 'muting.muteeIdArray')
			.where('muting.muterId = :muterId', { muterId: me.id });

		if (exclude) {
			mutingQuery.andWhere('muting.muteeId != :excludeId', { excludeId: exclude.id });
			mutingArrayQuery.andWhere('muting.muteeId != :excludeId', { excludeId: exclude.id });
		}

		const mutingInstanceQuery = this.userProfilesRepository.createQueryBuilder('user_profile')
			.select('user_profile.mutedInstances')
			.where('user_profile.userId = :muterId', { muterId: me.id });

		// 投稿の作者をミュートしていない かつ
		// 投稿の返信先の作者をミュートしていない かつ
		// 投稿の引用元の作者をミュートしていない
		q
			.andWhere(`note.userId NOT IN (${ mutingQuery.getQuery() })`)
			.andWhere(new Brackets(qb => {
				qb
					.where('note.replyUserId IS NULL')
					.orWhere(`note.replyUserId NOT IN (${ mutingQuery.getQuery() })`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where('note.renoteUserId IS NULL')
					.orWhere(`note.renoteUserId NOT IN (${ mutingQuery.getQuery() })`);
			}))
			// mute instances
			.andWhere(new Brackets(qb => {
				qb
					.andWhere('note.userHost IS NULL')
					.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? note.userHost)`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where('note.replyUserHost IS NULL')
					.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? note.replyUserHost)`);
			}))
			.andWhere(new Brackets(qb => {
				qb
					.where('note.renoteUserHost IS NULL')
					.orWhere(`NOT ((${ mutingInstanceQuery.getQuery() })::jsonb ? note.renoteUserHost)`);
			}));

		// 投稿に含まれるメンションの相手をミュートしていない
		if (checkMentions) {
			q.andWhere(new Brackets(qb => {
				qb
					.where('note.mentions IS NULL')
					.orWhere(`NOT EXISTS (${ mutingQuery.getQuery() })`)
					.orWhere(`NOT (note.mentions && (${ mutingArrayQuery.getQuery() }))`);
			}));
		}

		q.setParameters(mutingQuery.getParameters());
		q.setParameters(mutingArrayQuery.getParameters());
		q.setParameters(mutingInstanceQuery.getParameters());
	}

	@bindThis
	public generateMutedUserQueryForUsers(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
		const mutingQuery = this.mutingsRepository.createQueryBuilder('muting')
			.select('muting.muteeId')
			.where('muting.muterId = :muterId', { muterId: me.id });

		q.andWhere(`user.id NOT IN (${ mutingQuery.getQuery() })`);

		q.setParameters(mutingQuery.getParameters());
	}

	@bindThis
	public generateVisibilityQuery(q: SelectQueryBuilder<any>, me?: { id: MiUser['id'] } | null): void {
		// This code must always be synchronized with the checks in Notes.isVisibleForMe.
		if (me == null) {
			q.andWhere(new Brackets(qb => {
				qb
					.where('note.visibility = \'public\'')
					.orWhere('note.visibility = \'home\'');
			}));
		} else {
			const followingQuery = this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :meId');

			q.andWhere(new Brackets(qb => {
				qb
				// 公開投稿である
					.where(new Brackets(qb => {
						qb
							.where('note.visibility = \'public\'')
							.orWhere('note.visibility = \'home\'');
					}))
				// または 自分自身
					.orWhere('note.userId = :meId')
				// または 自分宛て
					.orWhere(':meIdAsList <@ note.visibleUserIds')
					.orWhere(':meIdAsList <@ note.mentions')
					.orWhere(new Brackets(qb => {
						qb
						// または フォロワー宛ての投稿であり、
							.where('note.visibility = \'followers\'')
							.andWhere(new Brackets(qb => {
								qb
								// 自分がフォロワーである
									.where(`note.userId IN (${ followingQuery.getQuery() })`)
								// または 自分の投稿へのリプライ
									.orWhere('note.replyUserId = :meId');
							}));
					}));
			}));

			q.setParameters({ meId: me.id, meIdAsList: [me.id] });
		}
	}

	@bindThis
	public generateMutedUserRenotesQueryForNotes(q: SelectQueryBuilder<any>, me: { id: MiUser['id'] }): void {
		const mutingQuery = this.renoteMutingsRepository.createQueryBuilder('renote_muting')
			.select('renote_muting.muteeId')
			.where('renote_muting.muterId = :muterId', { muterId: me.id });

		q.andWhere(new Brackets(qb => {
			qb
				.where(new Brackets(qb => {
					qb.where('note.renoteId IS NOT NULL');
					qb.andWhere('note.text IS NULL');
					qb.andWhere(`note.userId NOT IN (${ mutingQuery.getQuery() })`);
				}))
				.orWhere('note.renoteId IS NULL')
				.orWhere('note.text IS NOT NULL');
		}));

		q.setParameters(mutingQuery.getParameters());
	}
}
