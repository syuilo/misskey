/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { setTimeout } from 'node:timers/promises';
import { api, connectStream, post, signup, react } from '../utils.js';
import type * as misskey from 'misskey-js';

function waitForPushToNotification() {
	return setTimeout(500);
}

describe('Note thread mute', () => {
	let alice: misskey.entities.SignupResponse;
	let bob: misskey.entities.SignupResponse;
	let carol: misskey.entities.SignupResponse;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		bob = await signup({ username: 'bob' });
		carol = await signup({ username: 'carol' });
	}, 1000 * 60 * 2);

	test('notes/mentions にミュートしているスレッドの投稿が含まれない', async () => {
		const bobNote = await post(bob, { text: '@alice @carol root note' });
		const aliceReply = await post(alice, { replyId: bobNote.id, text: '@bob @carol child note' });

		await api('notes/thread-muting/create', { noteId: bobNote.id }, alice);

		const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });
		const carolReplyWithoutMention = await post(carol, { replyId: aliceReply.id, text: 'child note' });

		await waitForPushToNotification();

		const res = await api('notes/mentions', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some(note => note.id === bobNote.id), false);
		assert.strictEqual(res.body.some(note => note.id === carolReply.id), false);
		assert.strictEqual(res.body.some(note => note.id === carolReplyWithoutMention.id), false);
	});

	test('ミュートしているスレッドからメンションされても、hasUnreadMentions が true にならない', async () => {
		// 状態リセット
		await api('i/read-all-unread-notes', {}, alice);

		const bobNote = await post(bob, { text: '@alice @carol root note' });

		await api('notes/thread-muting/create', { noteId: bobNote.id }, alice);

		const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });

		await waitForPushToNotification();

		const res = await api('i', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(res.body.hasUnreadMentions, false);
	});

	test('ミュートしているスレッドからメンションされても、ストリームに unreadMention イベントが流れてこない', async () => {
		// 状態リセット
		await api('i/read-all-unread-notes', {}, alice);

		const bobNote = await post(bob, { text: '@alice @carol root note' });

		await api('notes/thread-muting/create', { noteId: bobNote.id }, alice);

		let fired = false;

		const ws = await connectStream(alice, 'main', async ({ type, body }) => {
			if (type === 'unreadMention') {
				if (body === bobNote.id) fired = true;
			}
		});

		const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });

		await setTimeout(5000);

		assert.strictEqual(fired, false);
		ws.close();
	});

	test('i/notifications にミュートしているスレッドの通知(メンション, リプライ, リノート, 引用リノート, リアクション)が含まれない', async () => {
		const bobNote = await post(bob, { text: '@alice @carol root note' });
		const aliceReply = await post(alice, { replyId: bobNote.id, text: '@bob @carol child note' });

		await api('notes/thread-muting/create', { noteId: bobNote.id }, alice);

		const carolReply = await post(carol, { replyId: bobNote.id, text: '@bob @alice child note' });
		const carolReplyWithoutMention = await post(carol, { replyId: aliceReply.id, text: 'child note' });
		const carolRenote = await post(carol, { renoteId: aliceReply.id });
		const carolQuote = await post(carol, { renoteId: aliceReply.id, text: 'quote note' });
		await react(carol, aliceReply, 'like'); // react method returns nothing.

		await waitForPushToNotification();

		const res = await api('i/notifications', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some(notification => 'note' in notification && notification.note.id === carolReply.id), false);
		assert.strictEqual(res.body.some(notification => 'note' in notification && notification.note.id === carolReplyWithoutMention.id), false);
		assert.strictEqual(res.body.some(notification => 'note' in notification && notification.note.id === carolRenote.id), false);
		assert.strictEqual(res.body.some(notification => 'note' in notification && notification.note.id === carolQuote.id), false);
		assert.strictEqual(res.body.some(notification => 'userId' in notification && notification.userId === carol.id), false);

		// NOTE: bobの投稿はスレッドミュート前に行われたため通知に含まれていてもよい
	});

	test('ミュートしているスレッドへのリプライで、ミュートしていないスレッドのノートが引用されても i/notifications に通知が含まれない', async () => {
		const bobNote = await post(bob, { text: '@alice @carol root note' });
		const aliceReply = await post(alice, { replyId: bobNote.id, text: '@bob @carol child note' });
		const aliceNote = await post(alice, { text: 'another root note' });

		await api('notes/thread-muting/create', { noteId: bobNote.id }, alice);

		const carolReplyWithQuotingAnother = await post(carol, { replyId: aliceReply.id, renoteId: aliceNote.id, text: 'child note with quoting another note' });

		await waitForPushToNotification();

		const res = await api('i/notifications', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some(notification => 'note' in notification && notification.note.id === carolReplyWithQuotingAnother.id), false);
	});

	test('ミュートしていないスレッドでのメンション付きノートまたはリプライで、ミュートしているスレッドのノートが引用された場合は i/notifications に通知が含まれる', async () => {
		const bobNote = await post(bob, { text: '@alice @carol root note' });
		const aliceReply = await post(alice, { replyId: bobNote.id, text: '@bob @carol child note' });
		const aliceNote = await post(alice, { text: 'another root note' });

		await api('notes/thread-muting/create', { noteId: bobNote.id }, alice);

		const carolMentionWithQuotingMuted = await post(carol, { renoteId: aliceReply.id, text: '@alice another root note with quoting muted note' });
		const carolReplyWithQuotingMuted = await post(carol, { replyId: aliceNote.id, renoteId: aliceReply.id, text: 'another child note with quoting muted note' });

		await waitForPushToNotification();

		const res = await api('i/notifications', {}, alice);

		assert.strictEqual(res.status, 200);
		assert.strictEqual(Array.isArray(res.body), true);
		assert.strictEqual(res.body.some(notification => 'note' in notification && notification.note.id === carolMentionWithQuotingMuted.id), true);
		assert.strictEqual(res.body.some(notification => 'note' in notification && notification.note.id === carolReplyWithQuotingMuted.id), true);
	});
});
