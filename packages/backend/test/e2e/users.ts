/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { inspect } from 'node:util';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
import { api, post, role, signup, successfulApiCall, uploadFile } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('ユーザー', () => {
	// エンティティとしてのユーザーを主眼においたテストを記述する
	// (Userを返すエンドポイントとUserエンティティを書き換えるエンドポイントをテストする)

	const stripUndefined = <T extends { [key: string]: any }, >(orig: T): Partial<T> => {
		return Object.entries({ ...orig })
			.filter(([, value]) => value !== undefined)
			.reduce((obj: Partial<T>, [key, value]) => {
				obj[key as keyof T] = value;
				return obj;
			}, {});
	};

	const show = async (id: string, me = root): Promise<misskey.entities.UserDetailed> => {
		return successfulApiCall({ endpoint: 'users/show', parameters: { userId: id }, user: me });
	};

	// UserLiteのキーが過不足なく入っている？
	const userLite = (user: misskey.entities.UserLite): Partial<misskey.entities.UserLite> => {
		return stripUndefined({
			id: user.id,
			name: user.name,
			username: user.username,
			host: user.host,
			avatarUrl: user.avatarUrl,
			avatarBlurhash: user.avatarBlurhash,
			avatarDecorations: user.avatarDecorations,
			isBot: user.isBot,
			isCat: user.isCat,
			overrideCatEarColor: user.overrideCatEarColor,
			outerCatEarColor: user.outerCatEarColor,
			innerCatEarColor: user.innerCatEarColor,
			instance: user.instance,
			emojis: user.emojis,
			onlineStatus: user.onlineStatus,
			badgeRoles: user.badgeRoles,

			// BUG isAdmin/isModeratorはUserLiteではなくMeDetailedOnlyに含まれる。
			isAdmin: undefined,
			isModerator: undefined,
		});
	};

	// UserDetailedNotMeのキーが過不足なく入っている？
	const userDetailedNotMe = (user: misskey.entities.SignupResponse): Partial<misskey.entities.UserDetailedNotMe> => {
		return stripUndefined({
			...userLite(user),
			url: user.url,
			uri: user.uri,
			movedTo: user.movedTo,
			alsoKnownAs: user.alsoKnownAs,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			lastFetchedAt: user.lastFetchedAt,
			bannerUrl: user.bannerUrl,
			bannerBlurhash: user.bannerBlurhash,
			isLocked: user.isLocked,
			isSilenced: user.isSilenced,
			isSuspended: user.isSuspended,
			description: user.description,
			location: user.location,
			birthday: user.birthday,
			lang: user.lang,
			fields: user.fields,
			verifiedLinks: user.verifiedLinks,
			followersCount: user.followersCount,
			followingCount: user.followingCount,
			notesCount: user.notesCount,
			pinnedNoteIds: user.pinnedNoteIds,
			pinnedNotes: user.pinnedNotes,
			pinnedPageId: user.pinnedPageId,
			pinnedPage: user.pinnedPage,
			publicReactions: user.publicReactions,
			followingVisibility: user.followingVisibility,
			followersVisibility: user.followersVisibility,
			twoFactorEnabled: user.twoFactorEnabled,
			usePasswordLessLogin: user.usePasswordLessLogin,
			securityKeys: user.securityKeys,
			roles: user.roles,
			memo: user.memo,
		});
	};

	// Relations関連のキーが過不足なく入っている？
	const userDetailedNotMeWithRelations = (user: misskey.entities.SignupResponse): Partial<misskey.entities.UserDetailedNotMe> => {
		return stripUndefined({
			...userDetailedNotMe(user),
			isFollowing: user.isFollowing ?? false,
			isFollowed: user.isFollowed ?? false,
			hasPendingFollowRequestFromYou: user.hasPendingFollowRequestFromYou ?? false,
			hasPendingFollowRequestToYou: user.hasPendingFollowRequestToYou ?? false,
			isBlocking: user.isBlocking ?? false,
			isBlocked: user.isBlocked ?? false,
			isMuted: user.isMuted ?? false,
			isRenoteMuted: user.isRenoteMuted ?? false,
			notify: user.notify ?? 'none',
			withReplies: user.withReplies ?? false,
		});
	};

	// MeDetailedのキーが過不足なく入っている？
	const meDetailed = (user: misskey.entities.SignupResponse, security = false): Partial<misskey.entities.MeDetailed> => {
		return stripUndefined({
			...userDetailedNotMe(user),
			avatarId: user.avatarId,
			bannerId: user.bannerId,
			isModerator: user.isModerator,
			isAdmin: user.isAdmin,
			injectFeaturedNote: user.injectFeaturedNote,
			receiveAnnouncementEmail: user.receiveAnnouncementEmail,
			alwaysMarkNsfw: user.alwaysMarkNsfw,
			autoSensitive: user.autoSensitive,
			carefulBot: user.carefulBot,
			autoAcceptFollowed: user.autoAcceptFollowed,
			noCrawle: user.noCrawle,
			preventAiLearning: user.preventAiLearning,
			isExplorable: user.isExplorable,
			isDeleted: user.isDeleted,
			twoFactorBackupCodesStock: user.twoFactorBackupCodesStock,
			hideOnlineStatus: user.hideOnlineStatus,
			hasUnreadSpecifiedNotes: user.hasUnreadSpecifiedNotes,
			hasUnreadMentions: user.hasUnreadMentions,
			hasUnreadAnnouncement: user.hasUnreadAnnouncement,
			hasUnreadAntenna: user.hasUnreadAntenna,
			hasUnreadChannel: user.hasUnreadChannel,
			hasUnreadNotification: user.hasUnreadNotification,
			unreadNotificationsCount: user.unreadNotificationsCount,
			hasPendingReceivedFollowRequest: user.hasPendingReceivedFollowRequest,
			unreadAnnouncements: user.unreadAnnouncements,
			mutedWords: user.mutedWords,
			hardMutedWords: user.hardMutedWords,
			mutedInstances: user.mutedInstances,
			// @ts-expect-error 後方互換性
			mutingNotificationTypes: user.mutingNotificationTypes,
			notificationRecieveConfig: user.notificationRecieveConfig,
			emailNotificationTypes: user.emailNotificationTypes,
			achievements: user.achievements,
			loggedInDays: user.loggedInDays,
			policies: user.policies,
			...(security ? {
				email: user.email,
				emailVerified: user.emailVerified,
				securityKeysList: user.securityKeysList,
			} : {}),
		});
	};

	let root: misskey.entities.SignupResponse;
	let alice: misskey.entities.SignupResponse;
	let aliceNote: misskey.entities.Note;

	let bob: misskey.entities.SignupResponse;

	// NOTE: これがないと落ちる（bob の updatedAt が null になってしまうため？）
	let bobNote: misskey.entities.Note; // eslint-disable-line @typescript-eslint/no-unused-vars

	let carol: misskey.entities.SignupResponse;

	let usersReplying: misskey.entities.SignupResponse[];

	let userNoNote: misskey.entities.SignupResponse;
	let userNotExplorable: misskey.entities.SignupResponse;
	let userLocking: misskey.entities.SignupResponse;
	let userAdmin: misskey.entities.SignupResponse;
	let roleAdmin: misskey.entities.Role;
	let userModerator: misskey.entities.SignupResponse;
	let roleModerator: misskey.entities.Role;
	let userRolePublic: misskey.entities.SignupResponse;
	let rolePublic: misskey.entities.Role;
	let userRoleBadge: misskey.entities.SignupResponse;
	let roleBadge: misskey.entities.Role;
	let userSilenced: misskey.entities.SignupResponse;
	let roleSilenced: misskey.entities.Role;
	let userSuspended: misskey.entities.SignupResponse;
	let userDeletedBySelf: misskey.entities.SignupResponse;
	let userDeletedByAdmin: misskey.entities.SignupResponse;
	let userFollowingAlice: misskey.entities.SignupResponse;
	let userFollowedByAlice: misskey.entities.SignupResponse;
	let userBlockingAlice: misskey.entities.SignupResponse;
	let userBlockedByAlice: misskey.entities.SignupResponse;
	let userMutingAlice: misskey.entities.SignupResponse;
	let userMutedByAlice: misskey.entities.SignupResponse;
	let userRnMutingAlice: misskey.entities.SignupResponse;
	let userRnMutedByAlice: misskey.entities.SignupResponse;
	let userFollowRequesting: misskey.entities.SignupResponse;
	let userFollowRequested: misskey.entities.SignupResponse;

	beforeAll(async () => {
		root = await signup({ username: 'root' });
		alice = await signup({ username: 'alice' });
		aliceNote = await post(alice, { text: 'test' });
		bob = await signup({ username: 'bob' });
		bobNote = await post(bob, { text: 'test' });
		carol = await signup({ username: 'carol' });

		// @alice -> @replyingへのリプライ。Promise.allで一気に作るとtimeoutしてしまうのでreduceで一つ一つawaitする
		usersReplying = await [...Array(10)].map((_, i) => i).reduce(async (acc, i) => {
			const u = await signup({ username: `replying${i}` });
			for (let j = 0; j < 10 - i; j++) {
				const p = await post(u, { text: `test${j}` });
				await post(alice, { text: `@${u.username} test${j}`, replyId: p.id });
			}

			return (await acc).concat(u);
		}, Promise.resolve([] as misskey.entities.SignupResponse[]));

		userNoNote = await signup({ username: 'userNoNote' });
		userNotExplorable = await signup({ username: 'userNotExplorable' });
		await post(userNotExplorable, { text: 'test' });
		await api('i/update', { isExplorable: false }, userNotExplorable);
		userLocking = await signup({ username: 'userLocking' });
		await post(userLocking, { text: 'test' });
		await api('i/update', { isLocked: true }, userLocking);
		userAdmin = await signup({ username: 'userAdmin' });
		roleAdmin = await role(root, { isAdministrator: true, name: 'Admin Role' });
		await api('admin/roles/assign', { userId: userAdmin.id, roleId: roleAdmin.id }, root);
		userModerator = await signup({ username: 'userModerator' });
		roleModerator = await role(root, { isModerator: true, name: 'Moderator Role' });
		await api('admin/roles/assign', { userId: userModerator.id, roleId: roleModerator.id }, root);
		userRolePublic = await signup({ username: 'userRolePublic' });
		rolePublic = await role(root, { isPublic: true, name: 'Public Role' });
		await api('admin/roles/assign', { userId: userRolePublic.id, roleId: rolePublic.id }, root);
		userRoleBadge = await signup({ username: 'userRoleBadge' });
		roleBadge = await role(root, { asBadge: true, name: 'Badge Role', isPublic: true });
		await api('admin/roles/assign', { userId: userRoleBadge.id, roleId: roleBadge.id }, root);
		userSilenced = await signup({ username: 'userSilenced' });
		await post(userSilenced, { text: 'test' });
		roleSilenced = await role(root, {}, { canPublicNote: { priority: 0, useDefault: false, value: false } });
		await api('admin/roles/assign', { userId: userSilenced.id, roleId: roleSilenced.id }, root);
		userSuspended = await signup({ username: 'userSuspended' });
		await post(userSuspended, { text: 'test' });
		await successfulApiCall({ endpoint: 'i/update', parameters: { description: '#user_testuserSuspended' }, user: userSuspended });
		await api('admin/suspend-user', { userId: userSuspended.id }, root);
		userDeletedBySelf = await signup({ username: 'userDeletedBySelf', password: 'userDeletedBySelf' });
		await post(userDeletedBySelf, { text: 'test' });
		await api('i/delete-account', { password: 'userDeletedBySelf' }, userDeletedBySelf);
		userDeletedByAdmin = await signup({ username: 'userDeletedByAdmin' });
		await post(userDeletedByAdmin, { text: 'test' });
		await api('admin/delete-account', { userId: userDeletedByAdmin.id }, root);
		userFollowingAlice = await signup({ username: 'userFollowingAlice' });
		await post(userFollowingAlice, { text: 'test' });
		await api('following/create', { userId: alice.id }, userFollowingAlice);
		userFollowedByAlice = await signup({ username: 'userFollowedByAlice' });
		await post(userFollowedByAlice, { text: 'test' });
		await api('following/create', { userId: userFollowedByAlice.id }, alice);
		userBlockingAlice = await signup({ username: 'userBlockingAlice' });
		await post(userBlockingAlice, { text: 'test' });
		await api('blocking/create', { userId: alice.id }, userBlockingAlice);
		userBlockedByAlice = await signup({ username: 'userBlockedByAlice' });
		await post(userBlockedByAlice, { text: 'test' });
		await api('blocking/create', { userId: userBlockedByAlice.id }, alice);
		userMutingAlice = await signup({ username: 'userMutingAlice' });
		await post(userMutingAlice, { text: 'test' });
		await api('mute/create', { userId: alice.id }, userMutingAlice);
		userMutedByAlice = await signup({ username: 'userMutedByAlice' });
		await post(userMutedByAlice, { text: 'test' });
		await api('mute/create', { userId: userMutedByAlice.id }, alice);
		userRnMutingAlice = await signup({ username: 'userRnMutingAlice' });
		await post(userRnMutingAlice, { text: 'test' });
		await api('renote-mute/create', { userId: alice.id }, userRnMutingAlice);
		userRnMutedByAlice = await signup({ username: 'userRnMutedByAlice' });
		await post(userRnMutedByAlice, { text: 'test' });
		await api('renote-mute/create', { userId: userRnMutedByAlice.id }, alice);
		userFollowRequesting = await signup({ username: 'userFollowRequesting' });
		await post(userFollowRequesting, { text: 'test' });
		userFollowRequested = userLocking;
		await api('following/create', { userId: userFollowRequested.id }, userFollowRequesting);
	}, 1000 * 60 * 10);

	beforeEach(async () => {
		alice = {
			...alice,
			...await successfulApiCall({ endpoint: 'i', parameters: {}, user: alice }),
		};
		aliceNote = await successfulApiCall({ endpoint: 'notes/show', parameters: { noteId: aliceNote.id }, user: alice });
	});

	//#region サインアップ(signup)

	test('が作れる。（作りたての状態で自分のユーザー情報が取れる）', async () => {
		// SignupApiService.ts
		const response = await successfulApiCall({
			endpoint: 'signup',
			parameters: { username: 'zoe', password: 'password' },
			user: undefined,
		}) as unknown as misskey.entities.SignupResponse; // BUG MeDetailedに足りないキーがある

		// signupの時はtokenが含まれる特別なMeDetailedが返ってくる
		assert.match(response.token, /[a-zA-Z0-9]{16}/);

		// UserLite
		assert.match(response.id, /[0-9a-z]{10}/);
		assert.strictEqual(response.name, null);
		assert.strictEqual(response.username, 'zoe');
		assert.strictEqual(response.host, null);
		response.avatarUrl && assert.match(response.avatarUrl, /^[-a-zA-Z0-9@:%._\+~#&?=\/]+$/);
		assert.strictEqual(response.avatarBlurhash, null);
		assert.deepStrictEqual(response.avatarDecorations, []);
		assert.strictEqual(response.isBot, false);
		assert.strictEqual(response.isCat, false);
		assert.strictEqual(response.overrideCatEarColor, false);
		response.outerCatEarColor && assert.match(response.outerCatEarColor, /^#[0-9a-f]{6}$/);
		response.innerCatEarColor && assert.match(response.innerCatEarColor, /^#[0-9a-f]{6}$/);
		assert.strictEqual(response.instance, undefined);
		assert.deepStrictEqual(response.emojis, {});
		assert.strictEqual(response.onlineStatus, 'unknown');
		assert.deepStrictEqual(response.badgeRoles, []);
		// UserDetailedNotMeOnly
		assert.strictEqual(response.url, null);
		assert.strictEqual(response.uri, null);
		assert.strictEqual(response.movedTo, null);
		assert.strictEqual(response.alsoKnownAs, null);
		assert.strictEqual(response.createdAt, new Date(response.createdAt).toISOString());
		assert.strictEqual(response.updatedAt, null);
		assert.strictEqual(response.lastFetchedAt, null);
		assert.strictEqual(response.bannerUrl, null);
		assert.strictEqual(response.bannerBlurhash, null);
		assert.strictEqual(response.isLocked, false);
		assert.strictEqual(response.isSilenced, false);
		assert.strictEqual(response.isSuspended, false);
		assert.strictEqual(response.description, null);
		assert.strictEqual(response.location, null);
		assert.strictEqual(response.birthday, null);
		assert.strictEqual(response.lang, null);
		assert.deepStrictEqual(response.fields, []);
		assert.deepStrictEqual(response.verifiedLinks, []);
		assert.strictEqual(response.followersCount, 0);
		assert.strictEqual(response.followingCount, 0);
		assert.strictEqual(response.notesCount, 0);
		assert.deepStrictEqual(response.pinnedNoteIds, []);
		assert.deepStrictEqual(response.pinnedNotes, []);
		assert.strictEqual(response.pinnedPageId, null);
		assert.strictEqual(response.pinnedPage, null);
		assert.strictEqual(response.publicReactions, true);
		assert.strictEqual(response.followingVisibility, 'public');
		assert.strictEqual(response.followersVisibility, 'public');
		assert.strictEqual(response.twoFactorEnabled, false);
		assert.strictEqual(response.usePasswordLessLogin, false);
		assert.strictEqual(response.securityKeys, false);
		assert.deepStrictEqual(response.roles, []);
		assert.strictEqual(response.memo, null);

		// MeDetailedOnly
		assert.strictEqual(response.avatarId, null);
		assert.strictEqual(response.bannerId, null);
		assert.strictEqual(response.isModerator, false);
		assert.strictEqual(response.isAdmin, false);
		assert.strictEqual(response.injectFeaturedNote, true);
		assert.strictEqual(response.receiveAnnouncementEmail, true);
		assert.strictEqual(response.alwaysMarkNsfw, false);
		assert.strictEqual(response.autoSensitive, false);
		assert.strictEqual(response.carefulBot, false);
		assert.strictEqual(response.autoAcceptFollowed, true);
		assert.strictEqual(response.noCrawle, false);
		assert.strictEqual(response.preventAiLearning, true);
		assert.strictEqual(response.isExplorable, true);
		assert.strictEqual(response.isDeleted, false);
		assert.strictEqual(response.twoFactorBackupCodesStock, 'none');
		assert.strictEqual(response.hideOnlineStatus, false);
		assert.strictEqual(response.hasUnreadSpecifiedNotes, false);
		assert.strictEqual(response.hasUnreadMentions, false);
		assert.strictEqual(response.hasUnreadAnnouncement, false);
		assert.strictEqual(response.hasUnreadAntenna, false);
		assert.strictEqual(response.hasUnreadChannel, false);
		assert.strictEqual(response.hasUnreadNotification, false);
		assert.strictEqual(response.unreadNotificationsCount, 0);
		assert.strictEqual(response.hasPendingReceivedFollowRequest, false);
		assert.deepStrictEqual(response.unreadAnnouncements, []);
		assert.deepStrictEqual(response.mutedWords, []);
		assert.deepStrictEqual(response.mutedInstances, []);
		// @ts-expect-error 後方互換のため
		assert.deepStrictEqual(response.mutingNotificationTypes, []);
		assert.deepStrictEqual(response.notificationRecieveConfig, {});
		assert.deepStrictEqual(response.emailNotificationTypes, ['follow', 'receiveFollowRequest']);
		assert.deepStrictEqual(response.achievements, []);
		assert.deepStrictEqual(response.loggedInDays, 0);
		assert.deepStrictEqual(response.policies, DEFAULT_POLICIES);
		assert.notStrictEqual(response.email, undefined);
		assert.strictEqual(response.emailVerified, false);
		assert.deepStrictEqual(response.securityKeysList, []);
	});

	//#endregion
	//#region 自分の情報(i)

	test('を読み取ることができること（自分）、キーが過不足なく入っていること。', async () => {
		const response = await successfulApiCall({
			endpoint: 'i',
			parameters: {},
			user: userNoNote,
		});
		const expected = meDetailed(userNoNote, true);
		expected.loggedInDays = 1; // iはloggedInDaysを更新する
		assert.deepStrictEqual(response, expected);
	});

	//#endregion
	//#region 自分の情報の更新(i/update)

	test.each([
		{ parameters: () => ({ name: null }) },
		{ parameters: () => ({ name: 'x'.repeat(50) }) },
		{ parameters: () => ({ name: 'x' }) },
		{ parameters: () => ({ name: 'My name' }) },
		{ parameters: () => ({ description: null }) },
		{ parameters: () => ({ description: 'x'.repeat(1500) }) },
		{ parameters: () => ({ description: 'x' }) },
		{ parameters: () => ({ description: 'My description' }) },
		{ parameters: () => ({ location: null }) },
		{ parameters: () => ({ location: 'x'.repeat(50) }) },
		{ parameters: () => ({ location: 'x' }) },
		{ parameters: () => ({ location: 'My location' }) },
		{ parameters: () => ({ birthday: '0000-00-00' }) },
		{ parameters: () => ({ birthday: '9999-99-99' }) },
		{ parameters: () => ({ lang: 'en-US' as const }) },
		{ parameters: () => ({ fields: [] }) },
		{ parameters: () => ({ fields: [{ name: 'x', value: 'x' }] }) },
		{ parameters: () => ({ fields: [{ name: 'x'.repeat(3000), value: 'x'.repeat(3000) }] }) }, // BUG? fieldには制限がない
		{ parameters: () => ({ fields: Array(16).fill({ name: 'x', value: 'y' }) }) },
		{ parameters: () => ({ isLocked: true }) },
		{ parameters: () => ({ isLocked: false }) },
		{ parameters: () => ({ isExplorable: false }) },
		{ parameters: () => ({ isExplorable: true }) },
		{ parameters: () => ({ hideOnlineStatus: true }) },
		{ parameters: () => ({ hideOnlineStatus: false }) },
		{ parameters: () => ({ publicReactions: false }) },
		{ parameters: () => ({ publicReactions: true }) },
		{ parameters: () => ({ autoAcceptFollowed: true }) },
		{ parameters: () => ({ autoAcceptFollowed: false }) },
		{ parameters: () => ({ noCrawle: true }) },
		{ parameters: () => ({ noCrawle: false }) },
		{ parameters: () => ({ preventAiLearning: false }) },
		{ parameters: () => ({ preventAiLearning: true }) },
		{ parameters: () => ({ isBot: true }) },
		{ parameters: () => ({ isBot: false }) },
		{ parameters: () => ({ isCat: true }) },
		{ parameters: () => ({ isCat: false }) },
		{ parameters: () => ({ overrideCatEarColor: true }) },
		{ parameters: () => ({ overrideCatEarColor: false }) },
		{ parameters: () => ({ outerCatEarColor: "#000000" }) },
		{ parameters: () => ({ innerCatEarColor: "#000000" }) },
		{ parameters: () => ({ injectFeaturedNote: true }) },
		{ parameters: () => ({ injectFeaturedNote: false }) },
		{ parameters: () => ({ receiveAnnouncementEmail: true }) },
		{ parameters: () => ({ receiveAnnouncementEmail: false }) },
		{ parameters: () => ({ alwaysMarkNsfw: true }) },
		{ parameters: () => ({ alwaysMarkNsfw: false }) },
		{ parameters: () => ({ autoSensitive: true }) },
		{ parameters: () => ({ autoSensitive: false }) },
		{ parameters: () => ({ followingVisibility: 'private' as const }) },
		{ parameters: () => ({ followingVisibility: 'followers' as const }) },
		{ parameters: () => ({ followingVisibility: 'public' as const }) },
		{ parameters: () => ({ followersVisibility: 'private' as const }) },
		{ parameters: () => ({ followersVisibility: 'followers' as const }) },
		{ parameters: () => ({ followersVisibility: 'public' as const }) },
		{ parameters: () => ({ mutedWords: Array(19).fill(['xxxxx']) }) },
		{ parameters: () => ({ mutedWords: [['x'.repeat(194)]] }) },
		{ parameters: () => ({ mutedWords: [] }) },
		{ parameters: () => ({ mutedInstances: ['xxxx.xxxxx'] }) },
		{ parameters: () => ({ mutedInstances: [] }) },
		{ parameters: () => ({ notificationRecieveConfig: { mention: { type: 'following' } } }) },
		{ parameters: () => ({ notificationRecieveConfig: {} }) },
		{ parameters: () => ({ emailNotificationTypes: ['mention', 'reply', 'quote', 'follow', 'receiveFollowRequest'] }) },
		{ parameters: () => ({ emailNotificationTypes: [] }) },
	] as const)('を書き換えることができる($#)', async ({ parameters }) => {
		const response = await successfulApiCall({ endpoint: 'i/update', parameters: parameters(), user: alice });
		const expected = { ...meDetailed(alice, true), ...parameters() };
		assert.deepStrictEqual(response, expected, inspect(parameters()));
	});

	test('を書き換えることができる(Avatar)', async () => {
		const aliceFile = (await uploadFile(alice)).body;
		const parameters = { avatarId: aliceFile!.id };
		const response = await successfulApiCall({ endpoint: 'i/update', parameters: parameters, user: alice });
		assert.match(response.avatarUrl ?? '.', /^[-a-zA-Z0-9@:%._\+~#&?=\/]+$/);
		assert.match(response.avatarBlurhash ?? '.', /[ -~]{54}/);
		const expected = {
			...meDetailed(alice, true),
			avatarId: aliceFile!.id,
			avatarBlurhash: response.avatarBlurhash,
			avatarUrl: response.avatarUrl,
		};
		assert.deepStrictEqual(response, expected, inspect(parameters));

		const parameters2 = { avatarId: null };
		const response2 = await successfulApiCall({ endpoint: 'i/update', parameters: parameters2, user: alice });
		const expected2 = {
			...meDetailed(alice, true),
			avatarId: null,
			avatarBlurhash: null,
			avatarUrl: alice.avatarUrl, // 解除した場合、identiconになる
		};
		assert.deepStrictEqual(response2, expected2, inspect(parameters));
	});

	test('を書き換えることができる(Banner)', async () => {
		const aliceFile = (await uploadFile(alice)).body;
		const parameters = { bannerId: aliceFile!.id };
		const response = await successfulApiCall({ endpoint: 'i/update', parameters: parameters, user: alice });
		assert.match(response.bannerUrl ?? '.', /^[-a-zA-Z0-9@:%._\+~#&?=\/]+$/);
		assert.match(response.bannerBlurhash ?? '.', /[ -~]{54}/);
		const expected = {
			...meDetailed(alice, true),
			bannerId: aliceFile!.id,
			bannerBlurhash: response.bannerBlurhash,
			bannerUrl: response.bannerUrl,
		};
		assert.deepStrictEqual(response, expected, inspect(parameters));

		const parameters2 = { bannerId: null };
		const response2 = await successfulApiCall({ endpoint: 'i/update', parameters: parameters2, user: alice });
		const expected2 = {
			...meDetailed(alice, true),
			bannerId: null,
			bannerBlurhash: null,
			bannerUrl: null,
		};
		assert.deepStrictEqual(response2, expected2, inspect(parameters));
	});

	//#endregion
	//#region 自分の情報の更新(i/pin, i/unpin)

	test('を書き換えることができる(ピン止めノート)', async () => {
		const parameters = { noteId: aliceNote.id };
		const response = await successfulApiCall({ endpoint: 'i/pin', parameters, user: alice });
		const expected = { ...meDetailed(alice, false), pinnedNoteIds: [aliceNote.id], pinnedNotes: [aliceNote] };
		assert.deepStrictEqual(response, expected);

		const response2 = await successfulApiCall({ endpoint: 'i/unpin', parameters, user: alice });
		const expected2 = meDetailed(alice, false);
		assert.deepStrictEqual(response2, expected2);
	});

	//#endregion
	//#region メモの更新(users/update-memo)

	test.each([
		{ label: '最大長', memo: 'x'.repeat(2048) },
		{ label: '空文字', memo: '', expects: null },
		{ label: 'null', memo: null },
	])('を書き換えることができる(メモを$labelに)', async ({ memo, expects }) => {
		const expected = { ...await show(bob.id, alice), memo: expects === undefined ? memo : expects };
		const parameters = { userId: bob.id, memo };
		await successfulApiCall({ endpoint: 'users/update-memo', parameters, user: alice });
		const response = await show(bob.id, alice);
		assert.deepStrictEqual(response, expected);
	});

	//#endregion
	//#region ユーザー(users)

	test.each([
		{ label: 'ID昇順', parameters: { limit: 5 }, selector: (u: misskey.entities.UserLite): string => u.id },
		{ label: 'フォロワー昇順', parameters: { sort: '+follower' }, selector: (u: misskey.entities.UserDetailedNotMe): string => String(u.followersCount) },
		{ label: 'フォロワー降順', parameters: { sort: '-follower' }, selector: (u: misskey.entities.UserDetailedNotMe): string => String(u.followersCount) },
		{ label: '登録日時昇順', parameters: { sort: '+createdAt' }, selector: (u: misskey.entities.UserDetailedNotMe): string => u.createdAt },
		{ label: '登録日時降順', parameters: { sort: '-createdAt' }, selector: (u: misskey.entities.UserDetailedNotMe): string => u.createdAt },
		{ label: '投稿日時昇順', parameters: { sort: '+updatedAt' }, selector: (u: misskey.entities.UserDetailedNotMe): string => String(u.updatedAt) },
		{ label: '投稿日時降順', parameters: { sort: '-updatedAt' }, selector: (u: misskey.entities.UserDetailedNotMe): string => String(u.updatedAt) },
	] as const)('をリスト形式で取得することができる（$label）', async ({ parameters, selector }) => {
		const response = await successfulApiCall({ endpoint: 'users', parameters, user: alice });

		// 結果の並びを事前にアサートするのは困難なので返ってきたidに対応するユーザーが返っており、ソート順が正しいことだけを検証する
		const users = await Promise.all(response.map(u => show(u.id, alice)));
		const expected = users.sort((x, y) => {
			const index = (selector(x) < selector(y)) ? -1 : (selector(x) > selector(y)) ? 1 : 0;
			return index * (parameters.sort?.startsWith('+') ? -1 : 1);
		});
		assert.deepStrictEqual(response, expected);
	});
	test.each([
		{ label: '「見つけやすくする」がOFFのユーザーが含まれない', user: () => userNotExplorable, excluded: true },
		{ label: 'ミュートユーザーが含まれない', user: () => userMutedByAlice, excluded: true },
		{ label: 'ブロックされているユーザーが含まれない', user: () => userBlockedByAlice, excluded: true },
		{ label: 'ブロックしてきているユーザーが含まれる', user: () => userBlockingAlice, excluded: true },
		{ label: '承認制ユーザーが含まれる', user: () => userLocking },
		{ label: 'サイレンスユーザーが含まれる', user: () => userSilenced },
		{ label: 'サスペンドユーザーが含まれない', user: () => userSuspended, excluded: true },
		{ label: '削除済ユーザーが含まれる', user: () => userDeletedBySelf },
		{ label: '削除済(byAdmin)ユーザーが含まれる', user: () => userDeletedByAdmin },
	] as const)('をリスト形式で取得することができ、結果に$label', async ({ user, excluded }) => {
		const parameters = { limit: 100 };
		const response = await successfulApiCall({ endpoint: 'users', parameters, user: alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
		assert.deepStrictEqual(response.filter((u) => u.id === user().id), expected);
	});
	test.todo('をリスト形式で取得することができる（リモート, hostname指定）');
	test.todo('をリスト形式で取得することができる（pagenation）');

	//#endregion
	//#region ユーザー情報(users/show)

	test.each([
		{ label: 'ID指定で自分自身を', parameters: () => ({ userId: alice.id }), user: () => alice, type: meDetailed },
		{ label: 'ID指定で他人を', parameters: () => ({ userId: alice.id }), user: () => bob, type: userDetailedNotMeWithRelations },
		{ label: 'ID指定かつ未認証', parameters: () => ({ userId: alice.id }), user: undefined, type: userDetailedNotMe },
		{ label: '@指定で自分自身を', parameters: () => ({ username: alice.username }), user: () => alice, type: meDetailed },
		{ label: '@指定で他人を', parameters: () => ({ username: alice.username }), user: () => bob, type: userDetailedNotMeWithRelations },
		{ label: '@指定かつ未認証', parameters: () => ({ username: alice.username }), user: undefined, type: userDetailedNotMe },
	] as const)('を取得することができる（$label）', async ({ parameters, user, type }) => {
		const response = await successfulApiCall({ endpoint: 'users/show', parameters: parameters(), user: user?.() });
		const expected = type(alice);
		assert.deepStrictEqual(response, expected);
	});
	test.each([
		{ label: 'Administratorになっている', user: () => userAdmin, me: () => userAdmin, selector: (user: misskey.entities.MeDetailed) => user.isAdmin },
		// @ts-expect-error UserDetailedNotMe doesn't include isAdmin
		{ label: '自分以外から見たときはAdministratorか判定できない', user: () => userAdmin, selector: (user: misskey.entities.UserDetailedNotMe) => user.isAdmin, expected: () => undefined },
		{ label: 'Moderatorになっている', user: () => userModerator, me: () => userModerator, selector: (user: misskey.entities.MeDetailed) => user.isModerator },
		// @ts-expect-error UserDetailedNotMe doesn't include isModerator
		{ label: '自分以外から見たときはModeratorか判定できない', user: () => userModerator, selector: (user: misskey.entities.UserDetailedNotMe) => user.isModerator, expected: () => undefined },
		{ label: 'サイレンスになっている', user: () => userSilenced, selector: (user: misskey.entities.UserDetailed) => user.isSilenced },
		// FIXME: 落ちる
		//{ label: 'サスペンドになっている', user: () => userSuspended, selector: (user: misskey.entities.UserDetailed) => user.isSuspended },
		{ label: '削除済みになっている', user: () => userDeletedBySelf, me: () => userDeletedBySelf, selector: (user: misskey.entities.MeDetailed) => user.isDeleted },
		// @ts-expect-error UserDetailedNotMe doesn't include isDeleted
		{ label: '自分以外から見たときは削除済みか判定できない', user: () => userDeletedBySelf, selector: (user: misskey.entities.UserDetailedNotMe) => user.isDeleted, expected: () => undefined },
		{ label: '削除済み(byAdmin)になっている', user: () => userDeletedByAdmin, me: () => userDeletedByAdmin, selector: (user: misskey.entities.MeDetailed) => user.isDeleted },
		// @ts-expect-error UserDetailedNotMe doesn't include isDeleted
		{ label: '自分以外から見たときは削除済み(byAdmin)か判定できない', user: () => userDeletedByAdmin, selector: (user: misskey.entities.UserDetailedNotMe) => user.isDeleted, expected: () => undefined },
		{ label: 'フォロー中になっている', user: () => userFollowedByAlice, selector: (user: misskey.entities.UserDetailed) => user.isFollowing },
		{ label: 'フォローされている', user: () => userFollowingAlice, selector: (user: misskey.entities.UserDetailed) => user.isFollowed },
		{ label: 'ブロック中になっている', user: () => userBlockedByAlice, selector: (user: misskey.entities.UserDetailed) => user.isBlocking },
		{ label: 'ブロックされている', user: () => userBlockingAlice, selector: (user: misskey.entities.UserDetailed) => user.isBlocked },
		{ label: 'ミュート中になっている', user: () => userMutedByAlice, selector: (user: misskey.entities.UserDetailed) => user.isMuted },
		{ label: 'リノートミュート中になっている', user: () => userRnMutedByAlice, selector: (user: misskey.entities.UserDetailed) => user.isRenoteMuted },
		{ label: 'フォローリクエスト中になっている', user: () => userFollowRequested, me: () => userFollowRequesting, selector: (user: misskey.entities.UserDetailed) => user.hasPendingFollowRequestFromYou },
		{ label: 'フォローリクエストされている', user: () => userFollowRequesting, me: () => userFollowRequested, selector: (user: misskey.entities.UserDetailed) => user.hasPendingFollowRequestToYou },
	] as const)('を取得することができ、$labelこと', async ({ user, me, selector, expected }) => {
		const response = await successfulApiCall({ endpoint: 'users/show', parameters: { userId: user().id }, user: me?.() ?? alice });
		assert.strictEqual(selector(response as any), (expected ?? ((): true => true))());
	});
	test('を取得することができ、Publicなロールがセットされていること', async () => {
		const response = await successfulApiCall({ endpoint: 'users/show', parameters: { userId: userRolePublic.id }, user: alice });
		assert.deepStrictEqual(response.badgeRoles, []);
		assert.deepStrictEqual(response.roles, [{
			id: rolePublic.id,
			name: rolePublic.name,
			color: rolePublic.color,
			iconUrl: rolePublic.iconUrl,
			description: rolePublic.description,
			isModerator: rolePublic.isModerator,
			isAdministrator: rolePublic.isAdministrator,
			displayOrder: rolePublic.displayOrder,
		}]);
	});
	test('を取得することができ、バッヂロールがセットされていること', async () => {
		const response = await successfulApiCall({ endpoint: 'users/show', parameters: { userId: userRoleBadge.id }, user: alice });
		assert.deepStrictEqual(response.badgeRoles, [{
			name: roleBadge.name,
			iconUrl: roleBadge.iconUrl,
			displayOrder: roleBadge.displayOrder,
		}]);
		assert.deepStrictEqual(response.roles, [{
			id: roleBadge.id,
			name: roleBadge.name,
			color: roleBadge.color,
			iconUrl: roleBadge.iconUrl,
			description: roleBadge.description,
			isModerator: roleBadge.isModerator,
			isAdministrator: roleBadge.isAdministrator,
			displayOrder: roleBadge.displayOrder,
		}]);
	});
	test('をID指定のリスト形式で取得することができる（空）', async () => {
		const parameters = { userIds: [] };
		const response = await successfulApiCall({ endpoint: 'users/show', parameters, user: alice });
		const expected: [] = [];
		assert.deepStrictEqual(response, expected);
	});
	test('をID指定のリスト形式で取得することができる', async() => {
		const parameters = { userIds: [bob.id, alice.id, carol.id] };
		const response = await successfulApiCall({ endpoint: 'users/show', parameters, user: alice });
		const expected = [
			await successfulApiCall({ endpoint: 'users/show', parameters: { userId: bob.id }, user: alice }),
			await successfulApiCall({ endpoint: 'users/show', parameters: { userId: alice.id }, user: alice }),
			await successfulApiCall({ endpoint: 'users/show', parameters: { userId: carol.id }, user: alice }),
		];
		assert.deepStrictEqual(response, expected);
	});
	test.each([
		{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: () => userNotExplorable },
		{ label: 'ミュートユーザーが含まれる', user: () => userMutedByAlice },
		{ label: 'ブロックされているユーザーが含まれる', user: () => userBlockedByAlice },
		{ label: 'ブロックしてきているユーザーが含まれる', user: () => userBlockingAlice },
		{ label: '承認制ユーザーが含まれる', user: () => userLocking },
		{ label: 'サイレンスユーザーが含まれる', user: () => userSilenced },
		{ label: 'サスペンドユーザーが（モデレーターが見るときは）含まれる', user: () => userSuspended, me: () => root },
		// BUG サスペンドユーザーを一般ユーザーから見るとrootユーザーが返ってくる
		//{ label: 'サスペンドユーザーが（一般ユーザーが見るときは）含まれない', user: () => userSuspended, me: () => bob, excluded: true },
		{ label: '削除済ユーザーが含まれる', user: () => userDeletedBySelf },
		{ label: '削除済(byAdmin)ユーザーが含まれる', user: () => userDeletedByAdmin },
		// @ts-expect-error excluded は上でコメントアウトされているので
	] as const)('をID指定のリスト形式で取得することができ、結果に$label', async ({ user, me, excluded }) => {
		const parameters = { userIds: [user().id] };
		const response = await successfulApiCall({ endpoint: 'users/show', parameters, user: me?.() ?? alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, me?.() ?? alice)];
		assert.deepStrictEqual(response, expected);
	});
	test.todo('をID指定のリスト形式で取得することができる(リモート)');

	//#endregion
	//#region 検索(users/search)

	test('を検索することができる', async () => {
		const parameters = { query: 'carol', limit: 10 };
		const response = await successfulApiCall({ endpoint: 'users/search', parameters, user: alice });
		const expected = [await show(carol.id, alice)];
		assert.deepStrictEqual(response, expected);
	});
	test('を検索することができる(UserLite)', async () => {
		const parameters = { query: 'carol', detail: false, limit: 10 };
		const response = await successfulApiCall({ endpoint: 'users/search', parameters, user: alice });
		const expected = [userLite(await show(carol.id, alice))];
		assert.deepStrictEqual(response, expected);
	});
	test.each([
		{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: () => userNotExplorable },
		{ label: 'ミュートユーザーが含まれる', user: () => userMutedByAlice },
		{ label: 'ブロックされているユーザーが含まれる', user: () => userBlockedByAlice },
		{ label: 'ブロックしてきているユーザーが含まれる', user: () => userBlockingAlice },
		{ label: '承認制ユーザーが含まれる', user: () => userLocking },
		{ label: 'サイレンスユーザーが含まれる', user: () => userSilenced },
		{ label: 'サスペンドユーザーが含まれない', user: () => userSuspended, excluded: true },
		{ label: '削除済ユーザーが含まれる', user: () => userDeletedBySelf },
		{ label: '削除済(byAdmin)ユーザーが含まれる', user: () => userDeletedByAdmin },
	] as const)('を検索することができ、結果に$labelが含まれる', async ({ user, excluded }) => {
		const parameters = { query: user().username, limit: 1 };
		const response = await successfulApiCall({ endpoint: 'users/search', parameters, user: alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
		assert.deepStrictEqual(response, expected);
	});
	test.todo('を検索することができる(リモート)');
	test.todo('を検索することができる(pagenation)');

	//#endregion
	//#region ID指定検索(users/search-by-username-and-host)

	test.each([
		{ label: '自分', parameters: { username: 'alice' }, user: () => [alice] },
		{ label: '自分かつusernameが大文字', parameters: { username: 'ALICE' }, user: () => [alice] },
		{ label: 'ローカルのフォロイーでノートなし', parameters: { username: 'userFollowedByAlice' }, user: () => [userFollowedByAlice] },
		{ label: 'ローカルでノートなしは検索に載らない', parameters: { username: 'userNoNote' }, user: () => [] },
		{ label: 'ローカルの他人1', parameters: { username: 'bob' }, user: () => [bob] },
		{ label: 'ローカルの他人2', parameters: { username: 'bob', host: null }, user: () => [bob] },
		{ label: 'ローカルの他人3', parameters: { username: 'bob', host: '.' }, user: () => [bob] },
		{ label: 'ローカル', parameters: { host: null, limit: 1 }, user: () => [userFollowedByAlice] },
		{ label: 'ローカル', parameters: { host: '.', limit: 1 }, user: () => [userFollowedByAlice] },
	])('をID&ホスト指定で検索できる($label)', async ({ parameters, user }) => {
		const response = await successfulApiCall({ endpoint: 'users/search-by-username-and-host', parameters, user: alice });
		const expected = await Promise.all(user().map(u => show(u.id, alice)));
		assert.deepStrictEqual(response, expected);
	});
	test.each([
		{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: () => userNotExplorable },
		{ label: 'ミュートユーザーが含まれる', user: () => userMutedByAlice },
		{ label: 'ブロックされているユーザーが含まれる', user: () => userBlockedByAlice },
		{ label: 'ブロックしてきているユーザーが含まれる', user: () => userBlockingAlice },
		{ label: '承認制ユーザーが含まれる', user: () => userLocking },
		{ label: 'サイレンスユーザーが含まれる', user: () => userSilenced },
		{ label: 'サスペンドユーザーが含まれない', user: () => userSuspended, excluded: true },
		{ label: '削除済ユーザーが含まれる', user: () => userDeletedBySelf },
		{ label: '削除済(byAdmin)ユーザーが含まれる', user: () => userDeletedByAdmin },
	] as const)('をID&ホスト指定で検索でき、結果に$label', async ({ user, excluded }) => {
		const parameters = { username: user().username };
		const response = await successfulApiCall({ endpoint: 'users/search-by-username-and-host', parameters, user: alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
		assert.deepStrictEqual(response, expected);
	});
	test.todo('をID&ホスト指定で検索できる(リモート)');

	//#endregion
	//#region ID指定検索(users/get-frequently-replied-users)

	test('がよくリプライをするユーザーのリストを取得できる', async () => {
		const parameters = { userId: alice.id, limit: 5 };
		const response = await successfulApiCall({ endpoint: 'users/get-frequently-replied-users', parameters, user: alice });
		const expected = await Promise.all(usersReplying.slice(0, parameters.limit).map(async (s, i) => ({
			user: await show(s.id, alice),
			weight: (usersReplying.length - i) / usersReplying.length,
		})));
		assert.deepStrictEqual(response, expected);
	});
	test.each([
		{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: () => userNotExplorable },
		{ label: 'ミュートユーザーが含まれる', user: () => userMutedByAlice },
		{ label: 'ブロックされているユーザーが含まれる', user: () => userBlockedByAlice },
		{ label: 'ブロックしてきているユーザーが含まれない', user: () => userBlockingAlice, excluded: true },
		{ label: '承認制ユーザーが含まれる', user: () => userLocking },
		{ label: 'サイレンスユーザーが含まれる', user: () => userSilenced },
		//{ label: 'サスペンドユーザーが含まれない', user: () => userSuspended, excluded: true },
		{ label: '削除済ユーザーが含まれる', user: () => userDeletedBySelf },
		{ label: '削除済(byAdmin)ユーザーが含まれる', user: () => userDeletedByAdmin },
	] as const)('がよくリプライをするユーザーのリストを取得でき、結果に$label', async ({ user, excluded }) => {
		const replyTo = (await successfulApiCall({ endpoint: 'users/notes', parameters: { userId: user().id }, user: undefined }))[0];
		await post(alice, { text: `@${user().username} test`, replyId: replyTo.id });
		const parameters = { userId: alice.id, limit: 100 };
		const response = await successfulApiCall({ endpoint: 'users/get-frequently-replied-users', parameters, user: alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
		assert.deepStrictEqual(response.map(s => s.user).filter((u) => u.id === user().id), expected);
	});

	//#endregion
	//#region ハッシュタグ(hashtags/users)

	test.each([
		{ label: 'フォロワー昇順', sort: { sort: '+follower' }, selector: (u: misskey.entities.UserDetailedNotMe): string => String(u.followersCount) },
		{ label: 'フォロワー降順', sort: { sort: '-follower' }, selector: (u: misskey.entities.UserDetailedNotMe): string => String(u.followersCount) },
		{ label: '登録日時昇順', sort: { sort: '+createdAt' }, selector: (u: misskey.entities.UserDetailedNotMe): string => u.createdAt },
		{ label: '登録日時降順', sort: { sort: '-createdAt' }, selector: (u: misskey.entities.UserDetailedNotMe): string => u.createdAt },
		{ label: '投稿日時昇順', sort: { sort: '+updatedAt' }, selector: (u: misskey.entities.UserDetailedNotMe): string => String(u.updatedAt) },
		{ label: '投稿日時降順', sort: { sort: '-updatedAt' }, selector: (u: misskey.entities.UserDetailedNotMe): string => String(u.updatedAt) },
	] as const)('をハッシュタグ指定で取得することができる($label)', async ({ sort, selector }) => {
		const hashtag = 'test_hashtag';
		await successfulApiCall({ endpoint: 'i/update', parameters: { description: `#${hashtag}` }, user: alice });
		const parameters = { tag: hashtag, limit: 5, ...sort };
		const response = await successfulApiCall({ endpoint: 'hashtags/users', parameters, user: alice });
		const users = await Promise.all(response.map(u => show(u.id, alice)));
		const expected = users.sort((x, y) => {
			const index = (selector(x) < selector(y)) ? -1 : (selector(x) > selector(y)) ? 1 : 0;
			return index * (parameters.sort.startsWith('+') ? -1 : 1);
		});
		assert.deepStrictEqual(response, expected);
	});
	test.each([
		{ label: '「見つけやすくする」がOFFのユーザーが含まれる', user: () => userNotExplorable },
		{ label: 'ミュートユーザーが含まれる', user: () => userMutedByAlice },
		{ label: 'ブロックされているユーザーが含まれる', user: () => userBlockedByAlice },
		{ label: 'ブロックしてきているユーザーが含まれる', user: () => userBlockingAlice },
		{ label: '承認制ユーザーが含まれる', user: () => userLocking },
		{ label: 'サイレンスユーザーが含まれる', user: () => userSilenced },
		{ label: 'サスペンドユーザーが含まれない', user: () => userSuspended, excluded: true },
		{ label: '削除済ユーザーが含まれる', user: () => userDeletedBySelf },
		{ label: '削除済(byAdmin)ユーザーが含まれる', user: () => userDeletedByAdmin },
	] as const)('をハッシュタグ指定で取得することができ、結果に$label', async ({ user, excluded }) => {
		const hashtag = `user_test${user().username}`;
		if (user() !== userSuspended) {
			// サスペンドユーザーはupdateできない。
			await successfulApiCall({ endpoint: 'i/update', parameters: { description: `#${hashtag}` }, user: user() });
		}
		const parameters = { tag: hashtag, limit: 100, sort: '-follower' } as const;
		const response = await successfulApiCall({ endpoint: 'hashtags/users', parameters, user: alice });
		const expected = (excluded ?? false) ? [] : [await show(user().id, alice)];
		assert.deepStrictEqual(response, expected);
	});
	test.todo('をハッシュタグ指定で取得することができる(リモート)');

	//#endregion
	//#region オススメユーザー(users/recommendation)

	// BUG users/recommendationは壊れている？ > QueryFailedError: missing FROM-clause entry for table "note"
	test.skip('のオススメを取得することができる', async () => {
		const parameters = {};
		const response = await successfulApiCall({ endpoint: 'users/recommendation', parameters, user: alice });
		const expected = await Promise.all(response.map(u => show(u.id)));
		assert.deepStrictEqual(response, expected);
	});

	//#endregion
	//#region ピン止めユーザー(pinned-users)

	test('のピン止めユーザーを取得することができる', async () => {
		await successfulApiCall({ endpoint: 'admin/update-meta', parameters: { pinnedUsers: [bob.username, `@${carol.username}`] }, user: root });
		const parameters = {} as const;
		const response = await successfulApiCall({ endpoint: 'pinned-users', parameters, user: alice });
		const expected = await Promise.all([bob, carol].map(u => show(u.id, alice)));
		assert.deepStrictEqual(response, expected);
	});

	//#endregion

	test.todo('を管理人として確認することができる(admin/show-user)');
	test.todo('を管理人として確認することができる(admin/show-users)');
	test.todo('をサーバー向けに取得することができる(federation/users)');
});
