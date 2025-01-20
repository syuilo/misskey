/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MiNote } from '@/models/Note.js';
import { Packed } from '@/misc/json-schema.js';

/**
 * {@link note}が{@link channelIds}のチャンネルに関連するかどうかを判定し、関連する場合はtrueを返します。
 * 関連するというのは、{@link channelIds}のチャンネルに向けての投稿であるか、またはそのチャンネルの投稿をリノート・引用リノートした投稿であるかを指します。
 *
 * @param note 確認対象のノート
 * @param channelIds 確認対象のチャンネルID一覧
 */
export function isChannelRelated(note: MiNote | Packed<'Note'>, channelIds: Set<string>): boolean {
	if (note.channelId && channelIds.has(note.channelId)) {
		return true;
	}

	if (note.renote != null && note.renote.channelId && channelIds.has(note.renote.channelId)) {
		return true;
	}

	// NOTE: リプライはchannelIdのチェックだけでOKなはずなので見てない(チャンネルのノートにチャンネル外からのリプライまたはその逆はないはずなので）

	return false;
}
