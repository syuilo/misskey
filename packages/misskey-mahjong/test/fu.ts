/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import assert from "node:assert"
import { calcWaitPatterns } from "../src/common.fu"
import { analyzeFourMentsuOneJyantou } from "../src/common"

describe('Fu', () => {
	describe('Wait patterns', () => {
		it('Ryanmen', () => {
			const fourMentsuOneJyantou = analyzeFourMentsuOneJyantou(
				['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's1', 's1', 's7', 's8', 's9']
			)[0];
			assert.deepStrictEqual(calcWaitPatterns(fourMentsuOneJyantou, 's9'), [{
				...fourMentsuOneJyantou,
				waitedFor: 'mentsu',
				agariTile: 's9',
				waitedTaatsu: ['s7', 's8'],
			}]);
		});

		it('Kanchan', () => {
			const fourMentsuOneJyantou = analyzeFourMentsuOneJyantou(
				['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's1', 's1', 's7', 's8', 's9']
			)[0];
			assert.deepStrictEqual(calcWaitPatterns(fourMentsuOneJyantou, 's8'), [{
				...fourMentsuOneJyantou,
				waitedFor: 'mentsu',
				agariTile: 's8',
				waitedTaatsu: ['s7', 's9'],
			}]);
		})

		it('Penchan', () => {
			const fourMentsuOneJyantou = analyzeFourMentsuOneJyantou(
				['m2', 'm3', 'm4', 'p6', 'p7', 'p8', 'p5', 'p6', 'p7', 's1', 's1', 's7', 's8', 's9']
			)[0];
			assert.deepStrictEqual(calcWaitPatterns(fourMentsuOneJyantou, 's7'), [{
				...fourMentsuOneJyantou,
				waitedFor: 'mentsu',
				agariTile: 's7',
				waitedTaatsu: ['s8', 's9'],
			}]);
		})

		it('Tanki', () => {
			const fourMentsuOneJyantou = analyzeFourMentsuOneJyantou(
				['m1', 'm1', 'm1', 'm2', 'm2', 'm2', 'm3', 'm3', 'm3', 'haku', 'haku', 'haku', 'e', 'e']
			)[0];
			assert.deepStrictEqual(calcWaitPatterns(fourMentsuOneJyantou, 'e'), [{
				...fourMentsuOneJyantou,
				waitedFor: 'head',
				agariTile: 'e',
			}]);
		});

		it('Nobetan', () => {
			const fourMentsuOneJyantou = analyzeFourMentsuOneJyantou(
				['m1', 'm2', 'm3', 'm5', 'm6', 'm7', 'p2', 'p3', 'p4', 's3', 's4', 's5', 's6', 's6']
			)[0];
			assert.deepStrictEqual(calcWaitPatterns(fourMentsuOneJyantou, 's6'), [{
				...fourMentsuOneJyantou,
				waitedFor: 'head',
				agariTile: 's6',
			}]);
		});
	});
});
