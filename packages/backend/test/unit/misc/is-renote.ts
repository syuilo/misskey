/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isQuote, isRenote } from '@/misc/is-renote.js';
import { MiNote } from '@/models/Note.js';

const base: MiNote = {
	id: 'some-note-id',
	replyId: null,
	reply: null,
	renoteId: null,
	renote: null,
	threadId: null,
	text: null,
	name: null,
	cw: null,
	userId: 'some-user-id',
	user: null,
	localOnly: false,
	reactionAcceptance: null,
	renoteCount: 0,
	repliesCount: 0,
	clippedCount: 0,
	reactions: {},
	visibility: 'public',
	uri: null,
	url: null,
	fileIds: [],
	attachedFileTypes: [],
	visibleUserIds: [],
	mentions: [],
	mentionedRemoteUsers: '',
	reactionAndUserPairCache: [],
	emojis: [],
	tags: [],
	hasPoll: false,
	channelId: null,
	channel: null,
	userHost: null,
	replyUserId: null,
	replyUserHost: null,
	renoteUserId: null,
	renoteUserHost: null,
	renoteChannelId: null,
};

describe('misc:is-renote', () => {
	test('note without renoteId should not be Renote', () => {
		expect(isRenote(base)).toBe(false);
	});

	test('note with renoteId should be Renote and not be Quote', () => {
		const note: MiNote = { ...base, renoteId: 'some-renote-id' };
		expect(isRenote(note)).toBe(true);
		expect(isQuote(note as any)).toBe(false);
	});

	test('note with renoteId and text should be Quote', () => {
		const note: MiNote = { ...base, renoteId: 'some-renote-id', text: 'some-text' };
		expect(isRenote(note)).toBe(true);
		expect(isQuote(note as any)).toBe(true);
	});

	test('note with renoteId and cw should be Quote', () => {
		const note: MiNote = { ...base, renoteId: 'some-renote-id', cw: 'some-cw' };
		expect(isRenote(note)).toBe(true);
		expect(isQuote(note as any)).toBe(true);
	});

	test('note with renoteId and replyId should be Quote', () => {
		const note: MiNote = { ...base, renoteId: 'some-renote-id', replyId: 'some-reply-id' };
		expect(isRenote(note)).toBe(true);
		expect(isQuote(note as any)).toBe(true);
	});

	test('note with renoteId and poll should be Quote', () => {
		const note: MiNote = { ...base, renoteId: 'some-renote-id', hasPoll: true };
		expect(isRenote(note)).toBe(true);
		expect(isQuote(note as any)).toBe(true);
	});

	test('note with renoteId and non-empty fileIds should be Quote', () => {
		const note: MiNote = { ...base, renoteId: 'some-renote-id', fileIds: ['some-file-id'] };
		expect(isRenote(note)).toBe(true);
		expect(isQuote(note as any)).toBe(true);
	});
});
