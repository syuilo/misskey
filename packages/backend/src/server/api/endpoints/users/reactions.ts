/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository, NoteReactionsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteReactionEntityService } from '@/core/entities/NoteReactionEntityService.js';
import { DI } from '@/di-symbols.js';
import { CacheService } from '@/core/CacheService.js';
import { RoleService } from '@/core/RoleService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users', 'reactions'],

	requireCredential: false,

	description: 'Show all reactions this user made.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'NoteReaction',
		},
	},

	errors: {
		reactionsNotPublic: {
			message: 'Reactions of the user is not public.',
			code: 'REACTIONS_NOT_PUBLIC',
			id: '673a7dd2-6924-1093-e0c0-e68456ceae5c',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		private cacheService: CacheService,
		private noteReactionEntityService: NoteReactionEntityService,
		private queryService: QueryService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const userIdsWhoBlockingMe = me ? await this.cacheService.userBlockedCache.fetch(me.id) : new Set<string>();
			const iAmModerator = me ? await this.roleService.isModerator(me) : false; // Moderators can see reactions of all users
			if (!iAmModerator) {
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });
				if ((me == null || me.id !== ps.userId) && !profile.publicReactions) {
					throw new ApiError(meta.errors.reactionsNotPublic);
				}

				// early return if me is blocked by requesting user
				if (userIdsWhoBlockingMe.has(ps.userId)) {
					return [];
				}
			}

			const userIdsWhoMeMuting = me ? await this.cacheService.userMutingsCache.fetch(me.id) : new Set<string>();

			const query = this.queryService.makePaginationQuery(this.noteReactionsRepository.createQueryBuilder('reaction'),
				ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('reaction.userId = :userId', { userId: ps.userId })
				.leftJoinAndSelect('reaction.note', 'note');

			this.queryService.generateVisibilityQuery(query, me);

			const reactions = (await query
				.limit(ps.limit)
				.getMany()).filter(reaction => {
				if (reaction.note?.userId === ps.userId) return true; // we can see reactions to note of requesting user
				if (me && isUserRelated(reaction.note, userIdsWhoBlockingMe)) return false;
				if (me && isUserRelated(reaction.note, userIdsWhoMeMuting)) return false;

				return true;
			});

			return await this.noteReactionEntityService.packMany(reactions, me, { withNote: true });
		});
	}
}
