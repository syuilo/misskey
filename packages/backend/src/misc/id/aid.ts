/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// AID
// 長さ8の[2000年1月1日からの経過ミリ秒をbase36でエンコードしたもの] + 長さ2の[ノイズ文字列]

import * as crypto from 'node:crypto';
import { parseBigInt36 } from '@/misc/bigint.js';

export const aidRegExp = /^[0-9a-z]{10}$/;

const TIME2000 = 946684800000;
let counter = crypto.randomBytes(2).readUInt16LE(0);

function getTime(time: number): string {
	time = time - TIME2000;
	if (time < 0) time = 0;

	return time.toString(36).padStart(8, '0');
}

function getNoise(): string {
	return counter.toString(36).padStart(2, '0').slice(-2);
}

export function genAid(t: number): string {
	if (isNaN(t)) throw new Error('Failed to create AID: Invalid Date');
	counter++;
	return getTime(t) + getNoise();
}

export function parseAid(id: string): { date: Date; } {
	const time = parseInt(id.slice(0, 8), 36) + TIME2000;
	return { date: new Date(time) };
}

export function parseAidFull(id: string): { date: number; additional: bigint; } {
	const date = parseInt(id.slice(0, 8), 36) + TIME2000;
	const additional = parseBigInt36(id.slice(8, 10));
	return { date, additional };
}

export function isSafeAidT(t: number): boolean {
	return t > TIME2000;
}
