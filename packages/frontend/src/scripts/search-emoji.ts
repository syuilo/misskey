/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type EmojiDef = {
	emoji: string;
	name: string;
	url: string;
	aliasOf?: string;
} | {
	emoji: string;
	name: string;
	aliasOf?: string;
	isCustomEmoji?: true;
};
type EmojiScore = { emoji: EmojiDef, score: number };

export function searchEmoji(query: string | null, emojiDb: EmojiDef[], max = 30): EmojiDef[] {
	if (!query) {
		return [];
	}

	const matched = new Map<string, EmojiScore>();
	// 完全一致（エイリアスなし）
	emojiDb.some(x => {
		if (x.name === query && !x.aliasOf) {
			matched.set(x.emoji, { emoji: x, score: query.length + 3 });
		}
		return matched.size === max;
	});

	// 完全一致（エイリアス込み）
	if (matched.size < max) {
		emojiDb.some(x => {
			if (x.name === query && !matched.has(x.emoji)) {
				matched.set(x.emoji, { emoji: x, score: query.length + 2 });
			}
			return matched.size === max;
		});
	}

	// 前方一致（エイリアスなし）
	if (matched.size < max) {
		emojiDb.some(x => {
			if (x.name.startsWith(query) && !x.aliasOf && !matched.has(x.emoji)) {
				matched.set(x.emoji, { emoji: x, score: query.length + 1 });
			}
			return matched.size === max;
		});
	}

	// 前方一致（エイリアス込み）
	if (matched.size < max) {
		emojiDb.some(x => {
			if (x.name.startsWith(query) && !matched.has(x.emoji)) {
				matched.set(x.emoji, { emoji: x, score: query.length });
			}
			return matched.size === max;
		});
	}

	// 部分一致（エイリアス込み）
	if (matched.size < max) {
		emojiDb.some(x => {
			if (x.name.includes(query) && !matched.has(x.emoji)) {
				matched.set(x.emoji, { emoji: x, score: query.length - 1 });
			}
			return matched.size === max;
		});
	}

	// 簡易あいまい検索（3文字以上）
	if (matched.size < max && query.length > 3) {
		const queryChars = [...query];
		const hitEmojis = new Map<string, EmojiScore>();

		for (const x of emojiDb) {
			// 文字列の位置を進めながら、クエリの文字を順番に探す

			let pos = 0;
			let hit = 0;
			for (const c of queryChars) {
				pos = x.name.indexOf(c, pos);
				if (pos <= -1) break;
				hit++;
			}

			// 半分以上の文字が含まれていればヒットとする
			if (hit > Math.ceil(queryChars.length / 2) && hit - 2 > (matched.get(x.emoji)?.score ?? 0)) {
				hitEmojis.set(x.emoji, { emoji: x, score: hit - 2 });
			}
		}

		// ヒットしたものを全部追加すると雑多になるので、先頭の6件程度だけにしておく（6件＝オートコンプリートのポップアップのサイズ分）
		[...hitEmojis.values()]
			.sort((x, y) => y.score - x.score)
			.slice(0, 6)
			.forEach(it => matched.set(it.emoji.name, it));
	}

	return [...matched.values()]
		.sort((x, y) => y.score - x.score)
		.slice(0, max)
		.map(it => it.emoji);
}
