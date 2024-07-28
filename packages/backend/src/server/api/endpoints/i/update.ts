/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import RE2 from 're2';
import * as mfm from 'mfm-js';
import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { JSDOM } from 'jsdom';
import { extractCustomEmojisFromMfm } from '@/misc/extract-custom-emojis-from-mfm.js';
import { extractHashtags } from '@/misc/extract-hashtags.js';
import * as Acct from '@/misc/acct.js';
import type { UsersRepository, DriveFilesRepository, UserProfilesRepository, PagesRepository } from '@/models/_.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import { birthdaySchema, descriptionSchema, locationSchema, nameSchema } from '@/models/User.js';
import type { MiUserProfile } from '@/models/UserProfile.js';
import { notificationTypes } from '@/types.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { langmap } from '@/misc/langmap.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';
import { HashtagService } from '@/core/HashtagService.js';
import { DI } from '@/di-symbols.js';
import { RolePolicies, RoleService } from '@/core/RoleService.js';
import { CacheService } from '@/core/CacheService.js';
import { RemoteUserResolveService } from '@/core/RemoteUserResolveService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import type { Config } from '@/config.js';
import { safeForSql } from '@/misc/safe-for-sql.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { notificationRecieveConfig } from '@/models/json-schema/user.js';
import { ApiLoggerService } from '../../ApiLoggerService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

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
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'MeDetailed',
	},
} as const;

const muteWords = { type: 'array', items: { oneOf: [
	{ type: 'array', items: { type: 'string' } },
	{ type: 'string' },
] } } as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { ...nameSchema, nullable: true },
		description: { ...descriptionSchema, nullable: true },
		location: { ...locationSchema, nullable: true },
		birthday: { ...birthdaySchema, nullable: true },
		lang: { type: 'string', enum: [null, ...Object.keys(langmap)] as string[], nullable: true },
		avatarId: { type: 'string', format: 'misskey:id', nullable: true },
		avatarDecorations: { type: 'array', maxItems: 16, items: {
			type: 'object',
			properties: {
				id: { type: 'string', format: 'misskey:id' },
				angle: { type: 'number', nullable: true, maximum: 0.5, minimum: -0.5 },
				flipH: { type: 'boolean', nullable: true },
				offsetX: { type: 'number', nullable: true, maximum: 0.25, minimum: -0.25 },
				offsetY: { type: 'number', nullable: true, maximum: 0.25, minimum: -0.25 },
			},
			required: ['id'],
		} },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
		fields: {
			type: 'array',
			minItems: 0,
			maxItems: 16,
			items: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					value: { type: 'string' },
				},
				required: ['name', 'value'],
			},
		},
		isLocked: { type: 'boolean' },
		isExplorable: { type: 'boolean' },
		hideOnlineStatus: { type: 'boolean' },
		publicReactions: { type: 'boolean' },
		carefulBot: { type: 'boolean' },
		autoAcceptFollowed: { type: 'boolean' },
		noCrawle: { type: 'boolean' },
		preventAiLearning: { type: 'boolean' },
		isBot: { type: 'boolean' },
		isCat: { type: 'boolean' },
		overrideCatEarColor: { type: 'boolean' },
		outerCatEarColor: { type: 'string', maxLength: 16 },
		innerCatEarColor: { type: 'string', maxLength: 16 },
		injectFeaturedNote: { type: 'boolean' },
		receiveAnnouncementEmail: { type: 'boolean' },
		alwaysMarkNsfw: { type: 'boolean' },
		autoSensitive: { type: 'boolean' },
		followingVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
		followersVisibility: { type: 'string', enum: ['public', 'followers', 'private'] },
		pinnedPageId: { type: 'string', format: 'misskey:id', nullable: true },
		mutedWords: muteWords,
		hardMutedWords: muteWords,
		mutedInstances: { type: 'array', items: {
			type: 'string',
		} },
		notificationRecieveConfig: {
			type: 'object',
			nullable: false,
			properties: {
				note: notificationRecieveConfig,
				follow: notificationRecieveConfig,
				mention: notificationRecieveConfig,
				reply: notificationRecieveConfig,
				renote: notificationRecieveConfig,
				quote: notificationRecieveConfig,
				reaction: notificationRecieveConfig,
				pollEnded: notificationRecieveConfig,
				receiveFollowRequest: notificationRecieveConfig,
				followRequestAccepted: notificationRecieveConfig,
				roleAssigned: notificationRecieveConfig,
				achievementEarned: notificationRecieveConfig,
				app: notificationRecieveConfig,
				test: notificationRecieveConfig,
			},
		},
		emailNotificationTypes: { type: 'array', items: {
			type: 'string',
		} },
		alsoKnownAs: {
			type: 'array',
			maxItems: 10,
			uniqueItems: true,
			items: { type: 'string' },
		},
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private globalEventService: GlobalEventService,
		private userFollowingService: UserFollowingService,
		private accountUpdateService: AccountUpdateService,
		private remoteUserResolveService: RemoteUserResolveService,
		private apiLoggerService: ApiLoggerService,
		private hashtagService: HashtagService,
		private roleService: RoleService,
		private cacheService: CacheService,
		private httpRequestService: HttpRequestService,
		private avatarDecorationService: AvatarDecorationService,
	) {
		super(meta, paramDef, async (ps, _user, token) => {
			const user = await this.usersRepository.findOneByOrFail({ id: _user.id }) as MiLocalUser;
			const isSecure = token == null;

			const updates = {} as Partial<MiUser>;
			const profileUpdates = {} as Partial<MiUserProfile>;

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
			let policies: RolePolicies | null = null;

			if (ps.name !== undefined) {
				if (ps.name === null) {
					updates.name = null;
				} else {
					const trimmedName = ps.name.trim();
					updates.name = trimmedName === '' ? null : trimmedName;
				}
			}
			if (ps.description !== undefined) profileUpdates.description = ps.description;
			if (ps.lang !== undefined) profileUpdates.lang = ps.lang;
			if (ps.location !== undefined) profileUpdates.location = ps.location;
			if (ps.birthday !== undefined) profileUpdates.birthday = ps.birthday;
			if (ps.followingVisibility !== undefined) profileUpdates.followingVisibility = ps.followingVisibility;
			if (ps.followersVisibility !== undefined) profileUpdates.followersVisibility = ps.followersVisibility;

			function checkMuteWordCount(mutedWords: (string[] | string)[], limit: number) {
				// TODO: ちゃんと数える
				const length = JSON.stringify(mutedWords).length;
				if (length > limit) {
					throw new ApiError(meta.errors.tooManyMutedWords);
				}
			}

			function validateMuteWordRegex(mutedWords: (string[] | string)[]) {
				for (const mutedWord of mutedWords) {
					if (typeof mutedWord !== 'string') continue;

					const regexp = mutedWord.match(/^\/(.+)\/(.*)$/);
					if (!regexp) throw new ApiError(meta.errors.invalidRegexp);

					try {
						new RE2(regexp[1], regexp[2]);
					} catch (err) {
						throw new ApiError(meta.errors.invalidRegexp);
					}
				}
			}

			if (ps.mutedWords !== undefined) {
				policies ??= await this.roleService.getUserPolicies(user.id);
				checkMuteWordCount(ps.mutedWords, policies.wordMuteLimit);
				validateMuteWordRegex(ps.mutedWords);

				profileUpdates.mutedWords = ps.mutedWords;
				profileUpdates.enableWordMute = ps.mutedWords.length > 0;
			}
			if (ps.hardMutedWords !== undefined) {
				policies ??= await this.roleService.getUserPolicies(user.id);
				checkMuteWordCount(ps.hardMutedWords, policies.wordMuteLimit);
				validateMuteWordRegex(ps.hardMutedWords);
				profileUpdates.hardMutedWords = ps.hardMutedWords;
			}
			if (ps.mutedInstances !== undefined) profileUpdates.mutedInstances = ps.mutedInstances;
			if (ps.notificationRecieveConfig !== undefined) profileUpdates.notificationRecieveConfig = ps.notificationRecieveConfig;
			if (typeof ps.isLocked === 'boolean') updates.isLocked = ps.isLocked;
			if (typeof ps.isExplorable === 'boolean') updates.isExplorable = ps.isExplorable;
			if (typeof ps.hideOnlineStatus === 'boolean') updates.hideOnlineStatus = ps.hideOnlineStatus;
			if (typeof ps.publicReactions === 'boolean') profileUpdates.publicReactions = ps.publicReactions;
			if (typeof ps.isBot === 'boolean') updates.isBot = ps.isBot;
			if (typeof ps.carefulBot === 'boolean') profileUpdates.carefulBot = ps.carefulBot;
			if (typeof ps.autoAcceptFollowed === 'boolean') profileUpdates.autoAcceptFollowed = ps.autoAcceptFollowed;
			if (typeof ps.noCrawle === 'boolean') profileUpdates.noCrawle = ps.noCrawle;
			if (typeof ps.preventAiLearning === 'boolean') profileUpdates.preventAiLearning = ps.preventAiLearning;
			if (typeof ps.isCat === 'boolean') updates.isCat = ps.isCat;
			if (typeof ps.overrideCatEarColor === 'boolean') updates.overrideCatEarColor = ps.overrideCatEarColor;
			if (typeof ps.outerCatEarColor === 'string') updates.outerCatEarColor = ps.outerCatEarColor;
			if (typeof ps.innerCatEarColor === 'string') updates.innerCatEarColor = ps.innerCatEarColor;
			if (typeof ps.injectFeaturedNote === 'boolean') profileUpdates.injectFeaturedNote = ps.injectFeaturedNote;
			if (typeof ps.receiveAnnouncementEmail === 'boolean') profileUpdates.receiveAnnouncementEmail = ps.receiveAnnouncementEmail;
			if (typeof ps.alwaysMarkNsfw === 'boolean') {
				policies ??= await this.roleService.getUserPolicies(user.id);
				if (policies.alwaysMarkNsfw) throw new ApiError(meta.errors.restrictedByRole);
				profileUpdates.alwaysMarkNsfw = ps.alwaysMarkNsfw;
			}
			if (typeof ps.autoSensitive === 'boolean') profileUpdates.autoSensitive = ps.autoSensitive;
			if (ps.emailNotificationTypes !== undefined) profileUpdates.emailNotificationTypes = ps.emailNotificationTypes;

			if (ps.avatarId) {
				policies ??= await this.roleService.getUserPolicies(user.id);
				if (!policies.canUpdateBioMedia) throw new ApiError(meta.errors.restrictedByRole);

				const avatar = await this.driveFilesRepository.findOneBy({ id: ps.avatarId });

				if (avatar == null || avatar.userId !== user.id) throw new ApiError(meta.errors.noSuchAvatar);
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
				policies ??= await this.roleService.getUserPolicies(user.id);
				if (!policies.canUpdateBioMedia) throw new ApiError(meta.errors.restrictedByRole);

				const banner = await this.driveFilesRepository.findOneBy({ id: ps.bannerId });

				if (banner == null || banner.userId !== user.id) throw new ApiError(meta.errors.noSuchBanner);
				if (!banner.type.startsWith('image/')) throw new ApiError(meta.errors.bannerNotAnImage);

				updates.bannerId = banner.id;
				updates.bannerUrl = this.driveFileEntityService.getPublicUrl(banner);
				updates.bannerBlurhash = banner.blurhash;
			} else if (ps.bannerId === null) {
				updates.bannerId = null;
				updates.bannerUrl = null;
				updates.bannerBlurhash = null;
			}

			if (ps.avatarDecorations) {
				policies ??= await this.roleService.getUserPolicies(user.id);
				const decorations = await this.avatarDecorationService.getAll(true);
				const myRoles = await this.roleService.getUserRoles(user.id);
				const allRoles = await this.roleService.getRoles();
				const decorationIds = decorations
					.filter(d => d.roleIdsThatCanBeUsedThisDecoration.filter(roleId => allRoles.some(r => r.id === roleId)).length === 0 || myRoles.some(r => d.roleIdsThatCanBeUsedThisDecoration.includes(r.id)))
					.map(d => d.id);

				if (ps.avatarDecorations.length > policies.avatarDecorationLimit) throw new ApiError(meta.errors.restrictedByRole);

				updates.avatarDecorations = ps.avatarDecorations.filter(d => decorationIds.includes(d.id)).map(d => ({
					id: d.id,
					angle: d.angle ?? 0,
					flipH: d.flipH ?? false,
					offsetX: d.offsetX ?? 0,
					offsetY: d.offsetY ?? 0,
				}));
			}

			if (ps.pinnedPageId) {
				const page = await this.pagesRepository.findOneBy({ id: ps.pinnedPageId });

				if (page == null || page.userId !== user.id) throw new ApiError(meta.errors.noSuchPage);

				profileUpdates.pinnedPageId = page.id;
			} else if (ps.pinnedPageId === null) {
				profileUpdates.pinnedPageId = null;
			}

			if (ps.fields) {
				profileUpdates.fields = ps.fields
					.filter(x => typeof x.name === 'string' && x.name.trim() !== '' && typeof x.value === 'string' && x.value.trim() !== '')
					.map(x => {
						return { name: x.name.trim(), value: x.value.trim() };
					});
			}

			if (ps.alsoKnownAs) {
				if (_user.movedToUri) {
					throw new ApiError({
						message: 'You have moved your account.',
						code: 'YOUR_ACCOUNT_MOVED',
						id: '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31',
						httpStatusCode: 403,
					});
				}

				// Parse user's input into the old account
				const newAlsoKnownAs = new Set<string>();
				for (const line of ps.alsoKnownAs) {
					if (!line) throw new ApiError(meta.errors.noSuchUser);
					const { username, host } = Acct.parse(line);

					// Retrieve the old account
					const knownAs = await this.remoteUserResolveService.resolveUser(username, host).catch((e) => {
						this.apiLoggerService.logger.warn(`failed to resolve dstination user: ${e}`);
						throw new ApiError(meta.errors.noSuchUser);
					});
					if (knownAs.id === _user.id) throw new ApiError(meta.errors.forbiddenToSetYourself);

					const toUrl = this.userEntityService.getUserUri(knownAs);
					if (!toUrl) throw new ApiError(meta.errors.uriNull);

					newAlsoKnownAs.add(toUrl);
				}

				updates.alsoKnownAs = newAlsoKnownAs.size > 0 ? Array.from(newAlsoKnownAs) : null;
			}

			//#region emojis/tags

			let emojis = [] as string[];
			let tags = [] as string[];

			const newName = updates.name === undefined ? user.name : updates.name;
			const newDescription = profileUpdates.description === undefined ? profile.description : profileUpdates.description;
			const newFields = profileUpdates.fields === undefined ? profile.fields : profileUpdates.fields;

			if (newName != null) {
				const tokens = mfm.parseSimple(newName);
				emojis = emojis.concat(extractCustomEmojisFromMfm(tokens));
			}

			if (newDescription != null) {
				const tokens = mfm.parse(newDescription);
				emojis = emojis.concat(extractCustomEmojisFromMfm(tokens));
				tags = extractHashtags(tokens).map(tag => normalizeForSearch(tag)).splice(0, 32);
			}

			for (const field of newFields) {
				const nameTokens = mfm.parseSimple(field.name);
				const valueTokens = mfm.parseSimple(field.value);
				emojis = emojis.concat([
					...extractCustomEmojisFromMfm(nameTokens),
					...extractCustomEmojisFromMfm(valueTokens),
				]);
			}

			updates.emojis = emojis;
			updates.tags = tags;

			// ハッシュタグ更新
			this.hashtagService.updateUsertags(user, tags);
			//#endregion

			if (Object.keys(updates).length > 0) {
				await this.usersRepository.update(user.id, updates);
				this.globalEventService.publishInternalEvent('localUserUpdated', { id: user.id });
			}

			await this.userProfilesRepository.update(user.id, {
				...profileUpdates,
				verifiedLinks: [],
			});

			const iObj = await this.userEntityService.pack(user.id, user, {
				schema: 'MeDetailed',
				includeSecrets: isSecure,
			});

			const updatedProfile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

			this.cacheService.userProfileCache.set(user.id, updatedProfile);

			// Publish meUpdated event
			this.globalEventService.publishMainStream(user.id, 'meUpdated', iObj);

			// 鍵垢を解除したとき、溜まっていたフォローリクエストがあるならすべて承認
			if (user.isLocked && ps.isLocked === false) {
				this.userFollowingService.acceptAllFollowRequests(user);
			}

			// フォロワーにUpdateを配信
			this.accountUpdateService.publishToFollowers(user.id);

			const urls = updatedProfile.fields.filter(x => x.value.startsWith('https://'));
			for (const url of urls) {
				this.verifyLink(url.value, user);
			}

			return iObj;
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
