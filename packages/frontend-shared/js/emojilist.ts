/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const unicodeEmojiCategories = ['face', 'people', 'animals_and_nature', 'food_and_drink', 'activity', 'travel_and_places', 'objects', 'symbols', 'flags'] as const;

export type UnicodeEmojiDef = {
	name: string;
	char: string;
	category: typeof unicodeEmojiCategories[number];
};

// initial converted from https://github.com/muan/emojilib/commit/242fe68be86ed6536843b83f7e32f376468b38fb
import _emojilist from './emojilist.json';

export const emojilist: UnicodeEmojiDef[] = _emojilist.map(x => ({
	name: x[1] as string,
	char: x[0] as string,
	category: unicodeEmojiCategories[x[2] as number],
}));

const unicodeEmojisMap = new Map<string, UnicodeEmojiDef>(
	emojilist.map(x => [x.char, x]),
);

const _indexByChar = new Map<string, number>();
const _charGroupByCategory = new Map<string, string[]>();
for (let i = 0; i < emojilist.length; i++) {
	const emo = emojilist[i];
	_indexByChar.set(emo.char, i);

	if (_charGroupByCategory.has(emo.category)) {
		_charGroupByCategory.get(emo.category)?.push(emo.char);
	} else {
		_charGroupByCategory.set(emo.category, [emo.char]);
	}
}

export const emojiCharByCategory = _charGroupByCategory;

export function getUnicodeEmoji(char: string): UnicodeEmojiDef | string {
	// Colorize it because emojilist.json assumes that
	return unicodeEmojisMap.get(colorizeEmoji(char))
		// カラースタイル絵文字がjsonに無い場合はテキストスタイル絵文字にフォールバックする
		?? unicodeEmojisMap.get(char)
		// それでも見つからない場合はそのまま返す（絵文字情報がjsonに無い場合、このフォールバックが無いとレンダリングに失敗する）
		?? char;
}

export function getEmojiName(char: string): string {
	// Colorize it because emojilist.json assumes that
	const idx = _indexByChar.get(colorizeEmoji(char)) ?? _indexByChar.get(char);
	if (idx === undefined) {
		// 絵文字情報がjsonに無い場合は名前の取得が出来ないのでそのまま返すしか無い
		return char;
	} else {
		return emojilist[idx].name;
	}
}

/**
 * テキストスタイル絵文字（U+260Eなどの1文字で表現される絵文字）をカラースタイル絵文字に変換します（VS16:U+FE0Fを付与）。
 */
export function colorizeEmoji(char: string) {
	return char.length === 1 ? `${char}\uFE0F` : char;
}

export interface CustomEmojiFolderTree {
	value: string;
	category: string;
	children: CustomEmojiFolderTree[];
}
