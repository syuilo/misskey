/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import CRC32 from 'crc-32';
import { TileType, House, Huro, TileId } from './common.js';
import * as Common from './common.js';
import { calcYakusWithDetail, convertHuroForCalcYaku } from './common.yaku.js';

//#region syntax suger
function $(tid: TileId): Common.TileInstance {
	return Common.findTileByIdOrFail(tid);
}

function $type(tid: TileId): TileType {
	return $(tid).t;
}
//#endregion

export type PlayerState = {
	user1House: House;
	user2House: House;
	user3House: House;
	user4House: House;

	round: 'e' | 's' | 'w' | 'n';
	kyoku: number;

	turnCount: number;
	tilesCount: number;
	doraIndicateTiles: TileId[];

	/**
	 * 副露した牌を含まない手牌
	 */
	handTiles: {
		e: TileId[] | 0[];
		s: TileId[] | 0[];
		w: TileId[] | 0[];
		n: TileId[] | 0[];
	};

	hoTiles: {
		e: TileId[];
		s: TileId[];
		w: TileId[];
		n: TileId[];
	};
	huros: {
		e: Huro[];
		s: Huro[];
		w: Huro[];
		n: Huro[];
	};
	firstTurnFlags: {
		e: boolean;
		s: boolean;
		w: boolean;
		n: boolean;
	};
	riichis: {
		e: boolean;
		s: boolean;
		w: boolean;
		n: boolean;
	};
	doubleRiichis: {
		e: boolean;
		s: boolean;
		w: boolean;
		n: boolean;
	};
	ippatsus: {
		e: boolean;
		s: boolean;
		w: boolean;
		n: boolean;
	};
	rinshanFlags: {
		e: boolean;
		s: boolean;
		w: boolean;
		n: boolean;
	}
	points: {
		e: number;
		s: number;
		w: number;
		n: number;
	};
	latestDahaiedTile: TileId | null;
	turn: House | null;
	canPon: { callee: House } | null;
	canCii: { callee: House } | null;
	canKan: { callee: House } | null; // = 大明槓
	canRon: { callee: House } | null;
};

export type KyokuResult = {
	yakus: { name: string; fan: number | null; isYakuman: boolean; }[];
	doraCount: number;
	pointDeltas: { e: number; s: number; w: number; n: number; };
};

export class PlayerGameEngine {
	/**
	 * このエラーが発生したときはdesyncが疑われる
	 */
	public static InvalidOperationError = class extends Error {};

	private myUserNumber: 1 | 2 | 3 | 4;
	private state: PlayerState;

	constructor(myUserNumber: PlayerGameEngine['myUserNumber'], state: PlayerState) {
		this.myUserNumber = myUserNumber;
		this.state = state;
	}

	public get doras(): TileType[] {
		return this.state.doraIndicateTiles.map(t => Common.nextTileForDora($type(t)));
	}

	public get points(): Record<House, number> {
		return this.state.points;
	}

	public get handTiles(): Record<House, number[]> {
		return this.state.handTiles;
	}

	public get hoTiles(): Record<House, number[]> {
		return this.state.hoTiles;
	}

	public get huros(): Record<House, Huro[]> {
		return this.state.huros;
	}

	public get turnCount(): number {
		return this.state.turnCount;
	}

	public get tilesCount(): number {
		return this.state.tilesCount;
	}

	public get canRon(): PlayerState['canRon'] {
		return this.state.canRon;
	}

	public get canPon(): PlayerState['canPon'] {
		return this.state.canPon;
	}

	public get canKan(): PlayerState['canKan'] {
		return this.state.canKan;
	}

	public get canCii(): PlayerState['canCii'] {
		return this.state.canCii;
	}

	public get turn(): House | null {
		return this.state.turn;
	}

	public get user1House(): House {
		return this.state.user1House;
	}

	public get user2House(): House {
		return this.state.user2House;
	}

	public get user3House(): House {
		return this.state.user3House;
	}

	public get user4House(): House {
		return this.state.user4House;
	}

	public get myHouse(): House {
		switch (this.myUserNumber) {
			case 1: return this.state.user1House;
			case 2: return this.state.user2House;
			case 3: return this.state.user3House;
			case 4: return this.state.user4House;
		}
	}

	public get myHandTiles(): TileId[] {
		return this.state.handTiles[this.myHouse] as TileId[];
	}

	public get myHandTileTypes(): TileType[] {
		return this.myHandTiles.map(t => $type(t));
	}

	public get isMeRiichi(): boolean {
		return this.state.riichis[this.myHouse];
	}

	public commit_nextKyoku(state: PlayerState) {
		this.state = state;
	}

	public commit_tsumo(house: House, tid: TileId) {
		console.log('commit_tsumo', this.state.turn, house, tid);
		this.state.tilesCount--;
		this.state.turn = house;
		if (house === this.myHouse) {
			this.myHandTiles.push(tid);
		} else {
			this.state.handTiles[house].push(0);
		}
	}

	public commit_dahai(house: House, tid: TileId, riichi = false) {
		console.log('commit_dahai', this.state.turn, house, tid, riichi);
		if (this.state.turn !== house) throw new PlayerGameEngine.InvalidOperationError();

		if (riichi) {
			this.state.riichis[house] = true;
		}

		if (house === this.myHouse) {
			this.myHandTiles.splice(this.myHandTiles.indexOf(tid), 1);
			this.state.hoTiles[this.myHouse].push(tid);
		} else {
			this.state.handTiles[house].pop();
			this.state.hoTiles[house].push(tid);
		}

		this.state.turn = null;

		if (house === this.myHouse) {
			this.state.canRon = null;
			this.state.canPon = null;
			this.state.canKan = null;
			this.state.canCii = null;
		} else {
			const canRon = Common.isAgarikei(this.myHandTiles.concat(tid).map(id => $type(id)));
			const canPon = !this.isMeRiichi && this.myHandTileTypes.filter(t => t === $type(tid)).length === 2;
			const canKan = !this.isMeRiichi && this.myHandTileTypes.filter(t => t === $type(tid)).length === 3;
			const canCii = !this.isMeRiichi && house === Common.prevHouse(this.myHouse) &&
				Common.SHUNTU_PATTERNS.some(pattern =>
					pattern.includes($type(tid)) &&
					pattern.filter(t => this.myHandTileTypes.includes(t)).length >= 2);

			this.state.canRon = canRon ? { callee: house } : null;
			this.state.canPon = canPon ? { callee: house } : null;
			this.state.canKan = canKan ? { callee: house } : null;
			this.state.canCii = canCii ? { callee: house } : null;
		}
	}

	public commit_tsumoHora(house: House, handTiles: TileId[], tsumoTile: TileId): KyokuResult {
		console.log('commit_tsumoHora', this.state.turn, house);

		const yakus = calcYakusWithDetail({
			seatWind: house,
			handTiles: handTiles.map(id => $type(id)),
			huros: this.state.huros[house].map(convertHuroForCalcYaku),
			tsumoTile: $type(tsumoTile),
			ronTile: null,
			firstTurn: this.state.firstTurnFlags[house],
			riichi: this.state.riichis[house],
			doubleRiichi: this.state.doubleRiichis[house],
			ippatsu: this.state.ippatsus[house],
			rinshan: this.state.rinshanFlags[house],
			haitei: this.state.tilesCount == 0,
		});
		const doraCount =
			Common.calcOwnedDoraCount(handTiles.map(id => $type(id)), this.state.huros[house], this.doras) +
			Common.calcRedDoraCount(handTiles, this.state.huros[house]);
		const pointDeltas = Common.calcTsumoHoraPointDeltas(house, yakus);
		this.state.points.e += pointDeltas.e;
		this.state.points.s += pointDeltas.s;
		this.state.points.w += pointDeltas.w;
		this.state.points.n += pointDeltas.n;

		return {
			yakus: yakus.yakus,
			doraCount,
			pointDeltas,
		};
	}

	/**
	 * ロンします
	 * @param callers ロンした人
	 * @param callee 牌を捨てた人
	 */
	public commit_ronHora(callers: House[], callee: House, handTiles: {
		e: TileId[];
		s: TileId[];
		w: TileId[];
		n: TileId[];
	}): Record<House, KyokuResult | null> {
		console.log('commit_ronHora', this.state.turn, callers, callee);

		this.state.canRon = null;

		const resultMap: Record<House, KyokuResult> = {
			e: { yakus: [], doraCount: 0, pointDeltas: { e: 0, s: 0, w: 0, n: 0 } },
			s: { yakus: [], doraCount: 0, pointDeltas: { e: 0, s: 0, w: 0, n: 0 } },
			w: { yakus: [], doraCount: 0, pointDeltas: { e: 0, s: 0, w: 0, n: 0 } },
			n: { yakus: [], doraCount: 0, pointDeltas: { e: 0, s: 0, w: 0, n: 0 } },
		};

		const ronTile = $type(this.state.hoTiles[callee].at(-1)!);
		for (const house of callers) {
			const yakus = calcYakusWithDetail({
				seatWind: house,
				handTiles: handTiles[house].map(id => $type(id)).concat([ronTile]),
				huros: this.state.huros[house].map(convertHuroForCalcYaku),
				tsumoTile: null,
				ronTile: ronTile,
				firstTurn: this.state.firstTurnFlags[house],
				riichi: this.state.riichis[house],
				doubleRiichi: this.state.doubleRiichis[house],
				ippatsu: this.state.ippatsus[house],
				hotei: this.state.tilesCount == 0,
			});
			const doraCount =
				Common.calcOwnedDoraCount(handTiles[house].map(id => $type(id)), this.state.huros[house], this.doras) +
				Common.calcRedDoraCount(handTiles[house], this.state.huros[house]);
			const point = Common.calcPoint(yakus, house === 'e');
			this.state.points[callee] -= point;
			this.state.points[house] += point;
			resultMap[house].yakus = yakus.yakus;
			resultMap[house].doraCount = doraCount;
			resultMap[house].pointDeltas[callee] = -point;
			resultMap[house].pointDeltas[house] = point;
		}

		return {
			e: callers.includes('e') ? resultMap.e : null,
			s: callers.includes('s') ? resultMap.s : null,
			w: callers.includes('w') ? resultMap.w : null,
			n: callers.includes('n') ? resultMap.n : null,
		};
	}

	/**
	 * ポンします
	 * @param caller ポンした人
	 * @param callee 牌を捨てた人
	 */
	public commit_pon(caller: House, callee: House, tiles: readonly [TileId, TileId, TileId]) {
		this.state.canPon = null;

		this.state.hoTiles[callee].pop();
		if (caller === this.myHouse) {
			if (this.myHandTiles.includes(tiles[0])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[0]), 1);
			if (this.myHandTiles.includes(tiles[1])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[1]), 1);
			if (this.myHandTiles.includes(tiles[2])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[2]), 1);
		} else {
			this.state.handTiles[caller].unshift();
			this.state.handTiles[caller].unshift();
		}
		this.state.huros[caller].push({ type: 'pon', tiles: tiles, from: callee });

		this.state.turn = caller;
	}

	/**
	 * 大明槓します
	 * @param caller 大明槓した人
	 * @param callee 牌を捨てた人
	 */
	public commit_kan(caller: House, callee: House, tiles: readonly [TileId, TileId, TileId, TileId], rinsyan: TileId) {
		this.state.canKan = null;

		this.state.hoTiles[callee].pop();
		if (caller === this.myHouse) {
			if (this.myHandTiles.includes(tiles[0])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[0]), 1);
			if (this.myHandTiles.includes(tiles[1])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[1]), 1);
			if (this.myHandTiles.includes(tiles[2])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[2]), 1);
			if (this.myHandTiles.includes(tiles[3])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[3]), 1);
		} else {
			this.state.handTiles[caller].unshift();
			this.state.handTiles[caller].unshift();
			this.state.handTiles[caller].unshift();
		}
		this.state.huros[caller].push({ type: 'minkan', tiles: tiles, from: callee });

		this.state.turn = caller;
	}

	public commit_kakan(house: House, tiles: TileId[], rinsyan: TileId) {
		console.log('commit_kakan', this.state.turn, house, tiles);
	}

	public commit_ankan(house: House, tiles: TileId[], rinsyan: TileId) {
		console.log('commit_kakan', this.state.turn, house, tiles);
	}

	/**
	 * チーします
	 * @param caller チーした人
	 * @param callee 牌を捨てた人
	 */
	public commit_cii(caller: House, callee: House, tiles: readonly [TileId, TileId, TileId]) {
		this.state.canCii = null;

		this.state.hoTiles[callee].pop();
		if (caller === this.myHouse) {
			if (this.myHandTiles.includes(tiles[0])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[0]), 1);
			if (this.myHandTiles.includes(tiles[1])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[1]), 1);
			if (this.myHandTiles.includes(tiles[2])) this.myHandTiles.splice(this.myHandTiles.indexOf(tiles[2]), 1);
		} else {
			this.state.handTiles[caller].unshift();
			this.state.handTiles[caller].unshift();
		}
		this.state.huros[caller].push({ type: 'cii', tiles: tiles, from: callee });

		this.state.turn = caller;
	}

	public commit_nop() {
		this.state.canRon = null;
		this.state.canPon = null;
		this.state.canKan = null;
		this.state.canCii = null;
	}

	public get isMenzen(): boolean {
		const calls = ['pon', 'cii', 'minkan'];
		return this.state.huros[this.myHouse].filter(h => calls.includes(h.type)).length === 0;
	}

	public canRiichi(): boolean {
		if (this.state.turn !== this.myHouse) return false;
		if (this.state.riichis[this.myHouse]) return false;
		if (this.state.points[this.myHouse] < 1000) return false;
		if (!this.isMenzen) return false;
		if (Common.getTilesForRiichi(this.myHandTileTypes).length === 0) return false;
		return true;
	}

	public canAnkan(): boolean {
		if (this.state.turn !== this.myHouse) return false;
		return this.myHandTiles
			.filter(t => this.myHandTiles
				.filter(tt => $type(tt) === $type(t)).length >= 4).length > 0;
	}

	public canKakan(): boolean {
		if (this.state.turn !== this.myHouse) return false;
		return this.state.huros[this.myHouse].filter(h => h.type === 'pon' && this.myHandTileTypes.includes($type(h.tiles[0]))).length > 0;
	}

	public getAnkanableTiles(): TileId[] {
		return this.myHandTiles.filter(t => this.myHandTiles.filter(tt => $type(tt) === $type(t)).length >= 4);
	}

	public getKakanableTiles(): TileId[] {
		return this.myHandTiles.filter(t => this.state.huros[this.myHouse].some(h => h.type === 'pon' && $type(t) === $type(h.tiles[0])));
	}

	public getState(): PlayerState {
		return structuredClone(this.state);
	}
}
