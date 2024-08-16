/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'node:assert';
import { calcYakus } from '../src/common.yaku.js';

describe('Yaku', () => {
	describe('Riichi', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				ronTile: 'm3',
				riichi: true,
			}), ['riichi']);
		});
	});

	describe('double-riichi', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				ronTile: 'm3',
				riichi: true,
				doubleRiichi: true,
			}), ['double-riichi']);
		});
	});

	describe('tsumo', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
				riichi: false,
			}), ['tsumo']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm2', 'm2', 'm8', 'm8', 'p5', 'p5', 'p7', 'p7', 's9', 's9', 'p2', 'p2'],
				huros: [],
				tsumoTile: 'p2',
			}).includes('tsumo'), true);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm2', 'm2', 'm8', 'm8', 'p5', 'p5', 'p7', 'p7', 's9', 's9', 'p2', 'p2'],
				huros: [],
				ronTile: 'p2',
			}).includes('tsumo'), false);
		})
	});

	describe('white', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3'],
				huros: [{type: 'ankan', tile: 'haku'}],
				tsumoTile: 'm3',
				riichi: true,
			}).includes('white'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3'],
				huros: [{type: 'pon', tile: 'haku'}],
				tsumoTile: 'm3',
				riichi: false,
			}), ['white']);
		});
	});

	describe('red', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3'],
				huros: [{type: 'ankan', tile: 'chun'}],
				tsumoTile: 'm3',
				riichi: true,
			}).includes('red'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3'],
				huros: [{type: 'pon', tile: 'chun'}],
				tsumoTile: 'm3',
				riichi: false,
			}), ['red']);
		});
	});

	describe('green', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3'],
				huros: [{type: 'ankan', tile: 'hatsu'}],
				tsumoTile: 'm3',
				riichi: true,
			}).includes('green'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3'],
				huros: [{type: 'pon', tile: 'hatsu'}],
				tsumoTile: 'm3',
				riichi: false,
			}), ['green']);
		});
	});

	describe('field-wind', () => {
		it('north', () => {
			assert.deepStrictEqual(calcYakus({
				fieldWind: 'n',
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3', 'n', 'n', 'n'],
				huros: [],
				tsumoTile: 'n',
			}).includes('field-wind-n'), true);
		});
		it('east', () => {
			assert.deepStrictEqual(calcYakus({
				fieldWind: 'e',
				seatWind: 'n',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3', 'e', 'e', 'e'],
				huros: [],
				tsumoTile: 'e',
			}).includes('field-wind-e'), true);
		});
		it('south', () => {
			assert.deepStrictEqual(calcYakus({
				fieldWind: 's',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3', 's', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}).includes('field-wind-s'), true);
		});
		it('west', () => {
			assert.deepStrictEqual(calcYakus({
				fieldWind: 'w',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3', 'w', 'w', 'w'],
				huros: [],
				tsumoTile: 'w',
			}).includes('field-wind-w'), true);
		});
	});
	describe('seat-wind', () => {
		it('north', () => {
			assert.deepStrictEqual(calcYakus({
				fieldWind: 'e',
				seatWind: 'n',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3', 'n', 'n', 'n'],
				huros: [],
				ronTile: 'n',
			}).includes('seat-wind-n'), true);
		});
		it('east', () => {
			assert.deepStrictEqual(calcYakus({
				fieldWind: 's',
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3', 'e', 'e', 'e'],
				huros: [],
				ronTile: 'e',
			}).includes('seat-wind-e'), true);
		});
		it('south', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 's',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3', 's', 's', 's'],
				huros: [],
				ronTile: 's',
			}).includes('seat-wind-s'), true);
		});
		it('west', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'w',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3', 'w', 'w', 'w'],
				huros: [],
				ronTile: 'w',
			}).includes('seat-wind-w'), true);
		});
	});

	describe('ippatsu', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				riichi: true,
				tsumoTile: 'm3',
				ippatsu: true,
			}).includes('ippatsu'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				riichi: true,
				ronTile: 'm3',
				ippatsu: true,
			}).includes('ippatsu'), true);
		});
		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
				riichi: true,
			}).includes('ippatsu'), false);
		});
	});

	describe('rinshan', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'n',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3'],
				huros: [{
					type: 'ankan',
					tile: 'n'
				}],
				tsumoTile: 'm3',
				rinshan: true,
			}).includes('rinshan'), true);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'n',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'm3', 'm3'],
				huros: [{
					type: 'ankan',
					tile: 'n'
				}],
				tsumoTile: 'm3',
			}).includes('rinshan'), false);
		});
	});

	describe('haitei', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
				haitei: true,
			}).includes('haitei'), true);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
				haitei: false,
			}).includes('haitei'), false);
		});
	});

	describe('hotei', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				ronTile: 'm3',
				hotei: true,
			}).includes('hotei'), true);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				ronTile: 'm3',
				hotei: false,
			}).includes('hotei'), false);
		});
	});

	describe('tanyao', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm2', 'm2', 'p6', 'p7', 'p8', 's3', 's3', 's3', 's4', 's5', 's6', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
			}).includes('tanyao'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['p6', 'p7', 'p8', 's3', 's3', 's3', 's4', 's5', 's6', 'm3', 'm3'],
				huros: [{type: 'pon', tile: 'm2'}],
				tsumoTile: 'm3',
			}).includes('tanyao'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm2', 'm3', 'm3', 'm8', 'm8', 'p5', 'p5', 'p7', 'p7', 's8', 's8', 'p2', 'p2'],
				huros: [],
				tsumoTile: 'p2',
			}).includes('tanyao'), true);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p7', 'p8', 's3', 's3', 's3', 's4', 's5', 's6', 'm3', 'm3'],
				ippatsu: true,
				huros: [],
				tsumoTile: 'm1',
			}).includes('tanyao'), false);
		});
	});

	describe('pinfu', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's9', 's9', 's5', 's6', 's7'],
				huros: [],
				tsumoTile: 's7',
			}).includes('pinfu'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's9', 's9', 's5', 's6', 's7'],
				huros: [],
				ronTile: 's7',
			}).includes('pinfu'), true);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'p6', 'p6', 'p6', 'p5', 'p6', 'p7', 's9', 's9', 's5', 's6', 's7'],
				huros: [],
				tsumoTile: 's7',
			}).includes('pinfu'), false);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'p6', 'p6', 'p6', 'p5', 'p6', 'p7', 's9', 's9', 's7', 's8', 's9'],
				huros: [],
				tsumoTile: 's7',
			}).includes('pinfu'), false);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's9', 's9', 's5', 's6', 's7'],
				huros: [],
				ronTile: 's6',
			}).includes('pinfu'), false);
		});
	});

	describe('iipeko', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'm2', 'm3', 'm4', 'p5', 'p6', 'p7', 's9', 's9', 's4', 's5', 's6'],
				huros: [],
				tsumoTile: 's6',
			}).includes('iipeko'), true);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'p5', 'p6', 'p7', 's9', 's9', 's4', 's5', 's6'],
			    	huros: [{type: 'cii', tiles: ['m2','m3','m4']}],
				tsumoTile: 's6',
			}).includes('iipeko'), false);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'm2', 'm3', 'm4', 'p5', 'p6', 'p7', 'p5', 'p6', 'p7', 'p1', 'p1'],
				huros: [],
				tsumoTile: 'p1',
			}).includes('iipeko'), false);
		});
	});
	describe('ryanpeko', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'm2', 'm3', 'm4', 'p5', 'p6', 'p7', 'p5', 'p6', 'p7', 'p1', 'p1'],
				huros: [],
				tsumoTile: 'p1',
			}).includes('ryampeko'), true);
		});
		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 'p5', 'p6', 'p7', 'p5', 'p6', 'p7', 'p1', 'p1'],
			    	huros: [{type: 'cii', tiles: ['m2','m3','m4']}],
				tsumoTile: 'p1',
			}).includes('ryampeko'), false);
		});
	});

	describe('sanshoku-dojun', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p1', 'p2', 'p3', 's1', 's2', 's3', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
			}).includes('sanshoku-dojun'), true);

		});
	});

	describe('sanshoku-doko', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm2', 'm2', 'p2', 'p2', 'p2', 's2', 's2', 's2', 's4', 's5', 's6', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
			}).includes('sanshoku-doko'), true);

		});
	});

	describe('ittsu', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
			}).includes('ittsu'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm3', 'm4', 's4', 's5', 's6', 's7', 's8', 's9', 'm3', 'm3'],
				huros: [{type: 'cii', tiles:['s1', 's2', 's3']}],
				tsumoTile: 'm3',
			}).includes('ittsu'), true);
		});
	});

	describe('chanta', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 's1', 's2', 's3', 's7', 's8', 's9', 'p7', 'p8', 'p9', 'haku', 'haku'],
				huros: [],
				tsumoTile: 'haku',
			}).includes('chanta'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 's1', 's2', 's3', 's7', 's8', 's9', 'haku', 'haku'],
				huros: [{type: 'pon', tile : 'p9'}],
				tsumoTile: 'haku',
			}).includes('chanta'), true);
		});
	});

	describe('junchan', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 's1', 's2', 's3', 's7', 's8', 's9', 'p7', 'p8', 'p9', 'm9', 'm9'],
				huros: [],
				tsumoTile: 'm9',
			}).includes('junchan'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 's1', 's2', 's3', 's7', 's8', 's9', 'm9', 'm9'],
				huros: [{type: 'pon', tile : 'p9'}],
				tsumoTile: 'm9',
			}).includes('junchan'), true);
		});
	});

	describe('chitoitsu', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm2', 'm2', 'm8', 'm8', 'p5', 'p5', 'p7', 'p7', 's9', 's9', 'p2', 'p2'],
				huros: [],
				tsumoTile: 'p2',
			}).includes('chitoitsu'), true);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				handTiles: ['m2', 'm3', 'm4', 'm2', 'm3', 'm4', 'p5', 'p6', 'p7', 'p5', 'p6', 'p7', 'p1', 'p1'],
				huros: [],
				tsumoTile: 'p1',
			}).includes('chitoitsu'), false)
		})
	});

    	describe('toitoi', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'p5', 'p5', 'p5', 's7', 's7', 's7', 'p2', 'p2'],
				huros: [],
				ronTile: 's7',
			}).includes('toitoi'), true);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm2', 'm2', 'p5', 'p5', 'p5', 's7', 's7', 's7', 'p2', 'p2'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 'p2',
			}).includes('toitoi'), true);
		});
	});

    	describe('sananko', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'p5', 'p5', 'p5', 's7', 's8', 's9', 'p2', 'p2'],
				huros: [],
				tsumoTile: 'p2',
			}).includes('sananko'), true);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'p5', 'p5', 'p5', 's7', 's8', 's9', 'p2', 'p2'],
				huros: [{type: 'ankan', tile: 'm2'}],
				tsumoTile: 'p2',
			}).includes('sananko'), true);
		});
		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'p5', 'p5', 'p5', 's7', 's8', 's9', 'p2', 'p2'],
				huros: [{type: 'minkan', tile: 'm2'}],
				tsumoTile: 'p2',
			}).includes('sananko'), false);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'p5', 'p5', 'p5', 's7', 's8', 's9', 'p2', 'p2'],
				huros: [],
				ronTile: 'm2',
			}).includes('sananko'), false);
		});
	});

    	describe('honroto', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm9', 'm9', 'm9', 'p9', 'p9', 'p9', 'hatsu', 'hatsu', 'hatsu', 'n', 'n'],
				huros: [],
				ronTile: 'hatsu',
			}).includes('honroto'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m9', 'm9', 'm9', 'p9', 'p9', 'p9', 'hatsu', 'hatsu', 'hatsu', 'n', 'n'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 'p9',
			}).includes('honroto'), true);
		});
	});

    	describe('sankantsu', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m9', 'm9', 'm9', 'n', 'n'],
				huros: [{type: 'ankan', tile: 'm1'}, {type: 'ankan', tile: 'm2'}, {type: 'minkan', tile: 'm3'}],
				tsumoTile: 'm9',
			}).includes('sankantsu'), true);
		});
	});

    	describe('honitsu', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm5', 'm6', 'm7', 'm9', 'm9', 'm9', 'n', 'n'],
				huros: [{type: 'pon', tile: 'w'}],
				tsumoTile: 'n',
			}).includes('honitsu'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm5', 'm5', 'm6', 'm6', 'm7', 'm7', 'm9', 'm9', 'w', 'w', 'n', 'n'],
				huros: [],
				tsumoTile: 'n',
			}).includes('honitsu'), true);
		});
		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm5', 'm6', 'm7', 'm9', 'm9', 'm9', 'm8', 'm8'],
				huros: [{type: 'pon', tile: 'm3'}],
				tsumoTile: 'm8',
			}).includes('honitsu'), false);
		});
	});

	describe('chinitsu', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm5', 'm6', 'm7', 'm9', 'm9', 'm9', 'm8', 'm8'],
				huros: [{type: 'pon', tile: 'm3'}],
				tsumoTile: 'm8',
			}).includes('chinitsu'), true);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm2', 'm2', 'm4', 'm4', 'm5', 'm5', 'm6', 'm6', 'm7', 'm7', 'm9', 'm9'],
				huros: [],
				tsumoTile: 'm9',
			}).includes('chinitsu'), true);
		});
	});

	describe('shosangen', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
			      	seatWind: 'e',
				handTiles: ['haku', 'haku', 'haku', 'chun', 'chun', 'hatsu', 'hatsu', 'hatsu', 'm1', 'm1', 'm1', 'm2', 'm3', 'm4'] ,
				huros: [],
				tsumoTile: 'm2',
			}).includes('shosangen'), true);
		});
	});

	describe('kokushi', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
			        handTiles: ['m1', 'm1', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e', 'm9'] ,
				huros: [],
			        tsumoTile: 'm9',
			}), ['kokushi']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
			        handTiles: ['m1', 'm9', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e', 'm3'] ,
				huros: [],
			        tsumoTile: 'm3',
			}).includes('kokushi'), false);
		});
	});

	describe('kokushi-13', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
			        handTiles: ['m1', 'm9', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e', 'm1'] ,
				huros: [],
			        tsumoTile: 'm1',
			}), ['kokushi-13']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
			        handTiles: ['m1', 'm9', 's1', 's9', 'p1', 'p9', 'haku', 'hatsu', 'chun', 'n', 'w', 's', 'e', 'm9'] ,
				huros: [],
			        tsumoTile: 'm1',
			}).includes('kokushi-13'), false);
		});
	});

	describe('suanko', () => {
		it('valid',() => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'e', 'e'],
			 	huros: [],
				tsumoTile: 'chun',
			}), ['suanko']);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm2', 'm2', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'e', 'e'],
			 	huros: [{type: 'ankan', tile: 'm1'}],
				tsumoTile: 'chun',
			}), ['suanko']);
		});

		it('invalid',() => {
		      	assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'm2', 'm2', 'e', 'e', 'e'],
				huros: [{type: 'pon', tile: 'm1'}],
				ronTile: 'e',
			}).includes('suanko'), false);

		      	assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'm2', 'm2', 'e', 'e', 'e'],
				huros: [],
				ronTile: 'e',
			}).includes('suanko'), false);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'm2', 'm2', 'e', 'e', 'e'],
				huros: [],
				ronTile: 'e',
			}).includes('suanko'), false);
		});
	});

	describe('suanko-tanki', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'm3', 'm3', 'm3', 'haku', 'haku', 'haku', 'e', 'e'],
				huros: [],
				tsumoTile: 'e',
			}), ['suanko-tanki']);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m2', 'm2', 'm2', 'm3', 'm3', 'm3', 'haku', 'haku', 'haku', 'e', 'e'],
				huros: [{type: 'ankan', tile: 'm1'}],
				tsumoTile: 'e',
			}), ['suanko-tanki']);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'm3', 'm3', 'm3', 'haku', 'haku', 'haku', 'e', 'e'],
				huros: [],
				ronTile: 'e',
			}), ['suanko-tanki']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'e', 'e'],
			 	huros: [],
				tsumoTile: 'chun',
			}).includes('suanko-tanki'), false);
		});
	})

	describe('daisangen', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['haku', 'haku', 'haku', 'hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'p2', 'p3', 'p4', 's2', 's2'],
				huros: [],
				tsumoTile: 's2',
			}), ['daisangen']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'chun', 'chun', 'chun', 'p2', 'p2', 'p2', 's2', 's2'],
				huros: [{type: 'pon', tile: 'haku'}],
				tsumoTile: 's2',
 			}), ['daisangen']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
			      	seatWind: 'e',
				handTiles: ['haku', 'haku', 'haku', 'chun', 'chun', 'hatsu', 'hatsu', 'hatsu', 'm1', 'm1', 'm1', 'm2', 'm2', 'm2'] ,
				huros: [],
				tsumoTile: 'm2',
			}).includes('daisangen'), false);
		});
	});

	describe('tsuiso', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['haku', 'haku', 'haku', 'hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}), [ 'suanko-tanki', 'tsuiso']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'haku'}],
				tsumoTile: 's',
			}), ['tsuiso']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['e', 'e', 's', 's', 'w', 'w', 'n', 'n', 'haku', 'haku', 'hatsu', 'hatsu', 'chun', 'chun'],
				huros: [],
				tsumoTile: 's',
			}), ['tsuiso']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}).includes('tsuiso'), false);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 's',
			}).includes('tsuiso'), false);
		});
	})

	describe('shosushi', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'n', 'n', 'n', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}), ['shosushi']);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'n', 'n', 'n', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'e'}],
				tsumoTile: 's',
			}), ['shosushi']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}).includes('shosushi'), false);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 's',
			}).includes('shosushi'), false);
		});
	})

	describe('daisushi', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'n', 'n', 'n', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}), ['suanko', 'daisushi']);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'n', 'n', 'n', 'w', 'w', 'w', 's', 's', 's'],
				huros: [{type: 'pon', tile: 'e'}],
				tsumoTile: 's',
			}), ['daisushi']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'n', 'n', 'n', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [],
				tsumoTile: 's',
			}).includes('daisushi'), false);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['hatsu', 'hatsu', 'hatsu', 'e', 'e', 'e', 'w', 'w', 'w', 's', 's'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 'e',
			}).includes('daisushi'), false);
		});
	})

	describe('ryuiso', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['s2', 's2', 's2', 's2', 's3', 's4', 's6', 's6', 's6', 's8', 's8', 's8', 'hatsu', 'hatsu'],
				huros: [],
				tsumoTile: 'hatsu',
			}), ['ryuiso']);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['s2', 's2', 's2', 's2', 's3', 's3', 's3', 's3', 's4', 's8', 's8'],
				huros: [{type: 'pon', tile: 'hatsu'}],
				tsumoTile: 's8',
			}), ['ryuiso']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
			        handTiles: ['s2', 's2', 's2', 's2', 's3', 's3', 's3', 's3', 's4', 's8', 's8','haku','haku','haku'],
			        huros: [],
				tsumoTile: 's2',
			}).includes('ryuiso'), false);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['s2', 's2', 's2', 's2', 's3', 's3', 's3', 's3', 's4', 's8', 's8'],
				huros: [{type: 'pon', tile: 'haku'}],
				tsumoTile: 's2',
			}).includes('ryuiso'), false);
		});
	})

	describe('chinroto', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
			        handTiles: ['m1', 'm1', 'm1', 'm9', 'm9', 'm9', 's1', 's1', 's1', 's9', 's9', 's9', 'p1', 'p1'],
				huros: [],
				tsumoTile: 'p1',
			}), ['suanko-tanki', 'chinroto']);
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m9', 'm9', 'm9', 's1', 's1', 's1', 's9', 's9', 's9', 'p1', 'p1'],
				huros: [{type: 'pon', tile: 'm1'}],
				tsumoTile: 'p1',
			}), ['chinroto']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
			        handTiles: ['s2', 's2', 's2', 's2', 's3', 's3', 's3', 's3', 's4', 's8', 's8','haku','haku','haku'],
			        huros: [],
				tsumoTile: 's2',
			}).includes('chinroto'), false);
		});
	})

	describe('sukantsu', () => {
		it('valid', () =>{
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['p1', 'p1'],
			        huros: [{type: 'ankan', tile: 'm1'}, {type: 'ankan', tile: 'm2'}, {type: 'minkan', tile: 'm3'}, {type: 'minkan', tile: 'chun'}],
				tsumoTile: 'p1',
			}), ['sukantsu']);
		});
		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm2'],
				huros: [],
				tsumoTile: 'm2',
			}).includes('sukantsu'), false);
		});
	})

	describe('churen', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm5'],
				huros: [],
				tsumoTile: 'm5',
			}), ['churen']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm2'],
				huros: [],
				tsumoTile: 'm2',
			}).includes('churen'), false);
		});
	});

	describe('churen-9', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm1'],
				huros: [],
				tsumoTile: 'm1',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm2'],
				huros: [],
				tsumoTile: 'm2',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm3'],
				huros: [],
				tsumoTile: 'm3',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm4'],
				huros: [],
				tsumoTile: 'm4',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm5'],
				huros: [],
				tsumoTile: 'm5',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm6'],
				huros: [],
				tsumoTile: 'm6',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm7'],
				huros: [],
				tsumoTile: 'm7',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm8'],
				huros: [],
				tsumoTile: 'm8',
			}), ['churen-9']);

			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm9'],
				huros: [],
				tsumoTile: 'm9',
			}), ['churen-9']);
		});

		it('invalid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm1', 'm1', 'm2', 'm3', 'm3', 'm4', 'm6', 'm7', 'm8', 'm9', 'm9', 'm9', 'm5'],
				huros: [],
				tsumoTile: 'm5',
			}).includes('churen-9'), false);
		});
	});

	describe('tenho', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 'e',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
				firstTurn: true,
			}), ['tenho']);
		});
	});

	describe('chiho', () => {
		it('valid', () => {
			assert.deepStrictEqual(calcYakus({
				seatWind: 's',
				handTiles: ['m1', 'm2', 'm3', 'p6', 'p6', 'p6', 's6', 's7', 's8', 'n', 'n', 'n', 'm3', 'm3'],
				huros: [],
				tsumoTile: 'm3',
				firstTurn: true,
			}), ['chiho']);
		});
	});
});
