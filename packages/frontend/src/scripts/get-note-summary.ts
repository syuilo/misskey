/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';

/**
 * 投稿を表す文字列を取得します。
 * @param {*} note (packされた)投稿
 */
export const getNoteSummary = (note?: Misskey.entities.Note | Misskey.entities.NoteDraft | null, opts?: {
	/**
	 * ファイルの数を表示するかどうか
	 */
	showFiles?: boolean;
	/**
	 * 投票の有無を表示するかどうか
	 */
	showPoll?: boolean;
	/**
	 * 返信の有無を表示するかどうか
	 */
	showReply?: boolean;
	/**
	 * Renoteの有無を表示するかどうか
	 */
	showRenote?: boolean;
}): string => {
	const _opts = Object.assign({
		showFiles: true,
		showPoll: true,
		showReply: true,
		showRenote: true,
	}, opts);

	if (note == null) {
		return '';
	}

	if ('deletedAt' in note && note.deletedAt) {
		return `(${i18n.ts.deletedNote})`;
	}

	if ('isHidden' in note && note.isHidden) {
		return `(${i18n.ts.invisibleNote})`;
	}

	let summary = '';

	// 本文
	if (note.cw != null) {
		summary += note.cw;
	} else {
		summary += note.text ? note.text : '';
	}

	// ファイルが添付されているとき
	if (_opts.showFiles && (note.files || []).length !== 0) {
		summary += ` (${i18n.tsx.withNFiles({ n: note.files!.length })})`;
	}

	// 投票が添付されているとき
	if (_opts.showPoll && note.poll) {
		summary += ` (${i18n.ts.poll})`;
	}

	// 返信のとき
	if (_opts.showReply && note.replyId) {
		if (note.reply) {
			summary += `\n\nRE: ${getNoteSummary(note.reply)}`;
		} else {
			summary += '\n\nRE: ...';
		}
	}

	// Renoteのとき
	if (_opts.showRenote && note.renoteId) {
		if (note.renote) {
			summary += `\n\nRN: ${getNoteSummary(note.renote)}`;
		} else {
			summary += '\n\nRN: ...';
		}
	}

	return summary.trim();
};
