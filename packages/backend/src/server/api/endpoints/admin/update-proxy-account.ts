/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as mfm from 'mfm-js';
import { JSDOM } from 'jsdom';
import type { Config } from '@/config.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import type {
	UsersRepository,
	UserProfilesRepository,
	MiUser,
	MiUserProfile,
	DriveFilesRepository,
	PagesRepository,
	MiMeta,
} from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import {
	descriptionSchema,
	MiLocalUser,
	nameSchema,
} from '@/models/User.js';
import { ApiError } from '@/server/api/error.js';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { ApiLoggerService } from '@/server/api/ApiLoggerService.js';
import { HashtagService } from '@/core/HashtagService.js';
import { CacheService } from '@/core/CacheService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { safeForSql } from '@/misc/safe-for-sql.js';
import { ProxyAccountService } from '@/core/ProxyAccountService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:update-proxy-account',
	secure: true,

	errors: {
		noSuchAvatar: {
			message: 'No such avatar file.',
			code: 'NO_SUCH_AVATAR',
			id: '539f3a45-f215-4f81-a9a8-31293640207f',
		},

		noSuchBanner: {
			message: 'No such banner file.',
			code: 'NO_SUCH_BANNER',
			id: '0d8f5629-f210-41c2-9433-735831a58595',
		},

		avatarNotAnImage: {
			message: 'The file specified as an avatar is not an image.',
			code: 'AVATAR_NOT_AN_IMAGE',
			id: 'f419f9f8-2f4d-46b1-9fb4-49d3a2fd7191',
		},

		bannerNotAnImage: {
			message: 'The file specified as a banner is not an image.',
			code: 'BANNER_NOT_AN_IMAGE',
			id: '75aedb19-2afd-4e6d-87fc-67941256fa60',
		},

		noSuchPage: {
			message: 'No such page.',
			code: 'NO_SUCH_PAGE',
			id: '8e01b590-7eb9-431b-a239-860e086c408e',
		},

		invalidRegexp: {
			message: 'Invalid Regular Expression.',
			code: 'INVALID_REGEXP',
			id: '0d786918-10df-41cd-8f33-8dec7d9a89a5',
		},

		tooManyMutedWords: {
			message: 'Too many muted words.',
			code: 'TOO_MANY_MUTED_WORDS',
			id: '010665b1-a211-42d2-bc64-8f6609d79785',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'fcd2eef9-a9b2-4c4f-8624-038099e90aa5',
		},

		uriNull: {
			message: 'User ActivityPup URI is null.',
			code: 'URI_NULL',
			id: 'bf326f31-d430-4f97-9933-5d61e4d48a23',
		},

		forbiddenToSetYourself: {
			message: 'You can\'t set yourself as your own alias.',
			code: 'FORBIDDEN_TO_SET_YOURSELF',
			id: '25c90186-4ab0-49c8-9bba-a1fa6c202ba4',
		},

		restrictedByRole: {
			message: 'This feature is restricted by your role.',
			code: 'RESTRICTED_BY_ROLE',
			id: '8feff0ba-5ab5-585b-31f4-4df816663fad',
		},

		nameContainsProhibitedWords: {
			message: 'Your new name contains prohibited words.',
			code: 'YOUR_NAME_CONTAINS_PROHIBITED_WORDS',
			id: '0b3f9f6a-2f4d-4b1f-9fb4-49d3a2fd7191',
			httpStatusCode: 422,
		},

		accessDenied: {
			message: 'Only administrators can edit members of the role.',
			code: 'ACCESS_DENIED',
			id: '25b5bc31-dc79-4ebd-9bd2-c84978fd052c',
		},
	},

	res: {
		type: 'object',
		nullable: false, optional: false,
		ref: 'UserDetailed',
	},

	required: [],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { ...nameSchema, nullable: true },
		description: { ...descriptionSchema, nullable: true },
		avatarId: { type: 'string', format: 'misskey:id', nullable: true },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private instanceMeta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private roleService: RoleService,
		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private globalEventService: GlobalEventService,
		private accountUpdateService: AccountUpdateService,
		private remoteUserResolveService: RemoteUserResolveService,
		private apiLoggerService: ApiLoggerService,
		private hashtagService: HashtagService,
		private cacheService: CacheService,
		private httpRequestService: HttpRequestService,
		private avatarDecorationService: AvatarDecorationService,
		private utilityService: UtilityService,
		private moderationLogService: ModerationLogService,
		private proxyAccountService: ProxyAccountService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const _me = await this.usersRepository.findOneByOrFail({ id: me.id });
			if (!await this.roleService.isModerator(_me)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			const proxy = await this.proxyAccountService.fetch();
			if (!proxy) throw new ApiError(meta.errors.noSuchUser);

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: proxy.id });

			const updates = {} as Partial<MiUser>;
			const profileUpdates = {} as Partial<MiUserProfile>;

			if (ps.name !== undefined) {
				if (ps.name === null) {
					updates.name = null;
				} else {
					const trimmedName = ps.name.trim();
					updates.name = trimmedName === '' ? null : trimmedName;
				}
			}
			if (ps.description !== undefined) profileUpdates.description = ps.description;

			if (ps.avatarId) {
				const avatar = await this.driveFilesRepository.findOneBy({ id: ps.avatarId });

				if (avatar == null) throw new ApiError(meta.errors.noSuchAvatar);
				if (!avatar.type.startsWith('image/')) throw new ApiError(meta.errors.avatarNotAnImage);

				updates.avatarId = avatar.id;
				updates.avatarUrl = this.driveFileEntityService.getPublicUrl(avatar, 'avatar');
				updates.avatarBlurhash = avatar.blurhash;
			} else if (ps.avatarId === null) {
				updates.avatarId = null;
				updates.avatarUrl = null;
				updates.avatarBlurhash = null;
			}

			if (ps.bannerId) {
				const banner = await this.driveFilesRepository.findOneBy({ id: ps.bannerId });

				if (banner == null) throw new ApiError(meta.errors.noSuchBanner);
				if (!banner.type.startsWith('image/')) throw new ApiError(meta.errors.bannerNotAnImage);

				updates.bannerId = banner.id;
				updates.bannerUrl = this.driveFileEntityService.getPublicUrl(banner);
				updates.bannerBlurhash = banner.blurhash;
			} else if (ps.bannerId === null) {
				updates.bannerId = null;
				updates.bannerUrl = null;
				updates.bannerBlurhash = null;
			}

			//#region emojis/tags
			let emojis = [] as string[];
			let tags = [] as string[];

			const newName = updates.name === undefined ? proxy.name : updates.name;
			const newDescription = profileUpdates.description === undefined ? profile.description : profileUpdates.description;

			if (newName != null) {
				let hasProhibitedWords = false;
				if (!await this.roleService.isModerator(proxy)) {
					hasProhibitedWords = this.utilityService.isKeyWordIncluded(newName, this.instanceMeta.prohibitedWordsForNameOfUser);
				}
				if (hasProhibitedWords) {
					throw new ApiError(meta.errors.nameContainsProhibitedWords);
				}

				const tokens = mfm.parseSimple(newName);
				emojis = emojis.concat(extractCustomEmojisFromMfm(tokens));
			}

			if (newDescription != null) {
				const tokens = mfm.parse(newDescription);
				emojis = emojis.concat(extractCustomEmojisFromMfm(tokens));
				tags = extractHashtags(tokens).map(tag => normalizeForSearch(tag)).splice(0, 32);
			}

			for (const field of profile.fields) {
				const nameTokens = mfm.parseSimple(field.name);
				const valueTokens = mfm.parseSimple(field.value);
				emojis = emojis.concat([
					...extractCustomEmojisFromMfm(nameTokens),
					...extractCustomEmojisFromMfm(valueTokens),
				]);
			}

			if (profile.followedMessage != null) {
				const tokens = mfm.parse(profile.followedMessage);
				emojis = emojis.concat(extractCustomEmojisFromMfm(tokens));
			}

			updates.emojis = emojis;
			updates.tags = tags;

			// ハッシュタグ更新
			this.hashtagService.updateUsertags(proxy, tags);
			//#endregion

			if (Object.keys(updates).length > 0) {
				await this.usersRepository.update(proxy.id, updates);
				this.globalEventService.publishInternalEvent('localUserUpdated', { id: proxy.id });
			}

			await this.userProfilesRepository.update(proxy.id, {
				...profileUpdates,
				verifiedLinks: [],
			});

			const updated = await this.userEntityService.pack(proxy.id, proxy, {
				schema: 'MeDetailed',
			});
			const updatedProfile = await this.userProfilesRepository.findOneByOrFail({ userId: proxy.id });

			this.cacheService.userProfileCache.set(proxy.id, updatedProfile);

			this.moderationLogService.log(me, 'updateUser', {
				userId: proxy.id,
				userUsername: proxy.username,
				userHost: proxy.host,
			});

			const urls = updatedProfile.fields.filter(x => x.value.startsWith('https://'));
			for (const url of urls) {
				this.verifyLink(url.value, proxy);
			}

			return updated;
		});
	}
	private async verifyLink(url: string, user: MiLocalUser) {
		if (!safeForSql(url)) return;

		try {
			const html = await this.httpRequestService.getHtml(url);

			const { window } = new JSDOM(html);
			const doc = window.document;

			const myLink = `${this.config.url}/@${user.username}`;

			const aEls = Array.from(doc.getElementsByTagName('a'));
			const linkEls = Array.from(doc.getElementsByTagName('link'));

			const includesMyLink = aEls.some(a => a.href === myLink);
			const includesRelMeLinks = [...aEls, ...linkEls].some(link => link.rel === 'me' && link.href === myLink);

			if (includesMyLink || includesRelMeLinks) {
				await this.userProfilesRepository.createQueryBuilder('profile').update()
					.where('userId = :userId', { userId: user.id })
					.set({
						verifiedLinks: () => `array_append("verifiedLinks", '${url}')`, // ここでSQLインジェクションされそうなのでとりあえず safeForSql で弾いている
					})
					.execute();
			}

			window.close();
		} catch (err) {
			// なにもしない
		}
	}
}
