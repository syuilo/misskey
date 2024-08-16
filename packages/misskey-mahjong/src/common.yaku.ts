/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CALL_HURO_TYPES, CHAR_TILES, FourMentsuOneJyantou, House, MANZU_TILES, PINZU_TILES, SOUZU_TILES, TileType, YAOCHU_TILES, TILE_TYPES, analyzeFourMentsuOneJyantou, isShuntu, isManzu, isPinzu, isSameNumberTile, isSouzu, isKotsu, includes, TERMINAL_TILES, mentsuEquals, Huro, TILE_ID_MAP } from './common.js';
import { calcWaitPatterns, isRyanmen, isToitsu, FourMentsuOneJyantouWithWait } from './common.fu.js';

const RYUISO_TILES: TileType[] = ['s2', 's3', 's4', 's6', 's8', 'hatsu'];
const KOKUSHI_TILES: TileType[] = ['m1', 'm9', 'p1', 'p9', 's1', 's9', 'e', 's', 'w', 'n', 'haku', 'hatsu', 'chun'];

export const NORMAL_YAKU_NAMES = [
	'riichi',
	'ippatsu',
	'tsumo',
	'tanyao',
	'pinfu',
	'iipeko',
	'field-wind-e',
	'field-wind-s',
	'field-wind-w',
	'field-wind-n',
	'seat-wind-e',
	'seat-wind-s',
	'seat-wind-w',
	'seat-wind-n',
	'white',
	'green',
	'red',
	'rinshan',
	'chankan',
	'haitei',
	'hotei',
	'sanshoku-dojun',
	'sanshoku-doko',
	'ittsu',
	'chanta',
	'chitoitsu',
	'toitoi',
	'sananko',
	'honroto',
	'sankantsu',
	'shosangen',
	'double-riichi',
	'honitsu',
	'junchan',
	'ryampeko',
	'chinitsu',
	'dora',
	'red-dora',
] as const;

export const YAKUMAN_NAMES = [
	'kokushi',
	'kokushi-13',
	'suanko',
	'suanko-tanki',
	'daisangen',
	'tsuiso',
	'shosushi',
	'daisushi',
	'ryuiso',
	'chinroto',
	'sukantsu',
	'churen',
	'churen-9',
	'tenho',
	'chiho',
] as const;

type NormalYakuName = typeof NORMAL_YAKU_NAMES[number]

type YakumanName = typeof YAKUMAN_NAMES[number];

export type YakuName = NormalYakuName | YakumanName;

export type HuroForCalcYaku = {
	type: 'pon';
	tile: TileType;
} | {
	type: 'cii';
	tiles: [TileType, TileType, TileType];
} | {
	type: 'ankan';
	tile: TileType;
} | {
	type: 'minkan';
	tile: TileType;
};

export type EnvForCalcYaku = {
	/**
	 * 和了る人の手牌(副露牌は含まず、ツモ、ロン牌は含む)
	 */
	handTiles: TileType[];

	/**
	 * 河
	 */
	hoTiles?: TileType[];

	/**
	 * 副露
	 */
	huros: HuroForCalcYaku[];

	/**
	 * 場風
	 */
	fieldWind?: House;

	/**
	 * 自風
	 */
	seatWind?: House;

	/**
	 * 局が始まってから誰の副露もない一巡目かどうか
	 */
	firstTurn?: boolean;

	/**
	 * リーチしたかどうか
	 */
	riichi?: boolean;

	/**
	 * 誰の副露もない一巡目でリーチしたかどうか
	 */
	doubleRiichi?: boolean;

	/**
	 * リーチしてから誰の副露もない一巡目以内かどうか
	 */
	ippatsu?: boolean;
} & ({
	tsumoTile: TileType;
	ronTile?: null;

	/**
	 * 嶺上牌のツモか
	 */
	rinshan?: boolean;

	/**
	 * 海底牌か
	 */
	haitei?: boolean;
} | {
	tsumoTile?: null;
	ronTile: TileType;

	/**
	 * 河底牌か
	 */
	hotei?: boolean;
});

interface YakuDataBase {
	name: YakuName;
	upper?: YakuName | null;
	fan?: number | null;
	isYakuman?: boolean;
}

interface NormalYakuData extends YakuDataBase {
	name: NormalYakuName;
	fan: number;
	isYakuman?: false;
	kuisagari?: boolean;
}

interface YakumanData extends YakuDataBase {
	name: YakumanName;
	isYakuman: true;
	isDoubleYakuman?: boolean;
}

export type YakuData = Required<NormalYakuData> | Required<YakumanData>;

abstract class YakuSetBase<IsYakuman extends boolean> {
	public readonly isYakuman: IsYakuman;

	public readonly yakus: YakuData[];

	public get yakuNames(): YakuName[] {
		return this.yakus.map(yaku => yaku.name);
	}

	constructor(isYakuman: IsYakuman, yakus: YakuData[]) {
		this.isYakuman = isYakuman;
		this.yakus = yakus;
	}
}

class NormalYakuSet extends YakuSetBase<false> {
	public readonly isMenzen: boolean;

	public readonly fan: number;

	constructor(isMenzen: boolean, yakus: Required<NormalYakuData>[]) {
		super(false, yakus);
		this.isMenzen = isMenzen;
		this.fan = yakus.reduce((fan, yaku) => fan + (!isMenzen && yaku.kuisagari ? yaku.fan - 1 : yaku.fan), 0);
	}
}

class YakumanSet extends YakuSetBase<true> {
	/**
	 * 何倍役満か
	 */
	public readonly value: number;

	constructor(yakus: Required<YakumanData>[]) {
		super(true, yakus);
		this.value = yakus.reduce((value, yaku) => value + (yaku.isDoubleYakuman ? 2 : 1), 0);
	}
}

export type YakuSet = NormalYakuSet | YakumanSet;

type YakuDefinitionBase = {
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantouWithWait | null) => boolean;
};

type NormalYakuDefinition = YakuDefinitionBase & NormalYakuData;

type YakumanDefinition = YakuDefinitionBase & YakumanData;

function countTiles(tiles: TileType[], target: TileType): number {
	return tiles.filter(t => t === target).length;
}

class Yakuhai implements NormalYakuDefinition {
	readonly name: NormalYakuName;

	readonly fan = 1;

	readonly isYakuman = false;

	readonly tile: typeof CHAR_TILES[number];

	constructor(name: NormalYakuName, house: typeof CHAR_TILES[number]) {
		this.name = name;
		this.tile = house;
	}

	calc(state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null): boolean {
		if (fourMentsuOneJyantou == null) return false;

		return (
			(countTiles(state.handTiles, this.tile) >= 3) ||
			(state.huros.some(huro =>
				huro.type === 'pon' ? huro.tile === this.tile :
				huro.type === 'ankan' ? huro.tile === this.tile :
				huro.type === 'minkan' ? huro.tile === this.tile :
				false))
		);
	}
}

class FieldWind extends Yakuhai {
	calc(state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null): boolean {
		return super.calc(state, fourMentsuOneJyantou) && state.fieldWind === this.tile;
	}
}

class SeatWind extends Yakuhai {
	calc(state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null): boolean {
		return super.calc(state, fourMentsuOneJyantou) && state.seatWind === this.tile;
	}
}

/**
 * 2つの同じ面子の組を数える (一盃口なら1、二盃口なら2)
 */
function countIndenticalMentsuPairs(mentsus: [TileType, TileType, TileType][]) {
	let result = 0;
	const singleMentsus: [TileType, TileType, TileType][] = [];
	loop: for (const mentsu of mentsus) {
		for (let i = 0 ; i < singleMentsus.length ; i++) {
			if (mentsuEquals(mentsu, singleMentsus[i])) {
				result++;
				singleMentsus.splice(i, 1);
				continue loop;
			}
		}
		singleMentsus.push(mentsu);
	}
	return result;
}

/**
 * 暗刻の数を数える (三暗刻なら3、四暗刻なら4)
 */
function countAnkos(state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantouWithWait) {
	let ankans = state.huros.filter(huro => huro.type == 'ankan').length;
	const handKotsus = fourMentsuOneJyantou.mentsus.filter(mentsu => isKotsu(mentsu)).length;

	// ロンによりできた刻子は暗刻ではない
	if (state.ronTile != null && fourMentsuOneJyantou.waitedFor == 'mentsu' && isToitsu(fourMentsuOneJyantou.waitedTaatsu)) {
		return ankans + handKotsus - 1;
	}

	return ankans + handKotsus;
}

export const NORMAL_YAKU_DEFINITIONS: NormalYakuDefinition[] = [{
	name: 'tsumo',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		// 門前じゃないとダメ
		if (state.huros.some(huro => includes(CALL_HURO_TYPES, huro.type))) return false;

		return state.tsumoTile != null;
	},
}, {
	name: 'riichi',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return !state.doubleRiichi && (state.riichi ?? false);
	},
}, {
	name: 'double-riichi',
	fan: 2,
	isYakuman: false,
	calc: (state: EnvForCalcYaku) => {
		return state.doubleRiichi ?? false;
	}
}, {
	name: 'ippatsu',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return state.ippatsu ?? false;
	},
}, {
	name: 'rinshan',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return (state.tsumoTile != null && state.rinshan) ?? false;
	}
}, {
	name: 'haitei',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return (state.tsumoTile != null && state.haitei) ?? false;
	}
}, {
	name: 'hotei',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return (state.ronTile != null && state.hotei) ?? false;
	}
},
new Yakuhai('red', 'chun'),
new Yakuhai('white', 'haku'),
new Yakuhai('green', 'hatsu'),
new FieldWind('field-wind-e', 'e'),
new FieldWind('field-wind-s', 's'),
new FieldWind('field-wind-w', 'w'),
new FieldWind('field-wind-n', 'n'),
new SeatWind('seat-wind-e', 'e'),
new SeatWind('seat-wind-s', 's'),
new SeatWind('seat-wind-w', 'w'),
new SeatWind('seat-wind-n', 'n'),
{
	name: 'tanyao',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return (
			(!state.handTiles.some(t => includes(YAOCHU_TILES, t))) &&
			(state.huros.filter(huro =>
				huro.type === 'pon' ? includes(YAOCHU_TILES, huro.tile) :
				huro.type === 'ankan' ? includes(YAOCHU_TILES, huro.tile) :
				huro.type === 'minkan' ? includes(YAOCHU_TILES, huro.tile) :
				huro.type === 'cii' ? huro.tiles.some(t2 => includes(YAOCHU_TILES, t2)) :
				false).length === 0)
		);
	},
}, {
	name: 'pinfu',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantouWithWait | null) => {
		if (fourMentsuOneJyantou == null) return false;

		// 面前じゃないとダメ
		if (state.huros.some(huro => includes(CALL_HURO_TYPES, huro.type))) return false;
		// 三元牌はダメ
		if (state.handTiles.some(t => ['haku', 'hatsu', 'chun'].includes(t))) return false;

		// 両面待ちかどうか
		if (!(fourMentsuOneJyantou != null && fourMentsuOneJyantou.waitedFor == 'mentsu' && isRyanmen(fourMentsuOneJyantou.waitedTaatsu))) return false;

		// 風牌判定(役牌でなければOK)
		if (fourMentsuOneJyantou.head === state.seatWind) return false;
		if (fourMentsuOneJyantou.head === state.fieldWind) return false;

		// 全て順子か？
		if (fourMentsuOneJyantou.mentsus.some((mentsu) => mentsu[0] === mentsu[1])) return false;

		return true;
	},
}, {
	name: 'honitsu',
	fan: 3,
	isYakuman: false,
	kuisagari: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		const tiles = state.handTiles;
		let manzuCount = tiles.filter(t => includes(MANZU_TILES, t)).length;
		let pinzuCount = tiles.filter(t => includes(PINZU_TILES, t)).length;
		let souzuCount = tiles.filter(t => includes(SOUZU_TILES, t)).length;
		let charCount = tiles.filter(t => includes(CHAR_TILES, t)).length;

		for (const huro of state.huros) {
			const huroTiles = huro.type === 'cii' ? huro.tiles : huro.type === 'pon' ? [huro.tile, huro.tile, huro.tile] : [huro.tile, huro.tile, huro.tile, huro.tile];
			manzuCount += huroTiles.filter(t => includes(MANZU_TILES, t)).length;
			pinzuCount += huroTiles.filter(t => includes(PINZU_TILES, t)).length;
			souzuCount += huroTiles.filter(t => includes(SOUZU_TILES, t)).length;
			charCount += huroTiles.filter(t => includes(CHAR_TILES, t)).length;
		}

		if (manzuCount > 0 && pinzuCount > 0) return false;
		if (manzuCount > 0 && souzuCount > 0) return false;
		if (pinzuCount > 0 && souzuCount > 0) return false;
		if (charCount === 0) return false;

		return true;
	},
}, {
	name: 'chinitsu',
	fan: 6,
	isYakuman: false,
	kuisagari: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		const tiles = state.handTiles;
		let manzuCount = tiles.filter(t => includes(MANZU_TILES, t)).length;
		let pinzuCount = tiles.filter(t => includes(PINZU_TILES, t)).length;
		let souzuCount = tiles.filter(t => includes(SOUZU_TILES, t)).length;
		let charCount = tiles.filter(t => includes(CHAR_TILES, t)).length;

		for (const huro of state.huros) {
			const huroTiles = huro.type === 'cii' ? huro.tiles : huro.type === 'pon' ? [huro.tile, huro.tile, huro.tile] : [huro.tile, huro.tile, huro.tile, huro.tile];
			manzuCount += huroTiles.filter(t => includes(MANZU_TILES, t)).length;
			pinzuCount += huroTiles.filter(t => includes(PINZU_TILES, t)).length;
			souzuCount += huroTiles.filter(t => includes(SOUZU_TILES, t)).length;
			charCount += huroTiles.filter(t => includes(CHAR_TILES, t)).length;
		}

		if (charCount > 0) return false;
		if (manzuCount > 0 && pinzuCount > 0) return false;
		if (manzuCount > 0 && souzuCount > 0) return false;
		if (pinzuCount > 0 && souzuCount > 0) return false;

		return true;
	},
}, {
	name: 'iipeko',
	fan: 1,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		// 面前じゃないとダメ
		if (state.huros.some(huro => includes(CALL_HURO_TYPES, huro.type))) return false;

		// 同じ順子が2つあるか？
		return countIndenticalMentsuPairs(fourMentsuOneJyantou.mentsus) == 1;
	},
}, {
	name: 'ryampeko',
	fan: 3,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		// 面前じゃないとダメ
		if (state.huros.some(huro => includes(CALL_HURO_TYPES, huro.type))) return false;

		// 2つの同じ順子が2組あるか？
		return countIndenticalMentsuPairs(fourMentsuOneJyantou.mentsus) == 2;
	},
}, {
	name: 'toitoi',
	fan: 2,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		if (state.huros.length > 0) {
			if (state.huros.some(huro => huro.type === 'cii')) return false;
		}

		// 全て刻子か？
		if (!fourMentsuOneJyantou.mentsus.every((mentsu) => mentsu[0] === mentsu[1])) return false;

		return true;
	},
}, {
	name: 'sananko',
	fan: 2,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantouWithWait | null) => {
		return fourMentsuOneJyantou != null && countAnkos(state, fourMentsuOneJyantou) == 3;
	},
}, {
	name: 'honroto',
	fan: 2,
	isYakuman: false,
	calc: (state: EnvForCalcYaku) => {
		return state.huros.every(huro => huro.type != 'cii' && includes(YAOCHU_TILES, huro.tile)) &&
			state.handTiles.every(tile => includes(YAOCHU_TILES, tile));
	}
}, {
	name: 'sankantsu',
	fan: 2,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return fourMentsuOneJyantou != null &&
			state.huros.filter(huro => huro.type == 'ankan' || huro.type == 'minkan').length == 3;
	}
}, {
	name: 'sanshoku-dojun',
	fan: 2,
	isYakuman: false,
	kuisagari: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		const shuntsus = fourMentsuOneJyantou.mentsus.filter(tiles => isShuntu(tiles));

		for (const shuntsu of shuntsus) {
			if (isManzu(shuntsu[0])) {
				if (shuntsus.some(tiles => isPinzu(tiles[0]) && isSameNumberTile(tiles[0], shuntsu[0]) && isSameNumberTile(tiles[1], shuntsu[1]) && isSameNumberTile(tiles[2], shuntsu[2]))) {
					if (shuntsus.some(tiles => isSouzu(tiles[0]) && isSameNumberTile(tiles[0], shuntsu[0]) && isSameNumberTile(tiles[1], shuntsu[1]) && isSameNumberTile(tiles[2], shuntsu[2]))) {
						return true;
					}
				}
			} else if (isPinzu(shuntsu[0])) {
				if (shuntsus.some(tiles => isManzu(tiles[0]) && isSameNumberTile(tiles[0], shuntsu[0]) && isSameNumberTile(tiles[1], shuntsu[1]) && isSameNumberTile(tiles[2], shuntsu[2]))) {
					if (shuntsus.some(tiles => isSouzu(tiles[0]) && isSameNumberTile(tiles[0], shuntsu[0]) && isSameNumberTile(tiles[1], shuntsu[1]) && isSameNumberTile(tiles[2], shuntsu[2]))) {
						return true;
					}
				}
			} else if (isSouzu(shuntsu[0])) {
				if (shuntsus.some(tiles => isManzu(tiles[0]) && isSameNumberTile(tiles[0], shuntsu[0]) && isSameNumberTile(tiles[1], shuntsu[1]) && isSameNumberTile(tiles[2], shuntsu[2]))) {
					if (shuntsus.some(tiles => isPinzu(tiles[0]) && isSameNumberTile(tiles[0], shuntsu[0]) && isSameNumberTile(tiles[1], shuntsu[1]) && isSameNumberTile(tiles[2], shuntsu[2]))) {
						return true;
					}
				}
			}
		}

		return false;
	},
}, {
	name: 'sanshoku-doko',
	fan: 2,
	isYakuman: false,
	kuisagari: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		const kotsus = fourMentsuOneJyantou.mentsus.filter(tiles => isKotsu(tiles));

		for (const kotsu of kotsus) {
			if (isManzu(kotsu[0])) {
				if (kotsus.some(tiles => isPinzu(tiles[0]) && isSameNumberTile(tiles[0], kotsu[0]))) {
					if (kotsus.some(tiles => isSouzu(tiles[0]) && isSameNumberTile(tiles[0], kotsu[0]))) {
						return true;
					}
				}
			} else if (isPinzu(kotsu[0])) {
				if (kotsus.some(tiles => isManzu(tiles[0]) && isSameNumberTile(tiles[0], kotsu[0]))) {
					if (kotsus.some(tiles => isSouzu(tiles[0]) && isSameNumberTile(tiles[0], kotsu[0]))) {
						return true;
					}
				}
			} else if (isSouzu(kotsu[0])) {
				if (kotsus.some(tiles => isManzu(tiles[0]) && isSameNumberTile(tiles[0], kotsu[0]))) {
					if (kotsus.some(tiles => isPinzu(tiles[0]) && isSameNumberTile(tiles[0], kotsu[0]))) {
						return true;
					}
				}
			}
		}

		return false;
	},
}, {
	name: 'ittsu',
	fan: 2,
	isYakuman: false,
	kuisagari: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		const shuntsus = fourMentsuOneJyantou.mentsus.filter(tiles => isShuntu(tiles));
		shuntsus.push(...state.huros.filter(huro => huro.type == 'cii').map(huro => huro.tiles));

		if (shuntsus.some(tiles => tiles[0] === 'm1' && tiles[1] === 'm2' && tiles[2] === 'm3')) {
			if (shuntsus.some(tiles => tiles[0] === 'm4' && tiles[1] === 'm5' && tiles[2] === 'm6')) {
				if (shuntsus.some(tiles => tiles[0] === 'm7' && tiles[1] === 'm8' && tiles[2] === 'm9')) {
					return true;
				}
			}
		}
		if (shuntsus.some(tiles => tiles[0] === 'p1' && tiles[1] === 'p2' && tiles[2] === 'p3')) {
			if (shuntsus.some(tiles => tiles[0] === 'p4' && tiles[1] === 'p5' && tiles[2] === 'p6')) {
				if (shuntsus.some(tiles => tiles[0] === 'p7' && tiles[1] === 'p8' && tiles[2] === 'p9')) {
					return true;
				}
			}
		}
		if (shuntsus.some(tiles => tiles[0] === 's1' && tiles[1] === 's2' && tiles[2] === 's3')) {
			if (shuntsus.some(tiles => tiles[0] === 's4' && tiles[1] === 's5' && tiles[2] === 's6')) {
				if (shuntsus.some(tiles => tiles[0] === 's7' && tiles[1] === 's8' && tiles[2] === 's9')) {
					return true;
				}
			}
		}

		return false;
	},
}, {
	name: 'chanta',
	fan: 2,
	isYakuman: false,
	kuisagari: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		const { head, mentsus } = fourMentsuOneJyantou;
		const { huros } = state;

		// 雀頭は幺九牌じゃないとダメ
		if (!includes(YAOCHU_TILES, head)) return false;

		// 順子は1つ以上じゃないとダメ
		if (!mentsus.some(mentsu => isShuntu(mentsu))) return false;

		// いずれかの雀頭か面子に字牌を含まないとダメ
		if (!(includes(CHAR_TILES, head) ||
			mentsus.some(mentsu => includes(CHAR_TILES, mentsu[0])) ||
			huros.some(huro => huro.type != 'cii' && includes(CHAR_TILES, huro.tile)))) return false;

		// 全ての面子に幺九牌が含まれる
		return (mentsus.every(mentsu => mentsu.some(tile => includes(YAOCHU_TILES, tile))) &&
			huros.every(huro => huro.type == 'cii' ?
				huro.tiles.some(tile => includes(YAOCHU_TILES, tile)) :
				includes(YAOCHU_TILES, huro.tile)));
	},
}, {
	name: 'junchan',
	fan: 3,
	isYakuman: false,
	kuisagari: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		const { head, mentsus } = fourMentsuOneJyantou;
		const { huros } = state;

		// 雀頭は老頭牌じゃないとダメ
		if (!includes(TERMINAL_TILES, head)) return false;

		// 順子は1つ以上じゃないとダメ
		if (!mentsus.some(mentsu => isShuntu(mentsu))) return false;

		// 全ての面子に老頭牌が含まれる
		return (mentsus.every(mentsu => mentsu.some(tile => includes(TERMINAL_TILES, tile))) &&
			huros.every(huro => huro.type == 'cii' ?
				huro.tiles.some(tile => includes(TERMINAL_TILES, tile)) :
				includes(TERMINAL_TILES, huro.tile)));
	},
}, {
	name: 'chitoitsu',
	fan: 2,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou != null) return false;
		if (state.huros.length > 0) return false;
		const countMap = new Map<TileType, number>();
		for (const tile of state.handTiles) {
			const count = (countMap.get(tile) ?? 0) + 1;
			countMap.set(tile, count);
		}
		return Array.from(countMap.values()).every(c => c === 2);
	},
}, {
	name: 'shosangen',
	fan: 2,
	isYakuman: false,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		const kotsuTiles = fourMentsuOneJyantou.mentsus.filter(tiles => isKotsu(tiles)).map(tiles => tiles[0]);

		for (const huro of state.huros) {
			if (huro.type === 'cii') {
				// nop
			} else if (huro.type === 'pon') {
				kotsuTiles.push(huro.tile);
			} else {
				kotsuTiles.push(huro.tile);
			}
		}

		switch (fourMentsuOneJyantou.head) {
			case 'haku': return kotsuTiles.includes('hatsu') && kotsuTiles.includes('chun');
			case 'hatsu': return kotsuTiles.includes('haku') && kotsuTiles.includes('chun');
			case 'chun': return kotsuTiles.includes('haku') && kotsuTiles.includes('hatsu');
		}

		return false;
	},
}];

export const YAKUMAN_DEFINITIONS: YakumanDefinition[] = [{
	name: 'suanko-tanki',
	isYakuman: true,
	isDoubleYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantouWithWait | null) => {
		return fourMentsuOneJyantou != null && fourMentsuOneJyantou.waitedFor == 'head' && countAnkos(state, fourMentsuOneJyantou) == 4;
	}
}, {
	name: 'suanko',
	isYakuman: true,
	upper: 'suanko-tanki',
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantouWithWait | null) => {
		return fourMentsuOneJyantou != null && countAnkos(state, fourMentsuOneJyantou) == 4;
	}
}, {
	name: 'daisangen',
	isYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		const kotsuTiles = fourMentsuOneJyantou.mentsus.filter(tiles => isKotsu(tiles)).map(tiles => tiles[0]);

		for (const huro of state.huros) {
			if (huro.type === 'cii') {
				// nop
			} else if (huro.type === 'pon') {
				kotsuTiles.push(huro.tile);
			} else {
				kotsuTiles.push(huro.tile);
			}
		}

		return kotsuTiles.includes('haku') && kotsuTiles.includes('hatsu') && kotsuTiles.includes('chun');
	},
}, {
	name: 'shosushi',
	isYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		let all = [...state.handTiles];
		for (const huro of state.huros) {
			if (huro.type === 'cii') {
				all = [...all, ...huro.tiles];
			} else if (huro.type === 'pon') {
				all = [...all, huro.tile, huro.tile, huro.tile];
			} else {
				all = [...all, huro.tile, huro.tile, huro.tile, huro.tile];
			}
		}

		switch (fourMentsuOneJyantou.head) {
			case 'e': return (countTiles(all, 's') === 3) && (countTiles(all, 'w') === 3) && (countTiles(all, 'n') === 3);
			case 's': return (countTiles(all, 'e') === 3) && (countTiles(all, 'w') === 3) && (countTiles(all, 'n') === 3);
			case 'w': return (countTiles(all, 'e') === 3) && (countTiles(all, 's') === 3) && (countTiles(all, 'n') === 3);
			case 'n': return (countTiles(all, 'e') === 3) && (countTiles(all, 's') === 3) && (countTiles(all, 'w') === 3);
		}

		return false;
	},
}, {
	name: 'daisushi',
	isYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		const kotsuTiles = fourMentsuOneJyantou.mentsus.filter(tiles => isKotsu(tiles)).map(tiles => tiles[0]);

		for (const huro of state.huros) {
			if (huro.type === 'cii') {
				// nop
			} else if (huro.type === 'pon') {
				kotsuTiles.push(huro.tile);
			} else {
				kotsuTiles.push(huro.tile);
			}
		}

		return kotsuTiles.includes('e') && kotsuTiles.includes('s') && kotsuTiles.includes('w') && kotsuTiles.includes('n');
	},
}, {
	name: 'tsuiso',
	isYakuman: true,
	calc: (state: EnvForCalcYaku) => {
		const tiles = state.handTiles;
		let manzuCount = tiles.filter(t => includes(MANZU_TILES, t)).length;
		let pinzuCount = tiles.filter(t => includes(PINZU_TILES, t)).length;
		let souzuCount = tiles.filter(t => includes(SOUZU_TILES, t)).length;

		for (const huro of state.huros) {
			const huroTiles = huro.type === 'cii' ? huro.tiles : huro.type === 'pon' ? [huro.tile, huro.tile, huro.tile] : [huro.tile, huro.tile, huro.tile, huro.tile];
			manzuCount += huroTiles.filter(t => includes(MANZU_TILES, t)).length;
			pinzuCount += huroTiles.filter(t => includes(PINZU_TILES, t)).length;
			souzuCount += huroTiles.filter(t => includes(SOUZU_TILES, t)).length;
		}

		if (manzuCount > 0 || pinzuCount > 0 || souzuCount > 0) return false;

		return true;
	},
}, {
	name: 'ryuiso',
	isYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		if (state.handTiles.some(t => !RYUISO_TILES.includes(t))) return false;

		for (const huro of state.huros) {
			const huroTiles = huro.type === 'cii' ? huro.tiles : huro.type === 'pon' ? [huro.tile, huro.tile, huro.tile] : [huro.tile, huro.tile, huro.tile, huro.tile];
			if (huroTiles.some(t => !RYUISO_TILES.includes(t))) return false;
		}

		return true;
	},
}, {
	name: 'chinroto',
	isYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return fourMentsuOneJyantou != null &&
			state.huros.every(huro => huro.type != 'cii' && includes(TERMINAL_TILES, huro.tile)) &&
			state.handTiles.every(tile => includes(TERMINAL_TILES, tile));
	}
}, {
	name: 'sukantsu',
	isYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return fourMentsuOneJyantou != null &&
			state.huros.filter(huro => huro.type == 'ankan' || huro.type == 'minkan').length == 4;
	}
}, {
	name: 'churen-9',
	isYakuman: true,
	isDoubleYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		// 面前じゃないとダメ
		if (state.huros.some(huro => includes(CALL_HURO_TYPES, huro.type))) return false;

		const agariTile = state.tsumoTile ?? state.ronTile;
		if (agariTile == null) {
			return false;
		}
		const tempaiTiles = [...state.handTiles];
		tempaiTiles.splice(state.handTiles.indexOf(agariTile), 1);

		if (isManzu(agariTile)) {
			if ((countTiles(tempaiTiles, 'm1') === 3) && (countTiles(tempaiTiles, 'm9') === 3)) {
				if (tempaiTiles.includes('m2') && tempaiTiles.includes('m3') && tempaiTiles.includes('m4') && tempaiTiles.includes('m5') && tempaiTiles.includes('m6') && tempaiTiles.includes('m7') && tempaiTiles.includes('m8')) {
					return true;
				}
			}
		} else if (isPinzu(agariTile)) {
			if ((countTiles(tempaiTiles, 'p1') === 3) && (countTiles(tempaiTiles, 'p9') === 3)) {
				if (tempaiTiles.includes('p2') && tempaiTiles.includes('p3') && tempaiTiles.includes('p4') && tempaiTiles.includes('p5') && tempaiTiles.includes('p6') && tempaiTiles.includes('p7') && tempaiTiles.includes('p8')) {
					return true;
				}
			}
		} else if (isSouzu(agariTile)) {
			if ((countTiles(tempaiTiles, 's1') === 3) && (countTiles(tempaiTiles, 's9') === 3)) {
				if (tempaiTiles.includes('s2') && tempaiTiles.includes('s3') && tempaiTiles.includes('s4') && tempaiTiles.includes('s5') && tempaiTiles.includes('s6') && tempaiTiles.includes('s7') && tempaiTiles.includes('s8')) {
					return true;
				}
			}
		}

		return false;
	},
}, {
	name: 'churen',
	upper: 'churen-9',
	isYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		if (fourMentsuOneJyantou == null) return false;

		// 面前じゃないとダメ
		if (state.huros.some(huro => includes(CALL_HURO_TYPES, huro.type))) return false;

		if (isManzu(state.handTiles[0])) {
			if ((countTiles(state.handTiles, 'm1') === 3) && (countTiles(state.handTiles, 'm9') === 3)) {
				if (state.handTiles.includes('m2') && state.handTiles.includes('m3') && state.handTiles.includes('m4') && state.handTiles.includes('m5') && state.handTiles.includes('m6') && state.handTiles.includes('m7') && state.handTiles.includes('m8')) {
					return true;
				}
			}
		} else if (isPinzu(state.handTiles[0])) {
			if ((countTiles(state.handTiles, 'p1') === 3) && (countTiles(state.handTiles, 'p9') === 3)) {
				if (state.handTiles.includes('p2') && state.handTiles.includes('p3') && state.handTiles.includes('p4') && state.handTiles.includes('p5') && state.handTiles.includes('p6') && state.handTiles.includes('p7') && state.handTiles.includes('p8')) {
					return true;
				}
			}
		} else if (isSouzu(state.handTiles[0])) {
			if ((countTiles(state.handTiles, 's1') === 3) && (countTiles(state.handTiles, 's9') === 3)) {
				if (state.handTiles.includes('s2') && state.handTiles.includes('s3') && state.handTiles.includes('s4') && state.handTiles.includes('s5') && state.handTiles.includes('s6') && state.handTiles.includes('s7') && state.handTiles.includes('s8')) {
					return true;
				}
			}
		}

		return false;
	},
}, {
	name: 'kokushi-13',
	isYakuman: true,
	isDoubleYakuman: true,
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		const agariTile = state.tsumoTile ?? state.ronTile;
		return KOKUSHI_TILES.every(t => state.handTiles.includes(t)) && countTiles(state.handTiles, agariTile) == 2;
	}
}, {
	name: 'kokushi',
	isYakuman: true,
	upper: 'kokushi-13',
	calc: (state: EnvForCalcYaku, fourMentsuOneJyantou: FourMentsuOneJyantou | null) => {
		return KOKUSHI_TILES.every(t => state.handTiles.includes(t)) && KOKUSHI_TILES.some(t => countTiles(state.handTiles, t) == 2);
	},
}, {
	name: 'tenho',
	isYakuman: true,
	calc: (state: EnvForCalcYaku) => {
		return (state.firstTurn ?? false) && state.tsumoTile != null && state.seatWind == 'e';
	}
}, {
	name: 'chiho',
	isYakuman: true,
	calc: (state: EnvForCalcYaku) => {
		return (state.firstTurn ?? false) && state.tsumoTile != null && state.seatWind != 'e';
	}
}];

export function convertHuroForCalcYaku(huro: Huro): HuroForCalcYaku {
	switch (huro.type) {
		case 'pon':
		case 'ankan':
		case 'minkan':
			return {
				type: huro.type,
				tile: TILE_ID_MAP.get(huro.tiles[0])!.t,
			}
		case 'cii':
			return {
				type: 'cii',
				tiles: huro.tiles.map(tile => TILE_ID_MAP.get(tile)!.t) as [TileType, TileType, TileType],
			};
	}
}

const NORMAL_YAKU_DATA_MAP = new Map<NormalYakuName, Required<NormalYakuData>>(
	NORMAL_YAKU_DEFINITIONS.map(yaku => [yaku.name, {
		name: yaku.name,
		upper: yaku.upper ?? null,
		fan: yaku.fan,
		isYakuman: false,
		kuisagari: yaku.kuisagari ?? false,
	}] as const)
);

const YAKUMAN_DATA_MAP = new Map<YakuName, Required<YakumanData>>(
	YAKUMAN_DEFINITIONS.map(yaku => [yaku.name, {
		name: yaku.name,
		upper: yaku.upper ?? null,
		fan: null,
		isYakuman: true,
		isDoubleYakuman: yaku.isDoubleYakuman ?? false,
	}])
);

export function calcYakusWithDetail(state: EnvForCalcYaku): YakuSet {
	if (state.riichi && state.huros.some(huro => includes(CALL_HURO_TYPES, huro.type)) ) {
		throw new TypeError('Invalid riichi state with call huros');
	}

	const agariTile = state.tsumoTile ?? state.ronTile;
	if (!state.handTiles.includes(agariTile)) {
		throw new TypeError('Agari tile not included in hand tiles');
	}

	if (state.handTiles.length + state.huros.length * 3 != 14) {
		throw new TypeError('Invalid tile count');
	}

	const oneHeadFourMentsuPatterns: (FourMentsuOneJyantou | null)[] = analyzeFourMentsuOneJyantou(state.handTiles);
	if (oneHeadFourMentsuPatterns.length === 0) oneHeadFourMentsuPatterns.push(null);

	const waitPatterns = oneHeadFourMentsuPatterns.map(
		fourMentsuOneJyantou => calcWaitPatterns(fourMentsuOneJyantou, agariTile)
	).flat();

	const yakumanPatterns = waitPatterns.map(fourMentsuOneJyantouWithWait => {
			const matchedYakus: Required<YakumanData>[] = [];
			for (const yakuDef of YAKUMAN_DEFINITIONS) {
				if (yakuDef.upper && matchedYakus.some(yaku => yaku.name === yakuDef.upper)) continue;
				const matched = yakuDef.calc(state, fourMentsuOneJyantouWithWait);
				if (matched) {
					matchedYakus.push(YAKUMAN_DATA_MAP.get(yakuDef.name)!);
				}
			}
			return matchedYakus;
		}).filter(yakus => yakus.length > 0);

	if (yakumanPatterns.length > 0) {
		return new YakumanSet(yakumanPatterns[0]);
	}

	const yakuPatterns = waitPatterns.map(
		fourMentsuOneJyantouWithWait => NORMAL_YAKU_DEFINITIONS.filter(
			yakuDef => yakuDef.calc(state, fourMentsuOneJyantouWithWait)
		).map(yakuDef => NORMAL_YAKU_DATA_MAP.get(yakuDef.name)!)
	).filter(yakus => yakus.length > 0);

	const isMenzen = state.huros.some(huro => includes(CALL_HURO_TYPES, huro.type));

	if (yakuPatterns.length == 0) {
		return new NormalYakuSet(isMenzen, []);
	}

	let maxYakus = yakuPatterns[0];
	let maxFan = 0;
	for (const yakus of yakuPatterns) {
		let fan = 0;
		for (const yaku of yakus) {
			if (yaku.kuisagari && !isMenzen) {
				fan += yaku.fan! - 1;
			} else {
				fan += yaku.fan!;
			}
		}
		if (fan > maxFan) {
			maxFan = fan;
			maxYakus = yakus;
		}
	}

	return new NormalYakuSet(isMenzen, maxYakus);
}

export function calcYakus(state: EnvForCalcYaku): YakuName[] {
	return calcYakusWithDetail(state).yakuNames;
}
