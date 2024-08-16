/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TileType } from './common.js';

export type Log = {
	time: number;
	player: 1 | 2 | 3 | 4;
	operation: 'dahai';
	tile: string;
};

export type SerializedLog = number[];

export const TILE_MAP: Record<TileType, number> = {
	'm1': 1,
	'm2': 2,
	'm3': 3,
	'm4': 4,
	'm5': 5,
	'm6': 6,
	'm7': 7,
	'm8': 8,
	'm9': 9,
	'p1': 10,
	'p2': 11,
	'p3': 12,
	'p4': 13,
	'p5': 14,
	'p6': 15,
	'p7': 16,
	'p8': 17,
	'p9': 18,
	's1': 19,
	's2': 20,
	's3': 21,
	's4': 22,
	's5': 23,
	's6': 24,
	's7': 25,
	's8': 26,
	's9': 27,
	'e': 28,
	's': 29,
	'w': 30,
	'n': 31,
	'haku': 32,
	'hatsu': 33,
	'chun': 34,
};

export function serializeTile(tile: TileType): number {
	return TILE_MAP[tile];
}

export function deserializeTile(tile: number): TileType {
	return Object.keys(TILE_MAP).find(key => TILE_MAP[key as TileType] === tile) as TileType;
}

export function serializeLogs(logs: Log[]) {
	const _logs: number[][] = [];

	for (let i = 0; i < logs.length; i++) {
		const log = logs[i];
		const timeDelta = i === 0 ? log.time : log.time - logs[i - 1].time;

		switch (log.operation) {
			case 'dahai':
				_logs.push([timeDelta, log.player, 1, serializeTile(log.tile)]);
				break;
			//case 'surrender':
			//	_logs.push([timeDelta, log.player, 1]);
			//	break;
		}
	}

	return _logs;
}

export function deserializeLogs(logs: SerializedLog[]) {
	const _logs: Log[] = [];

	let time = 0;

	for (const log of logs) {
		const timeDelta = log[0];
		time += timeDelta;

		const player = log[1];
		const operation = log[2];

		switch (operation) {
			case 1:
				_logs.push({
					time,
					player: player,
					operation: 'dahai',
					tile: log[3],
				});
				break;
			//case 1:
			//	_logs.push({
			//		time,
			//		player: player === 1,
			//		operation: 'surrender',
			//	});
			//	break;
		}
	}

	return _logs;
}
