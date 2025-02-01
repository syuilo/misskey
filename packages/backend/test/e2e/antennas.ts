/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';
import {
	api,
	failedApiCall,
	post,
	role,
	signup,
	successfulApiCall,
	testPaginationConsistency,
	uploadFile,
	userList,
} from '../utils.js';
import type * as misskey from 'misskey-js';

const compareBy = <T extends { id: string }>(selector: (s: T) => string = (s: T): string => s.id) => (a: T, b: T): number => {
	return selector(a).localeCompare(selector(b));
};

describe('アンテナ', () => {
	// エンティティとしてのアンテナを主眼においたテストを記述する
	// (Antennaを返すエンドポイント、Antennaエンティティを書き換えるエンドポイント、Antennaからノートを取得するエンドポイントをテストする)

	type Antenna = misskey.entities.Antenna;
	type User = misskey.entities.SignupResponse;
	type Note = misskey.entities.Note;

	// アンテナを作成できる最小のパラメタ
	const defaultParam = {
		caseSensitive: false,
		excludeKeywords: [['']],
		keywords: [['keyword']],
		name: 'test',
		src: 'all' as const,
		userListId: null,
		users: [''],
		withFile: false,
		withReplies: false,
		excludeBots: false,
	};

	let root: User;
	let alice: User;
	let bob: User;
	let carol: User;

	let alicePost: Note;
	let aliceList: misskey.entities.UserList;
	let bobFile: misskey.entities.DriveFile;
	let bobList: misskey.entities.UserList;

	let userNotExplorable: User;
	let userLocking: User;
	let userSilenced: User;
	let userSuspended: User;
	let userDeletedBySelf: User;
	let userDeletedByAdmin: User;
	let userFollowingAlice: User;
	let userFollowedByAlice: User;
	let userBlockingAlice: User;
	let userBlockedByAlice: User;
	let userMutingAlice: User;
	let userMutedByAlice: User;

	beforeAll(async () => {
		root = await signup({ username: 'root' });
		alice = await signup({ username: 'alice' });
		alicePost = await post(alice, { text: 'test' });
		aliceList = await userList(alice, {});
		bob = await signup({ username: 'bob' });
		aliceList = await userList(alice, {});
		bobFile = (await uploadFile(bob)).body!;
		bobList = await userList(bob);
		carol = await signup({ username: 'carol' });
		await api('users/lists/push', { listId: aliceList.id, userId: bob.id }, alice);
		await api('users/lists/push', { listId: aliceList.id, userId: carol.id }, alice);

		userNotExplorable = await signup({ username: 'userNotExplorable' });
		await post(userNotExplorable, { text: 'test' });
		await api('i/update', { isExplorable: false }, userNotExplorable);
		userLocking = await signup({ username: 'userLocking' });
		await post(userLocking, { text: 'test' });
		await api('i/update', { isLocked: true }, userLocking);
		userSilenced = await signup({ username: 'userSilenced' });
		await post(userSilenced, { text: 'test' });
		const roleSilenced = await role(root, {}, { canPublicNote: { priority: 0, useDefault: false, value: false } });
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
		userFollowedByAlice = await signup({ username: 'userFollowedByAlice' });
		await post(userFollowedByAlice, { text: 'test' });
		await api('following/create', { userId: userFollowedByAlice.id }, alice);
		userFollowingAlice = await signup({ username: 'userFollowingAlice' });
		await post(userFollowingAlice, { text: 'test' });
		await api('following/create', { userId: alice.id }, userFollowingAlice);
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
	}, 1000 * 60 * 10);

	beforeEach(async () => {
		// テスト間で影響し合わないように毎回全部消す。
		for (const user of [alice, bob]) {
			const list = await api('antennas/list', {}, user);
			for (const antenna of list.body) {
				await api('antennas/delete', { antennaId: antenna.id }, user);
			}
		}
	});

	//#region 作成(antennas/create)

	test('が作成できること、キーが過不足なく入っていること。', async () => {
		const response = await successfulApiCall({
			endpoint: 'antennas/create',
			parameters: defaultParam,
			user: alice,
		});
		assert.match(response.id, /[0-9a-z]{10}/);
		const expected: Antenna = {
			id: response.id,
			caseSensitive: false,
			createdAt: new Date(response.createdAt).toISOString(),
			excludeKeywords: [['']],
			hideNotesInSensitiveChannel: false,
			hasUnreadNote: false,
			isActive: true,
			keywords: [['keyword']],
			name: 'test',
			src: 'all',
			userListId: null,
			users: [''],
			withFile: false,
			withReplies: false,
			excludeBots: false,
			localOnly: false,
			notify: false,
		};
		assert.deepStrictEqual(response, expected);
	});

	test('が上限いっぱいまで作成できること', async () => {
		const response = await Promise.all([...Array(DEFAULT_POLICIES.antennaLimit)].map(() => successfulApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam },
			user: alice,
		})));

		const expected = await successfulApiCall({ endpoint: 'antennas/list', parameters: {}, user: alice });
		assert.deepStrictEqual(
			response.sort(compareBy(s => s.id)),
			expected.sort(compareBy(s => s.id)));

		failedApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam },
			user: alice,
		}, {
			status: 400,
			code: 'TOO_MANY_ANTENNAS',
			id: 'faf47050-e8b5-438c-913c-db2b1576fde4',
		});
	});

	test('を作成するとき他人のリストを指定したらエラーになる', async () => {
		failedApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam, src: 'list', userListId: bobList.id },
			user: alice,
		}, {
			status: 400,
			code: 'NO_SUCH_USER_LIST',
			id: '95063e93-a283-4b8b-9aa5-bcdb8df69a7f',
		});
	});

	const antennaParamPattern = [
		{ parameters: () => ({ name: 'x'.repeat(100) }) },
		{ parameters: () => ({ name: 'x' }) },
		{ parameters: () => ({ src: 'home' as const }) },
		{ parameters: () => ({ src: 'all' as const }) },
		{ parameters: () => ({ src: 'users' as const }) },
		{ parameters: () => ({ src: 'list' as const }) },
		{ parameters: () => ({ userListId: null }) },
		{ parameters: () => ({ src: 'list' as const, userListId: aliceList.id }) },
		{ parameters: () => ({ keywords: [['x']] }) },
		{ parameters: () => ({ keywords: [['a', 'b', 'c'], ['x'], ['y'], ['z']] }) },
		{ parameters: () => ({ excludeKeywords: [['a', 'b', 'c'], ['x'], ['y'], ['z']] }) },
		{ parameters: () => ({ users: [alice.username] }) },
		{ parameters: () => ({ users: [alice.username, bob.username, carol.username] }) },
		{ parameters: () => ({ caseSensitive: false }) },
		{ parameters: () => ({ caseSensitive: true }) },
		{ parameters: () => ({ withReplies: false }) },
		{ parameters: () => ({ withReplies: true }) },
		{ parameters: () => ({ withFile: false }) },
		{ parameters: () => ({ withFile: true }) },
		{ parameters: () => ({ hideNotesInSensitiveChannel: false }) },
		{ parameters: () => ({ hideNotesInSensitiveChannel: true }) },
	];
	test.each(antennaParamPattern)('を作成できること($#)', async ({ parameters }) => {
		const response = await successfulApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam, ...parameters() },
			user: alice,
		});
		const expected = { ...response, ...parameters() };
		assert.deepStrictEqual(response, expected);
	});

	test('を作成する時キーワードが指定されていないとエラーになる', async () => {
		await failedApiCall({
			endpoint: 'antennas/create',
			parameters: { ...defaultParam, keywords: [[]], excludeKeywords: [[]] },
			user: alice
		}, {
			status: 400,
			code: 'EMPTY_KEYWORD',
			id: '53ee222e-1ddd-4f9a-92e5-9fb82ddb463a'
		})
	});
	//#endregion
	//#region 更新(antennas/update)

	test.each(antennaParamPattern)('を変更できること($#)', async ({ parameters }) => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		const response = await successfulApiCall({
			endpoint: 'antennas/update',
			parameters: { antennaId: antenna.id, ...defaultParam, ...parameters() },
			user: alice,
		});
		const expected = { ...response, ...parameters() };
		assert.deepStrictEqual(response, expected);
	});
	test.todo('は他人のものは変更できない');

	test('を変更するとき他人のリストを指定したらエラーになる', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		failedApiCall({
			endpoint: 'antennas/update',
			parameters: { antennaId: antenna.id, ...defaultParam, src: 'list', userListId: bobList.id },
			user: alice,
		}, {
			status: 400,
			code: 'NO_SUCH_USER_LIST',
			id: '1c6b35c9-943e-48c2-81e4-2844989407f7',
		});
	});
	test('を変更する時キーワードが指定されていないとエラーになる', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		await failedApiCall({
			endpoint: 'antennas/update',
			parameters: { ...defaultParam, antennaId: antenna.id, keywords: [[]], excludeKeywords: [[]] },
			user: alice
		}, {
			status: 400,
			code: 'EMPTY_KEYWORD',
			id: '721aaff6-4e1b-4d88-8de6-877fae9f68c4'
		})
	});

	//#endregion
	//#region 表示(antennas/show)

	test('をID指定で表示できること。', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		const response = await successfulApiCall({
			endpoint: 'antennas/show',
			parameters: { antennaId: antenna.id },
			user: alice,
		});
		const expected = { ...antenna };
		assert.deepStrictEqual(response, expected);
	});
	test.todo('は他人のものをID指定で表示できない');

	//#endregion
	//#region 一覧(antennas/list)

	test('をリスト形式で取得できること。', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: bob });
		const response = await successfulApiCall({
			endpoint: 'antennas/list',
			parameters: {},
			user: alice,
		});
		const expected = [{ ...antenna }];
		assert.deepStrictEqual(response, expected);
	});

	//#endregion
	//#region 削除(antennas/delete)

	test('を削除できること。', async () => {
		const antenna = await successfulApiCall({ endpoint: 'antennas/create', parameters: defaultParam, user: alice });
		const response = await successfulApiCall({
			endpoint: 'antennas/delete',
			parameters: { antennaId: antenna.id },
			user: alice,
		});
		assert.deepStrictEqual(response, null);
		const list = await successfulApiCall({ endpoint: 'antennas/list', parameters: {}, user: alice });
		assert.deepStrictEqual(list, []);
	});
	test.todo('は他人のものを削除できない');

	//#endregion

	describe('のノート', () => {
		//#region アンテナのノート取得(antennas/notes)

		test('を取得できること。', async () => {
			const keyword = 'キーワード';
			await post(bob, { text: `test ${keyword} beforehand` });
			const antenna = await successfulApiCall({
				endpoint: 'antennas/create',
				parameters: { ...defaultParam, keywords: [[keyword]] },
				user: alice,
			});
			const note = await post(bob, { text: `test ${keyword}` });
			const response = await successfulApiCall({
				endpoint: 'antennas/notes',
				parameters: { antennaId: antenna.id },
				user: alice,
			});
			const expected = [note];
			assert.deepStrictEqual(response, expected);
		});

		const keyword = 'キーワード';
		test.each([
			{
				label: '全体から',
				parameters: () => ({ src: 'all' }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: `test ${keyword}` }), included: true },
				],
			},
			{
				// BUG e4144a1 以降home指定は壊れている(allと同じ)
				label: 'ホーム指定はallと同じ',
				parameters: () => ({ src: 'home' }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: `test ${keyword}` }), included: true },
				],
			},
			{
				// https://github.com/misskey-dev/misskey/issues/9025
				label: 'ただし、フォロワー限定投稿とDM投稿を含まない。フォロワーであっても。',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}`, visibility: 'public' }), included: true },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}`, visibility: 'home' }), included: true },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}`, visibility: 'followers' }) },
					{ note: (): Promise<Note> => post(userFollowedByAlice, { text: `${keyword}`, visibility: 'specified', visibleUserIds: [alice.id] }) },
				],
			},
			{
				label: 'ブロックしているユーザーのノートは含む',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userBlockedByAlice, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: 'ブロックされているユーザーのノートは含まない',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userBlockingAlice, { text: `${keyword}` }) },
				],
			},
			{
				label: 'ミュートしているユーザーのノートは含まない',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userMutedByAlice, { text: `${keyword}` }) },
				],
			},
			{
				label: 'ミュートされているユーザーのノートは含む',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userMutingAlice, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: '「見つけやすくする」がOFFのユーザーのノートも含まれる',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userNotExplorable, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: '鍵付きユーザーのノートも含まれる',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userLocking, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: 'サイレンスのノートも含まれる',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userSilenced, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: '削除ユーザーのノートも含まれる',
				parameters: () => ({}),
				posts: [
					{ note: (): Promise<Note> => post(userDeletedBySelf, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(userDeletedByAdmin, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: 'ユーザー指定で',
				parameters: () => ({ src: 'users', users: [`@${bob.username}`, `@${carol.username}`] }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: `test ${keyword}` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: `test ${keyword}` }), included: true },
				],
			},
			{
				label: 'リスト指定で',
				parameters: () => ({ src: 'list', userListId: aliceList.id }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: `test ${keyword}` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: `test ${keyword}` }), included: true },
				],
			},
			{
				label: 'CWにもマッチする',
				parameters: () => ({ keywords: [[keyword]] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'test', cw: `cw ${keyword}` }), included: true },
				],
			},
			{
				label: 'キーワード1つ',
				parameters: () => ({ keywords: [[keyword]] }),
				posts: [
					{ note: (): Promise<Note> => post(alice, { text: 'test' }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(carol, { text: 'test' }) },
				],
			},
			{
				label: 'キーワード3つ(AND)',
				parameters: () => ({ keywords: [['A', 'B', 'C']] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'test A' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'test A B' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'test B C' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'test A B C' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test C B A A B C' }), included: true },
				],
			},
			{
				label: 'キーワード3つ(OR)',
				parameters: () => ({ keywords: [['A'], ['B'], ['C']] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'test' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'test A' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test A B' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test B C' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test B C A' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test C B' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'test C' }), included: true },
				],
			},
			{
				label: '除外ワード3つ(AND)',
				parameters: () => ({ excludeKeywords: [['A', 'B', 'C']] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} A` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} A B` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} B C` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} B C A` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} C B` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} C` }), included: true },
				],
			},
			{
				label: '除外ワード3つ(OR)',
				parameters: () => ({ excludeKeywords: [['A'], ['B'], ['C']] }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} A` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} A B` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} B C` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} B C A` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} C B` }) },
					{ note: (): Promise<Note> => post(bob, { text: `test ${keyword} C` }) },
				],
			},
			{
				label: 'キーワード1つ(大文字小文字区別する)',
				parameters: () => ({ keywords: [['KEYWORD']], caseSensitive: true }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'keyword' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'kEyWoRd' }) },
					{ note: (): Promise<Note> => post(bob, { text: 'KEYWORD' }), included: true },
				],
			},
			{
				label: 'キーワード1つ(大文字小文字区別しない)',
				parameters: () => ({ keywords: [['KEYWORD']], caseSensitive: false }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: 'keyword' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'kEyWoRd' }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: 'KEYWORD' }), included: true },
				],
			},
			{
				label: '除外ワード1つ(大文字小文字区別する)',
				parameters: () => ({ excludeKeywords: [['KEYWORD']], caseSensitive: true }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} keyword` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} kEyWoRd` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} KEYWORD` }) },
				],
			},
			{
				label: '除外ワード1つ(大文字小文字区別しない)',
				parameters: () => ({ excludeKeywords: [['KEYWORD']], caseSensitive: false }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} keyword` }) },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} kEyWoRd` }) },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword} KEYWORD` }) },
				],
			},
			{
				label: '添付ファイルを問わない',
				parameters: () => ({ withFile: false }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}`, fileIds: [bobFile.id] }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: '添付ファイル付きのみ',
				parameters: () => ({ withFile: true }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}`, fileIds: [bobFile.id] }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }) },
				],
			},
			{
				label: 'リプライ以外',
				parameters: () => ({ withReplies: false }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}`, replyId: alicePost.id }) },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
				],
			},
			{
				label: 'リプライも含む',
				parameters: () => ({ withReplies: true }),
				posts: [
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}`, replyId: alicePost.id }), included: true },
					{ note: (): Promise<Note> => post(bob, { text: `${keyword}` }), included: true },
				],
			},
		])('が取得できること（$label）', async ({ parameters, posts }) => {
			const antenna = await successfulApiCall({
				endpoint: 'antennas/create',
				parameters: { ...defaultParam, keywords: [[keyword]], ...parameters() },
				user: alice,
			});

			const notes = await posts.reduce(async (prev, current) => {
				// includedに関わらずnote()は評価して投稿する。
				const p = await prev;
				const n = await current.note();
				if (current.included) return p.concat(n);
				return p;
			}, Promise.resolve([] as Note[]));

			// alice視点でNoteを取り直す
			const expected = await Promise.all(notes.reverse().map(s => successfulApiCall({
				endpoint: 'notes/show',
				parameters: { noteId: s.id },
				user: alice,
			})));

			const response = await successfulApiCall({
				endpoint: 'antennas/notes',
				parameters: { antennaId: antenna.id },
				user: alice,
			});
			assert.deepStrictEqual(
				response.map(({ userId, id, text }) => ({ userId, id, text })),
				expected.map(({ userId, id, text }) => ({ userId, id, text })));
			assert.deepStrictEqual(response, expected);
		});

		test('が取得できること（センシティブチャンネルのノートを除く）', async () => {
			const keyword = 'キーワード';
			const antenna = await successfulApiCall({
				endpoint: 'antennas/create',
				parameters: { ...defaultParam, keywords: [[keyword]], hideNotesInSensitiveChannel: true },
				user: alice,
			});
			const nonSensitiveChannel = await successfulApiCall({
				endpoint: 'channels/create',
				parameters: { name: 'test', isSensitive: false },
				user: alice,
			});
			const sensitiveChannel = await successfulApiCall({
				endpoint: 'channels/create',
				parameters: { name: 'test', isSensitive: true },
				user: alice,
			});

			const noteInLocal = await post(bob, { text: `test ${keyword}` });
			const noteInNonSensitiveChannel = await post(bob, { text: `test ${keyword}`, channelId: nonSensitiveChannel.id });
			await post(bob, { text: `test ${keyword}`, channelId: sensitiveChannel.id });

			const response = await successfulApiCall({
				endpoint: 'antennas/notes',
				parameters: { antennaId: antenna.id },
				user: alice,
			});
			// 最後に投稿したものが先頭に来る。
			const expected = [
				noteInNonSensitiveChannel,
				noteInLocal,
			];
			assert.deepStrictEqual(response, expected);
		});


		test.skip('が取得でき、日付指定のPaginationに一貫性があること', async () => { });
		test.each([
			{ label: 'ID指定', offsetBy: 'id' },

			// BUG sinceDate, untilDateはsinceIdや他のエンドポイントとは異なり、その時刻に一致するレコードを含んでしまう。
			// { label: '日付指定', offsetBy: 'createdAt' },
		] as const)('が取得でき、$labelのPaginationに一貫性があること', async ({ offsetBy }) => {
			const antenna = await successfulApiCall({
				endpoint: 'antennas/create',
				parameters: { ...defaultParam, keywords: [[keyword]] },
				user: alice,
			});
			const notes = await [...Array(30)].reduce(async (prev, current, index) => {
				const p = await prev;
				const n = await post(alice, { text: `${keyword} (${index})` });
				return [n].concat(p);
			}, Promise.resolve([] as Note[]));

			// antennas/notesは降順のみで、昇順をサポートしない。
			await testPaginationConsistency(notes, async (paginationParam) => {
				return successfulApiCall({
					endpoint: 'antennas/notes',
					parameters: { antennaId: antenna.id, ...paginationParam },
					user: alice,
				});
			}, offsetBy, 'desc');
		});

		// BUG 7日過ぎると作り直すしかない。 https://github.com/misskey-dev/misskey/issues/10476
		test.todo('を取得したときActiveに戻る');

		//#endregion
	});
});
