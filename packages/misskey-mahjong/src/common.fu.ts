/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FourMentsuOneJyantou, mentsuEquals, TILE_NUMBER_MAP, TileType } from "./common.js";

export type Shape = 'fourMentsuOneJyantou' | 'chitoitsu' | 'kokushi';

/**
 * 4面子1雀頭と待ちに関わる部分
 */
export type FourMentsuOneJyantouWithWait = FourMentsuOneJyantou & {
	agariTile: TileType;
} & ({
	waitedFor: 'head';
} | {
	waitedFor: 'mentsu';
	waitedTaatsu: [TileType, TileType];
});

export function calcWaitPatterns(fourMentsuOneJyantou: FourMentsuOneJyantou | null, agariTile: TileType): FourMentsuOneJyantouWithWait[] | [null] {
	if (fourMentsuOneJyantou == null) return [null];

	const result: FourMentsuOneJyantouWithWait[] = [];

	if (fourMentsuOneJyantou.head == agariTile) {
		result.push({
			head: fourMentsuOneJyantou.head,
			mentsus: fourMentsuOneJyantou.mentsus,
			waitedFor: 'head',
			agariTile,
		});
	}

	const checkedMentsus: [TileType, TileType, TileType][] = [];
	for (const mentsu of fourMentsuOneJyantou.mentsus) {
		if (checkedMentsus.some(checkedMentsu => mentsuEquals(mentsu, checkedMentsu))) continue;
		const agariTileIndex = mentsu.indexOf(agariTile);
		if (agariTileIndex < 0) continue;
		result.push({
			head: fourMentsuOneJyantou.head,
			mentsus: fourMentsuOneJyantou.mentsus,
			waitedFor: 'mentsu',
			agariTile,
			waitedTaatsu: mentsu.toSpliced(agariTileIndex, 1) as [TileType, TileType],
		})
		checkedMentsus.push(mentsu);
	}

	return result;
}

export function isRyanmen(taatsu: [TileType, TileType]): boolean {
	const number1 = TILE_NUMBER_MAP[taatsu[0]];
	const number2 = TILE_NUMBER_MAP[taatsu[1]];
	if (number1 == null || number2 == null) return false;
	return number1 != 1 && number2 != 9 && number1 + 1 == number2;
}

export function isToitsu(taatsu: [TileType, TileType]): boolean {
	return taatsu[0] == taatsu[1];
}
