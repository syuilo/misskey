/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'node:assert';
import * as Common from '../src/common.js';
import { TileType, TileId } from '../src/common.js';
import { MasterGameEngine, MasterState, INITIAL_POINT } from '../src/engine.master.js';

const TILES = [71, 132, 108, 51, 39, 19, 3, 86, 104, 18, 50, 7, 45, 82, 43, 34, 111, 78, 53, 105, 126, 91, 112, 75, 119, 55, 95, 93, 65, 9, 66, 52, 79, 32, 99, 109, 56, 5, 101, 92, 1, 37, 62, 23, 27, 117, 77, 14, 31, 96, 120, 130, 29, 135, 100, 17, 102, 124, 59, 89, 49, 115, 107, 97, 90, 48, 25, 110, 68, 15, 74, 129, 69, 61, 73, 81, 11, 41, 44, 84, 13, 40, 33, 58, 30, 8, 38, 10, 87, 125, 57, 121, 21, 2, 54, 46, 22, 4, 133, 16, 76, 70, 60, 103, 114, 122, 24, 88, 36, 123, 47, 12, 128, 118, 116, 63, 26, 94, 67, 131, 64, 35, 113, 134, 6, 127, 80, 72, 42, 98, 85, 20, 106, 136, 83, 28];

const INITIAL_TILES_LENGTH = 69;

class TileSetBuilder {
	private restTiles = [...TILES];

	private handTiles: {
		e: TileId[] | null,
		s: TileId[] | null,
		w: TileId[] | null,
		n: TileId[] | null,
	} = {
		e: null,
		s: null,
		w: null,
		n: null,
	};

	private tiles = new Map<number, TileId>;

	public setHandTiles(house: Common.House, tileTypes: TileType[]): this {
		if (this.handTiles[house] != null) {
			throw new TypeError(`Hand tiles of house '${house}' is already set`);
		}

		const tiles = tileTypes.map(tile => {
			const index = this.restTiles.findIndex(tileId => Common.TILE_ID_MAP.get(tileId)!.t == tile);
			if (index == -1) {
				throw new TypeError(`Tile '${tile}' is not left`);
			}
			return this.restTiles.splice(index, 1)[0];
		});

		this.handTiles[house] = tiles;

		return this;
	}

	/**
	 * 山のn番目（0始まり）の牌を指定する。nが負の場合、海底を-1として海底側から数える
	 */
	public setTile(n: number, tileType: TileType): this {
		if (n < 0) {
			n += INITIAL_TILES_LENGTH;
		}

		if (n < 0 || n >= INITIAL_TILES_LENGTH) {
			throw new RangeError(`Cannot set ${n}th tile`);
		}

		const indexInTiles = INITIAL_TILES_LENGTH - n - 1;

		if (this.tiles.has(indexInTiles)) {
			throw new TypeError(`${n}th tile is already set`);
		}

		const indexInRestTiles = this.restTiles.findIndex(tileId => Common.TILE_ID_MAP.get(tileId)!.t == tileType);
		if (indexInRestTiles == -1) {
			throw new TypeError(`Tile '${tileType}' is not left`);
		}
		this.tiles.set(indexInTiles, this.restTiles.splice(indexInRestTiles, 1)[0]);

		return this;
	}

	public build(): Pick<MasterState, 'tiles' | 'kingTiles' | 'handTiles'> {
		const handTiles: MasterState['handTiles'] = {
			e: this.handTiles.e ?? this.restTiles.splice(0, 14),
			s: this.handTiles.s ?? this.restTiles.splice(0, 13),
			w: this.handTiles.w ?? this.restTiles.splice(0, 13),
			n: this.handTiles.n ?? this.restTiles.splice(0, 13),
		};

		const kingTiles: MasterState['kingTiles'] = this.restTiles.splice(0, 14);

		const tiles = [...this.restTiles];
		for (const [index, tile] of [...this.tiles.entries()].sort(([index1], [index2]) => index1 - index2)) {
			tiles.splice(index, 0, tile);
		}

		return {
			tiles,
			kingTiles,
			handTiles,
		};
	}
}

function tsumogiri(engine: MasterGameEngine, riichi = false): void {
	const house = engine.turn;
	if (house == null) {
		throw new Error('No one\'s turn');
	}
	engine.commit_dahai(house, engine.handTiles[house].at(-1)!, riichi);
}

function tsumogiriAndIgnore(engine: MasterGameEngine, riichi = false): void {
	tsumogiri(engine, riichi);
	if (engine.askings.pon != null || engine.askings.cii != null || engine.askings.kan != null || engine.askings.ron != null) {
		engine.commit_resolveCallingInterruption({
			pon: false,
			cii: false,
			kan: false,
			ron: [],
		});
	}
}

describe('Master game engine', () => {
	it('tenho', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder().setHandTiles('e', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3']).build(),
		));
		expect(engine.commit_tsumoHora('e', false).yakus.yakuNames).toEqual(['tenho']);
		expect(engine.$state.points).toEqual({
			e: INITIAL_POINT + 48000,
			s: INITIAL_POINT - 16000,
			w: INITIAL_POINT - 16000,
			n: INITIAL_POINT - 16000,
		});
	});

	it('chiho', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder()
				.setHandTiles('s', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3'])
				.setTile(0, 'm3')
				.build(),
		));
		tsumogiriAndIgnore(engine);
		expect(engine.commit_tsumoHora('s', false).yakus.yakuNames).toEqual(['chiho']);
		expect(engine.$state.points).toEqual({
			e: INITIAL_POINT - 16000,
			s: INITIAL_POINT + 32000,
			w: INITIAL_POINT - 8000,
			n: INITIAL_POINT - 8000,
		});
	});

	it('rinshan', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder()
			.setHandTiles('e', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'n'])
			.setTile(-1, 'm3')
			.build(),
		));
		engine.commit_ankan('e', engine.$state.handTiles.e.at(-1)!);
		expect(engine.commit_tsumoHora('e', false).yakus.yakuNames).toEqual(['tsumo', 'rinshan']);
		expect(engine.$state.points).toEqual({
			e: INITIAL_POINT + 3000,
			s: INITIAL_POINT - 1000,
			w: INITIAL_POINT - 1000,
			n: INITIAL_POINT - 1000,
		});
	});

	it('double-riichi ippatsu tsumo', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder()
			.setHandTiles('e', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 's'])
			.setTile(3, 'm3')
			.build(),
		));
		tsumogiriAndIgnore(engine, true);
		tsumogiriAndIgnore(engine);
		tsumogiriAndIgnore(engine);
		tsumogiriAndIgnore(engine);
		expect(engine.commit_tsumoHora('e', false).yakus.yakuNames).toEqual(['tsumo', 'double-riichi', 'ippatsu']);
		expect(engine.$state.points).toEqual({
			e: INITIAL_POINT + 12000,
			s: INITIAL_POINT - 4000,
			w: INITIAL_POINT - 4000,
			n: INITIAL_POINT - 4000,
		});
	});

	it('double-riichi haitei tsumo', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder()
				.setHandTiles('s', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3'])
				.setTile(-1, 'm3')
				.build(),
		));
		tsumogiriAndIgnore(engine);
		tsumogiriAndIgnore(engine, true);
		while (engine.$state.tiles.length > 0) {
			tsumogiriAndIgnore(engine);
		}
		expect(engine.commit_tsumoHora('s', false).yakus.yakuNames).toEqual(['tsumo', 'double-riichi', 'haitei']);
		expect(engine.$state.points).toEqual({
			e: INITIAL_POINT - 4000,
			s: INITIAL_POINT + 8000,
			w: INITIAL_POINT - 2000,
			n: INITIAL_POINT - 2000,
		});
	});

	it('double-riichi hotei', () => {
		const engine = new MasterGameEngine(MasterGameEngine.createInitialState(
			new TileSetBuilder()
				.setHandTiles('e', ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 's'])
				.setHandTiles('s', ['m3', 'm6', 'p2', 'p5', 'p8', 's4',  'e', 's', 'w', 'haku', 'hatsu', 'chun', 'chun'])
				.setTile(-1, 'm3')
				.build(),
		));
		tsumogiriAndIgnore(engine, true);
		while (engine.$state.tiles.length > 0) {
			tsumogiriAndIgnore(engine);
		}
		tsumogiri(engine);
		expect(engine.commit_resolveCallingInterruption({
			pon: false,
			cii: false,
			kan: false,
			ron: ['e'],
		}, false).yakus?.e?.yakuNames).toEqual(['double-riichi', 'hotei']);
		expect(engine.$state.points).toEqual({
			e: INITIAL_POINT + 6000,
			s: INITIAL_POINT - 6000,
			w: INITIAL_POINT,
			n: INITIAL_POINT,
		});
	});
});
