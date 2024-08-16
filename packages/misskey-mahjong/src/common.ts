/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// NOTE: アガリ形の判定に使われるため並び順が重要
// 具体的には、文字列としてソートした際に同じ牌種の1~9が順に並んでいる必要がある
// また、字牌は最後にある必要がある
export const TILE_TYPES = [
	'm1',
	'm2',
	'm3',
	'm4',
	'm5',
	'm6',
	'm7',
	'm8',
	'm9',
	'p1',
	'p2',
	'p3',
	'p4',
	'p5',
	'p6',
	'p7',
	'p8',
	'p9',
	's1',
	's2',
	's3',
	's4',
	's5',
	's6',
	's7',
	's8',
	's9',
	'e',
	's',
	'w',
	'n',
	'haku',
	'hatsu',
	'chun',
] as const;

export type TileType = typeof TILE_TYPES[number];

export type TileInstance = {
	t: TileType;
	red?: boolean;
};

export type TileId = number;

// NOTE: 0 は"不明"(他プレイヤーの手牌など)を表すものとして予約されている
export const TILE_ID_MAP = new Map<TileId, TileInstance>([
	/* eslint-disable no-multi-spaces */
	[1,   { t: 'm1' }],    [2,   { t: 'm1' }],    [3,   { t: 'm1' }],    [4,   { t: 'm1' }],
	[5,   { t: 'm2' }],    [6,   { t: 'm2' }],    [7,   { t: 'm2' }],    [8,   { t: 'm2' }],
	[9,   { t: 'm3' }],    [10,  { t: 'm3' }],    [11,  { t: 'm3' }],    [12,  { t: 'm3' }],
	[13,  { t: 'm4' }],    [14,  { t: 'm4' }],    [15,  { t: 'm4' }],    [16,  { t: 'm4' }],
	[17,  { t: 'm5' }],    [18,  { t: 'm5' }],    [19,  { t: 'm5' }],    [20,  { t: 'm5', red: true }],
	[21,  { t: 'm6' }],    [22,  { t: 'm6' }],    [23,  { t: 'm6' }],    [24,  { t: 'm6' }],
	[25,  { t: 'm7' }],    [26,  { t: 'm7' }],    [27,  { t: 'm7' }],    [28,  { t: 'm7' }],
	[29,  { t: 'm8' }],    [30,  { t: 'm8' }],    [31,  { t: 'm8' }],    [32,  { t: 'm8' }],
	[33,  { t: 'm9' }],    [34,  { t: 'm9' }],    [35,  { t: 'm9' }],    [36,  { t: 'm9' }],
	[37,  { t: 'p1' }],    [38,  { t: 'p1' }],    [39,  { t: 'p1' }],    [40,  { t: 'p1' }],
	[41,  { t: 'p2' }],    [42,  { t: 'p2' }],    [43,  { t: 'p2' }],    [44,  { t: 'p2' }],
	[45,  { t: 'p3' }],    [46,  { t: 'p3' }],    [47,  { t: 'p3' }],    [48,  { t: 'p3' }],
	[49,  { t: 'p4' }],    [50,  { t: 'p4' }],    [51,  { t: 'p4' }],    [52,  { t: 'p4' }],
	[53,  { t: 'p5' }],    [54,  { t: 'p5' }],    [55,  { t: 'p5' }],    [56,  { t: 'p5', red: true }],
	[57,  { t: 'p6' }],    [58,  { t: 'p6' }],    [59,  { t: 'p6' }],    [60,  { t: 'p6' }],
	[61,  { t: 'p7' }],    [62,  { t: 'p7' }],    [63,  { t: 'p7' }],    [64,  { t: 'p7' }],
	[65,  { t: 'p8' }],    [66,  { t: 'p8' }],    [67,  { t: 'p8' }],    [68,  { t: 'p8' }],
	[69,  { t: 'p9' }],    [70,  { t: 'p9' }],    [71,  { t: 'p9' }],    [72,  { t: 'p9' }],
	[73,  { t: 's1' }],    [74,  { t: 's1' }],    [75,  { t: 's1' }],    [76,  { t: 's1' }],
	[77,  { t: 's2' }],    [78,  { t: 's2' }],    [79,  { t: 's2' }],    [80,  { t: 's2' }],
	[81,  { t: 's3' }],    [82,  { t: 's3' }],    [83,  { t: 's3' }],    [84,  { t: 's3' }],
	[85,  { t: 's4' }],    [86,  { t: 's4' }],    [87,  { t: 's4' }],    [88,  { t: 's4' }],
	[89,  { t: 's5' }],    [90,  { t: 's5' }],    [91,  { t: 's5' }],    [92,  { t: 's5', red: true }],
	[93,  { t: 's6' }],    [94,  { t: 's6' }],    [95,  { t: 's6' }],    [96,  { t: 's6' }],
	[97,  { t: 's7' }],    [98,  { t: 's7' }],    [99,  { t: 's7' }],    [100, { t: 's7' }],
	[101, { t: 's8' }],    [102, { t: 's8' }],    [103, { t: 's8' }],    [104, { t: 's8' }],
	[105, { t: 's9' }],    [106, { t: 's9' }],    [107, { t: 's9' }],    [108, { t: 's9' }],
	[109, { t: 'e' }],     [110, { t: 'e' }],     [111, { t: 'e' }],     [112, { t: 'e' }],
	[113, { t: 's' }],     [114, { t: 's' }],     [115, { t: 's' }],     [116, { t: 's' }],
	[117, { t: 'w' }],     [118, { t: 'w' }],     [119, { t: 'w' }],     [120, { t: 'w' }],
	[121, { t: 'n' }],     [122, { t: 'n' }],     [123, { t: 'n' }],     [124, { t: 'n' }],
	[125, { t: 'haku' }],  [126, { t: 'haku' }],  [127, { t: 'haku' }],  [128, { t: 'haku' }],
	[129, { t: 'hatsu' }], [130, { t: 'hatsu' }], [131, { t: 'hatsu' }], [132, { t: 'hatsu' }],
	[133, { t: 'chun' }],  [134, { t: 'chun' }],  [135, { t: 'chun' }],  [136, { t: 'chun' }],
	/* eslint-enable no-multi-spaces */
]);

export function findTileByIdOrFail(tid: TileId): TileInstance {
	const tile = TILE_ID_MAP.get(tid);
	if (tile == null) throw new Error(`tile not found: ${tid}`);
	return tile;
}

export function findTileById(tid: TileId): TileInstance | null {
	return TILE_ID_MAP.get(tid) ?? null;
}

export type House = 'e' | 's' | 'w' | 'n';

/**
 * 暗槓を含む
 */
export type Huro = {
	type: 'pon';
	tiles: readonly [TileId, TileId, TileId];
	from: House;
} | {
	type: 'cii';
	tiles: readonly [TileId, TileId, TileId];
	from: House;
} | {
	type: 'ankan';
	tiles: readonly [TileId, TileId, TileId, TileId];
} | {
	type: 'minkan';
	tiles: readonly [TileId, TileId, TileId, TileId];
	from: House | null; // null で加槓
};

export type PointFactor = {
	isYakuman: false;
	fan: number;
} | {
	isYakuman: true;
	value: number;
}

export const CALL_HURO_TYPES = ['pon', 'cii', 'minkan'] as const;

export const NEXT_TILE_FOR_DORA_MAP: Record<TileType, TileType> = {
	m1: 'm2',
	m2: 'm3',
	m3: 'm4',
	m4: 'm5',
	m5: 'm6',
	m6: 'm7',
	m7: 'm8',
	m8: 'm9',
	m9: 'm1',
	p1: 'p2',
	p2: 'p3',
	p3: 'p4',
	p4: 'p5',
	p5: 'p6',
	p6: 'p7',
	p7: 'p8',
	p8: 'p9',
	p9: 'p1',
	s1: 's2',
	s2: 's3',
	s3: 's4',
	s4: 's5',
	s5: 's6',
	s6: 's7',
	s7: 's8',
	s8: 's9',
	s9: 's1',
	e: 's',
	s: 'w',
	w: 'n',
	n: 'e',
	haku: 'hatsu',
	hatsu: 'chun',
	chun: 'haku',
};

export const NEXT_TILE_FOR_SHUNTSU: Record<TileType, TileType | null> = {
	m1: 'm2',
	m2: 'm3',
	m3: 'm4',
	m4: 'm5',
	m5: 'm6',
	m6: 'm7',
	m7: 'm8',
	m8: 'm9',
	m9: null,
	p1: 'p2',
	p2: 'p3',
	p3: 'p4',
	p4: 'p5',
	p5: 'p6',
	p6: 'p7',
	p7: 'p8',
	p8: 'p9',
	p9: null,
	s1: 's2',
	s2: 's3',
	s3: 's4',
	s4: 's5',
	s5: 's6',
	s6: 's7',
	s7: 's8',
	s8: 's9',
	s9: null,
	e: null,
	s: null,
	w: null,
	n: null,
	haku: null,
	hatsu: null,
	chun: null,
};

export const PREV_TILE_FOR_SHUNTSU: Record<TileType, TileType | null> = {
	m1: null,
	m2: 'm1',
	m3: 'm2',
	m4: 'm3',
	m5: 'm4',
	m6: 'm5',
	m7: 'm6',
	m8: 'm7',
	m9: 'm8',
	p1: null,
	p2: 'p1',
	p3: 'p2',
	p4: 'p3',
	p5: 'p4',
	p6: 'p5',
	p7: 'p6',
	p8: 'p7',
	p9: 'p8',
	s1: null,
	s2: 's1',
	s3: 's2',
	s4: 's3',
	s5: 's4',
	s6: 's5',
	s7: 's6',
	s8: 's7',
	s9: 's8',
	e: null,
	s: null,
	w: null,
	n: null,
	haku: null,
	hatsu: null,
	chun: null,
};

export const TILE_NUMBER_MAP: Record<TileType, number | null> = {
	m1: 1,
	m2: 2,
	m3: 3,
	m4: 4,
	m5: 5,
	m6: 6,
	m7: 7,
	m8: 8,
	m9: 9,
	p1: 1,
	p2: 2,
	p3: 3,
	p4: 4,
	p5: 5,
	p6: 6,
	p7: 7,
	p8: 8,
	p9: 9,
	s1: 1,
	s2: 2,
	s3: 3,
	s4: 4,
	s5: 5,
	s6: 6,
	s7: 7,
	s8: 8,
	s9: 9,
	e: null,
	s: null,
	w: null,
	n: null,
	haku: null,
	hatsu: null,
	chun: null,
};

export const MANZU_TILES = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'] as const satisfies TileType[];
export const PINZU_TILES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'] as const satisfies TileType[];
export const SOUZU_TILES = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'] as const satisfies TileType[];
export const CHAR_TILES = ['e', 's', 'w', 'n', 'haku', 'hatsu', 'chun'] as const satisfies TileType[];
export const YAOCHU_TILES = ['m1', 'm9', 'p1', 'p9', 's1', 's9', 'e', 's', 'w', 'n', 'haku', 'hatsu', 'chun'] as const satisfies TileType[];
export const TERMINAL_TILES = ['m1', 'm9', 'p1', 'p9', 's1', 's9'] as const satisfies TileType[];
const KOKUSHI_TILES: TileType[] = ['m1', 'm9', 'p1', 'p9', 's1', 's9', 'e', 's', 'w', 'n', 'haku', 'hatsu', 'chun'];

export function includes<A extends ReadonlyArray<unknown>>(array: A, searchElement: unknown): searchElement is A[number] {
	return array.includes(searchElement);
}

export function isManzu(tile: TileType): tile is typeof MANZU_TILES[number] {
	return includes(MANZU_TILES, tile);
}

export function isPinzu(tile: TileType): tile is typeof PINZU_TILES[number] {
	return includes(PINZU_TILES, tile);
}

export function isSouzu(tile: TileType): tile is typeof SOUZU_TILES[number] {
	return includes(SOUZU_TILES, tile);
}

export function isSameNumberTile(a: TileType, b: TileType): boolean {
	const aNumber = TILE_NUMBER_MAP[a];
	const bNumber = TILE_NUMBER_MAP[b];
	if (aNumber == null || bNumber == null) return false;
	return aNumber === bNumber;
}

export function fanToPoint(fan: number, isParent: boolean): number {
	let point;

	if (fan >= 13) {
		point = 32000;
	} else if (fan >= 11) {
		point = 24000;
	} else if (fan >= 8) {
		point = 16000;
	} else if (fan >= 6) {
		point = 12000;
	} else if (fan >= 4) {
		point = 8000;
	} else if (fan >= 3) {
		point = 4000;
	} else if (fan >= 2) {
		point = 2000;
	} else {
		point = 1000;
	}

	if (isParent) {
		point *= 1.5;
	}

	return point;
}

export function calcPoint(factor: PointFactor, isParent: boolean): number {
	if (factor.isYakuman) {
		return 32000 * factor.value * (isParent ? 1.5 : 1);
	} else {
		return fanToPoint(factor.fan, isParent);
	}
}

export function calcOwnedDoraCount(handTiles: TileType[], huros: Huro[], doras: TileType[]): number {
	let count = 0;
	for (const t of handTiles) {
		if (doras.includes(t)) count++;
	}
	for (const huro of huros) {
		if (huro.type === 'pon' && includes(doras, huro.tiles[0])) count += 3;
		if (huro.type === 'cii') count += huro.tiles.filter(t => includes(doras, t)).length;
		if (huro.type === 'minkan' && includes(doras, huro.tiles[0])) count += 4;
		if (huro.type === 'ankan' && includes(doras, huro.tiles[0])) count += 4;
	}
	return count;
}

export function calcRedDoraCount(handTiles: TileId[], huros: Huro[]): number {
	let count = 0;
	for (const t of handTiles) {
		if (findTileByIdOrFail(t).red) count++;
	}
	for (const huro of huros) {
		for (const t of huro.tiles) {
			if (findTileByIdOrFail(t).red) count++;
		}
	}
	return count;
}

export function calcTsumoHoraPointDeltas(house: House, fansOrFactor: number | PointFactor): Record<House, number> {
	const isParent = house === 'e';

	const deltas: Record<House, number> = {
		e: 0,
		s: 0,
		w: 0,
		n: 0,
	};

	const point = typeof fansOrFactor == 'number' ? fanToPoint(fansOrFactor, isParent) : calcPoint(fansOrFactor, isParent);
	deltas[house] = point;
	if (isParent) {
		const childPoint = Math.ceil(point / 3);
		deltas.s = -childPoint;
		deltas.w = -childPoint;
		deltas.n = -childPoint;
	} else {
		const parentPoint = Math.ceil(point / 2);
		deltas.e = -parentPoint;
		const otherPoint = Math.ceil(point / 4);
		if (house === 's') {
			deltas.w = -otherPoint;
			deltas.n = -otherPoint;
		} else if (house === 'w') {
			deltas.s = -otherPoint;
			deltas.n = -otherPoint;
		} else if (house === 'n') {
			deltas.s = -otherPoint;
			deltas.w = -otherPoint;
		}
	}

	return deltas;
}

export function isTile(tile: string): tile is TileType {
	return TILE_TYPES.includes(tile as TileType);
}

export function sortTiles(tiles: TileId[]): TileId[] {
	return tiles.toSorted((a, b) => {
		return a - b;
	});
}

export function sortTileTypes(tiles: TileType[]): TileType[] {
	return tiles.toSorted((a, b) => {
		const aIndex = TILE_TYPES.indexOf(a);
		const bIndex = TILE_TYPES.indexOf(b);
		return aIndex - bIndex;
	});
}

export function nextHouse(house: House): House {
	switch (house) {
		case 'e': return 's';
		case 's': return 'w';
		case 'w': return 'n';
		case 'n': return 'e';
		default: throw new Error(`unrecognized house: ${house}`);
	}
}

export function prevHouse(house: House): House {
	switch (house) {
		case 'e': return 'n';
		case 's': return 'e';
		case 'w': return 's';
		case 'n': return 'w';
		default: throw new Error(`unrecognized house: ${house}`);
	}
}

export type FourMentsuOneJyantou = {
	head: TileType;
	mentsus: [TileType, TileType, TileType][];
};

export function isShuntu(tiles: [TileType, TileType, TileType]): boolean {
	return tiles[0] !== tiles[1];
}

export function isKotsu(tiles: [TileType, TileType, TileType]): boolean {
	return tiles[0] === tiles[1];
}

export function mentsuEquals(tiles1: [TileType, TileType, TileType], tiles2: [TileType, TileType, TileType]): boolean {
	return tiles1[0] == tiles2[0] && tiles1[1] == tiles2[1] && tiles1[2] == tiles2[2];
}

export const SHUNTU_PATTERNS: [TileType, TileType, TileType][] = [
	['m1', 'm2', 'm3'],
	['m2', 'm3', 'm4'],
	['m3', 'm4', 'm5'],
	['m4', 'm5', 'm6'],
	['m5', 'm6', 'm7'],
	['m6', 'm7', 'm8'],
	['m7', 'm8', 'm9'],
	['p1', 'p2', 'p3'],
	['p2', 'p3', 'p4'],
	['p3', 'p4', 'p5'],
	['p4', 'p5', 'p6'],
	['p5', 'p6', 'p7'],
	['p6', 'p7', 'p8'],
	['p7', 'p8', 'p9'],
	['s1', 's2', 's3'],
	['s2', 's3', 's4'],
	['s3', 's4', 's5'],
	['s4', 's5', 's6'],
	['s5', 's6', 's7'],
	['s6', 's7', 's8'],
	['s7', 's8', 's9'],
];

function extractShuntsus(tiles: TileType[]): [TileType, TileType, TileType][] {
	const tempTiles = [...tiles];

	tempTiles.sort((a, b) => {
		const aIndex = TILE_TYPES.indexOf(a);
		const bIndex = TILE_TYPES.indexOf(b);
		return aIndex - bIndex;
	});

	const shuntsus: [TileType, TileType, TileType][] = [];
	while (tempTiles.length > 0) {
		let isShuntu = false;
		for (const shuntuPattern of SHUNTU_PATTERNS) {
			if (
				tempTiles[0] === shuntuPattern[0] &&
				tempTiles.includes(shuntuPattern[1]) &&
				tempTiles.includes(shuntuPattern[2])
			) {
				shuntsus.push(shuntuPattern);
				tempTiles.splice(0, 1);
				tempTiles.splice(tempTiles.indexOf(shuntuPattern[1]), 1);
				tempTiles.splice(tempTiles.indexOf(shuntuPattern[2]), 1);
				isShuntu = true;
				break;
			}
		}

		if (!isShuntu) tempTiles.splice(0, 1);
	}

	return shuntsus;
}

export function analyzeFourMentsuOneJyantou(handTiles: TileType[], all = true): FourMentsuOneJyantou[] {
	const horaSets: FourMentsuOneJyantou[] = [];

	const headSet: TileType[] = [];
	const countMap = new Map<TileType, number>();
	for (const tile of handTiles) {
		const count = (countMap.get(tile) ?? 0) + 1;
		countMap.set(tile, count);
		if (count === 2) {
			headSet.push(tile);
		}
	}

	for (const head of headSet) {
		const tempHandTiles = [...handTiles];
		tempHandTiles.splice(tempHandTiles.indexOf(head), 1);
		tempHandTiles.splice(tempHandTiles.indexOf(head), 1);

		const kotsuTileSet: TileType[] = []; // インデックスアクセスしたいため配列だが実態はSet
		for (const [t, c] of countMap.entries()) {
			if (t === head) continue; // 同じ牌種は4枚しかないので、頭と同じ牌種は刻子になりえない
			if (c >= 3) {
				kotsuTileSet.push(t);
			}
		}

		let kotsuPatterns: TileType[][];
		if (kotsuTileSet.length === 0) {
			kotsuPatterns = [
				[],
			];
		} else if (kotsuTileSet.length === 1) {
			kotsuPatterns = [
				[],
				[kotsuTileSet[0]],
			];
		} else if (kotsuTileSet.length === 2) {
			kotsuPatterns = [
				[],
				[kotsuTileSet[0]],
				[kotsuTileSet[1]],
				[kotsuTileSet[0], kotsuTileSet[1]],
			];
		} else if (kotsuTileSet.length === 3) {
			kotsuPatterns = [
				[],
				[kotsuTileSet[0]],
				[kotsuTileSet[1]],
				[kotsuTileSet[2]],
				[kotsuTileSet[0], kotsuTileSet[1]],
				[kotsuTileSet[0], kotsuTileSet[2]],
				[kotsuTileSet[1], kotsuTileSet[2]],
				[kotsuTileSet[0], kotsuTileSet[1], kotsuTileSet[2]],
			];
		} else if (kotsuTileSet.length === 4) {
			kotsuPatterns = [
				[],
				[kotsuTileSet[0]],
				[kotsuTileSet[1]],
				[kotsuTileSet[2]],
				[kotsuTileSet[3]],
				[kotsuTileSet[0], kotsuTileSet[1]],
				[kotsuTileSet[0], kotsuTileSet[2]],
				[kotsuTileSet[0], kotsuTileSet[3]],
				[kotsuTileSet[1], kotsuTileSet[2]],
				[kotsuTileSet[1], kotsuTileSet[3]],
				[kotsuTileSet[2], kotsuTileSet[3]],
				[kotsuTileSet[0], kotsuTileSet[1], kotsuTileSet[2]],
				[kotsuTileSet[0], kotsuTileSet[1], kotsuTileSet[3]],
				[kotsuTileSet[0], kotsuTileSet[2], kotsuTileSet[3]],
				[kotsuTileSet[1], kotsuTileSet[2], kotsuTileSet[3]],
				[kotsuTileSet[0], kotsuTileSet[1], kotsuTileSet[2], kotsuTileSet[3]],
			];
		} else {
			throw new Error('arienai');
		}

		for (const kotsuPattern of kotsuPatterns) {
			const tempHandTilesWithoutKotsu = [...tempHandTiles];
			for (const kotsuTile of kotsuPattern) {
				tempHandTilesWithoutKotsu.splice(tempHandTilesWithoutKotsu.indexOf(kotsuTile), 1);
				tempHandTilesWithoutKotsu.splice(tempHandTilesWithoutKotsu.indexOf(kotsuTile), 1);
				tempHandTilesWithoutKotsu.splice(tempHandTilesWithoutKotsu.indexOf(kotsuTile), 1);
			}

			const shuntsus = extractShuntsus(tempHandTilesWithoutKotsu);

			if (shuntsus.length * 3 === tempHandTilesWithoutKotsu.length) { // アガリ形
				horaSets.push({
					head,
					mentsus: [...kotsuPattern.map(t => [t, t, t] as [TileType, TileType, TileType]), ...shuntsus],
				});

				if (!all) return horaSets;
			}
		}
	}

	return horaSets;
}

export function nextTileForDora(tile: TileType): TileType {
	return NEXT_TILE_FOR_DORA_MAP[tile];
}

export function getAvailableCiiPatterns(handTiles: TileType[], targetTile: TileType): [TileType, TileType, TileType][] {
	const patterns: [TileType, TileType, TileType][] = [];
	const prev1 = PREV_TILE_FOR_SHUNTSU[targetTile];
	const prev2 = prev1 != null ? PREV_TILE_FOR_SHUNTSU[prev1] : null;
	const next1 = NEXT_TILE_FOR_SHUNTSU[targetTile];
	const next2 = next1 != null ? NEXT_TILE_FOR_SHUNTSU[next1] : null;
	if (prev2 != null && prev1 != null) {
		if (handTiles.includes(prev2) && handTiles.includes(prev1)) {
			patterns.push([prev2, prev1, targetTile]);
		}
	}
	if (prev1 != null && next1 != null) {
		if (handTiles.includes(prev1) && handTiles.includes(next1)) {
			patterns.push([prev1, targetTile, next1]);
		}
	}
	if (next1 != null && next2 != null) {
		if (handTiles.includes(next1) && handTiles.includes(next2)) {
			patterns.push([targetTile, next1, next2]);
		}
	}
	return patterns;
}

function isKokushiPattern(handTiles: TileType[]): boolean {
	return KOKUSHI_TILES.every(t => handTiles.includes(t));
}

function isChitoitsuPattern(handTiles: TileType[]): boolean {
	if (handTiles.length !== 14) return false;
	const countMap = new Map<TileType, number>();
	for (const tile of handTiles) {
		const count = (countMap.get(tile) ?? 0) + 1;
		countMap.set(tile, count);
	}
	return Array.from(countMap.values()).every(c => c === 2);
}

export function isAgarikei(handTiles: TileType[]): boolean {
	if (isKokushiPattern(handTiles)) return true;
	if (isChitoitsuPattern(handTiles)) return true;

	const agarikeis = analyzeFourMentsuOneJyantou(handTiles, false);
	return agarikeis.length > 0;
}

export function isTenpai(handTiles: TileType[]): boolean {
	return TILE_TYPES.some(tile => {
		const tempHandTiles = [...handTiles, tile];
		return isAgarikei(tempHandTiles);
	});
}

export function getTilesForRiichi(handTiles: TileType[]): TileType[] {
	return handTiles.filter(tile => {
		const tempHandTiles = [...handTiles];
		tempHandTiles.splice(tempHandTiles.indexOf(tile), 1);
		return isTenpai(tempHandTiles);
	});
}
