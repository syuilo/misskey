/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// How to run:
// pnpm jest -- e2e/timelines.ts

import * as assert from 'assert';
import { setTimeout } from 'node:timers/promises';
import { Redis } from 'ioredis';
import { api, post, randomString, sendEnvUpdateRequest, signup, uploadUrl } from '../utils.js';
import { loadConfig } from '@/config.js';

function genHost() {
	return randomString() + '.example.com';
}

function waitForPushToTl() {
	return setTimeout(500);
}

let redisForTimelines: Redis;

describe('Timelines', () => {
	beforeAll(() => {
		redisForTimelines = new Redis(loadConfig().redisForTimelines);
	});

	describe('Home TL', () => {
		test.concurrent('自分の visibility: followers なノートが含まれる', async () => {
			const [alice] = await Promise.all([signup()]);

			const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'hi');
		});

		test.concurrent('フォローしているユーザーのノートが含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi' });
			const carolNote = await post(carol, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('フォローしているユーザーの visibility: followers なノートが含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });
			const carolNote = await post(carol, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: false でフォローしているユーザーの他人への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: true でフォローしているユーザーの他人への返信が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: true でフォローしているユーザーの他人へのDM返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id, visibility: 'specified', visibleUserIds: [carolNote.id] });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: true でフォローしているユーザーの他人の visibility: followers な投稿への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: carol.id }, bob);
			await api('following/create', { userId: bob.id }, alice);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/create', { userId: carol.id }, alice);
			await api('following/create', { userId: carol.id }, bob);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === carolNote.id)?.text, 'hi');
		});

		test.concurrent('withReplies: true でフォローしているユーザーの自分の visibility: followers な投稿への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/create', { userId: alice.id }, bob);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });
			const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
		});

		test.concurrent('withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの投稿への visibility: specified な返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/create', { userId: carol.id }, alice);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id, visibility: 'specified', visibleUserIds: [carolNote.id] });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
		});

		test.concurrent('withReplies: false でフォローしているユーザーのそのユーザー自身への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
		});

		test.concurrent('withReplies: false でフォローしているユーザーからの自分への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('自分の他人への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi' });
			const aliceNote = await post(alice, { text: 'hi', replyId: bobNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
		});

		test.concurrent('フォローしているユーザーの他人の投稿のリノートが含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { renoteId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('[withRenotes: false] フォローしているユーザーの他人の投稿のリノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { renoteId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', {
				withRenotes: false,
			}, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('[withRenotes: false] フォローしているユーザーの他人の投稿の引用が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', {
				withRenotes: false,
			}, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('フォローしているユーザーの他人への visibility: specified なノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [carol.id] });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('フォローしているユーザーが行ったミュートしているユーザーのリノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('mute/create', { userId: carol.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await api('mute/create', { userId: carol.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('フォローしているリモートユーザーのノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

			await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
			await api('following/create', { userId: bob.id }, alice);

			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('フォローしているリモートユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

			await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
			await api('following/create', { userId: bob.id }, alice);

			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('[withFiles: true] フォローしているユーザーのファイル付きノートのみ含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const [bobFile, carolFile] = await Promise.all([
				uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png'),
				uploadUrl(carol, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png'),
			]);
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { fileIds: [bobFile.id] });
			const carolNote1 = await post(carol, { text: 'hi' });
			const carolNote2 = await post(carol, { fileIds: [carolFile.id] });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100, withFiles: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote1.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote2.id), false);
		});

		test.concurrent('フォローしているユーザーのチャンネル投稿が含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('自分の visibility: specified なノートが含まれる', async () => {
			const [alice] = await Promise.all([signup()]);

			const aliceNote = await post(alice, { text: 'hi', visibility: 'specified' });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'hi');
		});

		test.concurrent('フォローしているユーザーの自身を visibleUserIds に指定した visibility: specified なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [alice.id] });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
		});

		test.concurrent('フォローしていないユーザーの自身を visibleUserIds に指定した visibility: specified なノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [alice.id] });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('フォローしているユーザーの自身を visibleUserIds に指定していない visibility: specified なノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [carol.id] });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('フォローしていないユーザーからの visibility: specified なノートに返信したときの自身のノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [alice.id] });
			const aliceNote = await post(alice, { text: 'ok', visibility: 'specified', visibleUserIds: [bob.id], replyId: bobNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'ok');
		});

		/* TODO
		test.concurrent('自身の visibility: specified なノートへのフォローしていないユーザーからの返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const aliceNote = await post(alice, { text: 'hi', visibility: 'specified', visibleUserIds: [bob.id] });
			const bobNote = await post(bob, { text: 'ok', visibility: 'specified', visibleUserIds: [alice.id], replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === bobNote.id).text, 'ok');
		});
		*/

		// ↑の挙動が理想だけど実装が面倒かも
		test.concurrent('自身の visibility: specified なノートへのフォローしていないユーザーからの返信が含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const aliceNote = await post(alice, { text: 'hi', visibility: 'specified', visibleUserIds: [bob.id] });
			const bobNote = await post(bob, { text: 'ok', visibility: 'specified', visibleUserIds: [alice.id], replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('FTT: ローカルユーザーの HTL にはプッシュされる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', {
				userId: alice.id,
			}, bob);

			const aliceNote = await post(alice, { text: 'I\'m Alice.' });
			const bobNote = await post(bob, { text: 'I\'m Bob.' });
			const carolNote = await post(carol, { text: 'I\'m Carol.' });

			await waitForPushToTl();

			// NOTE: notes/timeline だと DB へのフォールバックが効くので Redis を直接見て確かめる
			assert.strictEqual(await redisForTimelines.exists(`list:homeTimeline:${bob.id}`), 1);

			const bobHTL = await redisForTimelines.lrange(`list:homeTimeline:${bob.id}`, 0, -1);
			assert.strictEqual(bobHTL.includes(aliceNote.id), true);
			assert.strictEqual(bobHTL.includes(bobNote.id), true);
			assert.strictEqual(bobHTL.includes(carolNote.id), false);
		});

		test.concurrent('FTT: リモートユーザーの HTL にはプッシュされない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

			await api('following/create', {
				userId: alice.id,
			}, bob);

			await post(alice, { text: 'I\'m Alice.' });
			await post(bob, { text: 'I\'m Bob.' });

			await waitForPushToTl();

			// NOTE: notes/timeline だと DB へのフォールバックが効くので Redis を直接見て確かめる
			assert.strictEqual(await redisForTimelines.exists(`list:homeTimeline:${bob.id}`), 0);
		});
	});

	describe('Local TL', () => {
		test.concurrent('visibility: home なノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi', visibility: 'home' });
			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('他人の他人への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
		});

		test.concurrent('他人のその人自身への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
		});

		test.concurrent('チャンネル投稿が含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
			const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('リモートユーザーのノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		// 含まれても良いと思うけど実装が面倒なので含まれない
		test.concurrent('フォローしているユーザーの visibility: home なノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: carol.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi', visibility: 'home' });
			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('ミュートしているユーザーのノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('mute/create', { userId: carol.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('フォローしているユーザーが行ったミュートしているユーザーのリノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('mute/create', { userId: carol.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: true でフォローしているユーザーが行ったミュートしているユーザーの投稿への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await api('mute/create', { userId: carol.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: false でフォローしているユーザーからの自分への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('withReplies: false でフォローしていないユーザーからの自分への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('[withReplies: true] 他人の他人への返信が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100, withReplies: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('[withFiles: true] ファイル付きノートのみ含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png');
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { fileIds: [file.id] });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100, withFiles: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
		});
	});

	describe('Social TL', () => {
		test.concurrent('ローカルユーザーのノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('ローカルユーザーの visibility: home なノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('フォローしているローカルユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('withReplies: false でフォローしているユーザーからの自分への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('withReplies: true でフォローしているユーザーの他人の visibility: followers な投稿への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: carol.id }, bob);
			await api('following/create', { userId: bob.id }, alice);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), false);
		});

		test.concurrent('withReplies: true でフォローしているユーザーの行った別のフォローしているユーザーの visibility: followers な投稿への返信が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/create', { userId: carol.id }, alice);
			await api('following/create', { userId: carol.id }, bob);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi', visibility: 'followers' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === carolNote.id), true);
			assert.strictEqual(res.body.find((note: any) => note.id === carolNote.id)?.text, 'hi');
		});

		test.concurrent('withReplies: true でフォローしているユーザーの自分の visibility: followers な投稿への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await api('following/create', { userId: alice.id }, bob);
			await api('following/update', { userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });
			const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some((note: any) => note.id === bobNote.id), true);
			assert.strictEqual(res.body.some((note: any) => note.id === aliceNote.id), true);
		});

		test.concurrent('他人の他人への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
			assert.strictEqual(res.body.some(note => note.id === carolNote.id), true);
		});

		test.concurrent('リモートユーザーのノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('フォローしているリモートユーザーのノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

			await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
			await api('following/create', { userId: bob.id }, alice);

			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('フォローしているリモートユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup({ host: genHost() })]);

			await sendEnvUpdateRequest({ key: 'FORCE_FOLLOW_REMOTE_USER_FOR_TESTING', value: 'true' });
			await api('following/create', { userId: bob.id }, alice);

			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('withReplies: false でフォローしていないユーザーからの自分への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/local-timeline', { limit: 100 }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('[withReplies: true] 他人の他人への返信が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100, withReplies: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('[withFiles: true] ファイル付きノートのみ含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png');
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { fileIds: [file.id] });

			await waitForPushToTl();

			const res = await api('notes/hybrid-timeline', { limit: 100, withFiles: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
		});
	});

	describe('User List TL', () => {
		test.concurrent('リスインしているフォローしていないユーザーのノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('リスインしているフォローしていないユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('リスインしているフォローしていないユーザーの visibility: followers なノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('リスインしているフォローしていないユーザーの他人への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('リスインしているフォローしていないユーザーのユーザー自身への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
		});

		test.concurrent('withReplies: false でリスインしているフォローしていないユーザーからの自分への返信が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await api('users/lists/update-membership', { listId: list.id, userId: bob.id, withReplies: false }, alice);
			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: aliceNote.id });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('withReplies: false でリスインしているフォローしていないユーザーの他人への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await api('users/lists/update-membership', { listId: list.id, userId: bob.id, withReplies: false }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('withReplies: true でリスインしているフォローしていないユーザーの他人への返信が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await api('users/lists/update-membership', { listId: list.id, userId: bob.id, withReplies: true }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('リスインしているフォローしているユーザーの visibility: home なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'home' });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('リスインしているフォローしているユーザーの visibility: followers なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
		});

		test.concurrent('リスインしている自分の visibility: followers なノートが含まれる', async () => {
			const [alice] = await Promise.all([signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: alice.id }, alice);
			await setTimeout(1000);
			const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'hi');
		});

		test.concurrent('リスインしているユーザーのチャンネルノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('[withFiles: true] リスインしているユーザーのファイル付きノートのみ含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png');
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { fileIds: [file.id] });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id, withFiles: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
		});

		test.concurrent('リスインしているユーザーの自身宛ての visibility: specified なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [alice.id] });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
		});

		test.concurrent('リスインしているユーザーの自身宛てではない visibility: specified なノートが含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const list = await api('users/lists/create', { name: 'list' }, alice).then(res => res.body);
			await api('users/lists/push', { listId: list.id, userId: bob.id }, alice);
			await api('users/lists/push', { listId: list.id, userId: carol.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'specified', visibleUserIds: [carol.id] });

			await waitForPushToTl();

			const res = await api('notes/user-list-timeline', { listId: list.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});
	});

	describe('User TL', () => {
		test.concurrent('ノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi' });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('フォローしていないユーザーの visibility: followers なノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('フォローしているユーザーの visibility: followers なノートが含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('following/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote = await post(bob, { text: 'hi', visibility: 'followers' });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === bobNote.id)?.text, 'hi');
		});

		test.concurrent('自身の visibility: followers なノートが含まれる', async () => {
			const [alice] = await Promise.all([signup()]);

			const aliceNote = await post(alice, { text: 'hi', visibility: 'followers' });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: alice.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
			assert.strictEqual(res.body.find(note => note.id === aliceNote.id)?.text, 'hi');
		});

		test.concurrent('チャンネル投稿が含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
			const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('[withReplies: false] 他人への返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi' });
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), false);
		});

		test.concurrent('[withReplies: true] 他人への返信が含まれる', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi' });
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { text: 'hi', replyId: carolNote.id });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id, withReplies: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
		});

		test.concurrent('[withReplies: true] 他人への visibility: specified な返信が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			const carolNote = await post(carol, { text: 'hi' });
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { text: 'hi', replyId: carolNote.id, visibility: 'specified' });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id, withReplies: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), false);
		});

		test.concurrent('[withFiles: true] ファイル付きノートのみ含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const file = await uploadUrl(bob, 'https://raw.githubusercontent.com/misskey-dev/assets/main/public/icon.png');
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { fileIds: [file.id] });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id, withFiles: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), false);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
		});

		test.concurrent('[withChannelNotes: true] チャンネル投稿が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const channel = await api('channels/create', { name: 'channel' }, bob).then(x => x.body);
			const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('[withChannelNotes: true] 他人が取得した場合センシティブチャンネル投稿が含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const channel = await api('channels/create', { name: 'channel', isSensitive: true }, bob).then(x => x.body);
			const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('[withChannelNotes: true] 自分が取得した場合センシティブチャンネル投稿が含まれる', async () => {
			const [bob] = await Promise.all([signup()]);

			const channel = await api('channels/create', { name: 'channel', isSensitive: true }, bob).then(x => x.body);
			const bobNote = await post(bob, { text: 'hi', channelId: channel.id });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id, withChannelNotes: true }, bob);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), true);
		});

		test.concurrent('ミュートしているユーザーに関連する投稿が含まれない', async () => {
			const [alice, bob, carol] = await Promise.all([signup(), signup(), signup()]);

			await api('mute/create', { userId: carol.id }, alice);
			await setTimeout(1000);
			const carolNote = await post(carol, { text: 'hi' });
			const bobNote = await post(bob, { text: 'hi', renoteId: carolNote.id });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		test.concurrent('ミュートしていても userId に指定したユーザーの投稿が含まれる', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			await api('mute/create', { userId: bob.id }, alice);
			await setTimeout(1000);
			const bobNote1 = await post(bob, { text: 'hi' });
			const bobNote2 = await post(bob, { text: 'hi', replyId: bobNote1.id });
			const bobNote3 = await post(bob, { text: 'hi', renoteId: bobNote1.id });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote1.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote2.id), true);
			assert.strictEqual(res.body.some(note => note.id === bobNote3.id), true);
		});

		test.concurrent('自身の visibility: specified なノートが含まれる', async () => {
			const [alice] = await Promise.all([signup()]);

			const aliceNote = await post(alice, { text: 'hi', visibility: 'specified' });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: alice.id, withReplies: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === aliceNote.id), true);
		});

		test.concurrent('visibleUserIds に指定されてない visibility: specified なノートが含まれない', async () => {
			const [alice, bob] = await Promise.all([signup(), signup()]);

			const bobNote = await post(bob, { text: 'hi', visibility: 'specified' });

			await waitForPushToTl();

			const res = await api('users/notes', { userId: bob.id, withReplies: true }, alice);

			assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		});

		/** @see https://github.com/misskey-dev/misskey/issues/14000 */
		test.concurrent('FTT: sinceId にキャッシュより古いノートを指定しても、sinceId による絞り込みが正しく動作する', async () => {
			const alice = await signup();
			const noteSince = await post(alice, { text: 'Note where id will be `sinceId`.' });
			const note1 = await post(alice, { text: '1' });
			const note2 = await post(alice, { text: '2' });
			await redisForTimelines.del('list:userTimeline:' + alice.id);
			const note3 = await post(alice, { text: '3' });

			const res = await api('users/notes', { userId: alice.id, sinceId: noteSince.id });
			assert.deepStrictEqual(res.body, [note1, note2, note3]);
		});

		test.concurrent('FTT: sinceId にキャッシュより古いノートを指定しても、sinceId と untilId による絞り込みが正しく動作する', async () => {
			const alice = await signup();
			const noteSince = await post(alice, { text: 'Note where id will be `sinceId`.' });
			const note1 = await post(alice, { text: '1' });
			const note2 = await post(alice, { text: '2' });
			await redisForTimelines.del('list:userTimeline:' + alice.id);
			const note3 = await post(alice, { text: '3' });
			const noteUntil = await post(alice, { text: 'Note where id will be `untilId`.' });
			await post(alice, { text: '4' });

			const res = await api('users/notes', { userId: alice.id, sinceId: noteSince.id, untilId: noteUntil.id });
			assert.deepStrictEqual(res.body, [note3, note2, note1]);
		});
	});

	// TODO: リノートミュート済みユーザーのテスト
	// TODO: ページネーションのテスト
});
