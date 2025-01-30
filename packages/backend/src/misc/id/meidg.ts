/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parseBigInt16 } from '@/misc/bigint.js';

const CHARS = '0123456789abcdef';

//  4bit Fixed hex value 'g'
// 44bit UNIX Time ms in Hex
// 48bit Random value in Hex
export const meidgRegExp = /^g[0-9a-f]{23}$/;

function getTime(time: number) {
	if (time < 0) time = 0;
	if (time === 0) {
		return CHARS[0];
	}

	return time.toString(16).padStart(11, CHARS[0]);
}

function getRandom() {
	let str = '';

	for (let i = 0; i < 12; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genMeidg(t: number): string {
	return 'g' + getTime(t) + getRandom();
}

export function parseMeidg(id: string): { date: Date; } {
	return {
		date: new Date(parseInt(id.slice(1, 12), 16)),
	};
}

export function parseMeidgFull(id: string): { date: number; additional: bigint; } {
	return {
		date: parseInt(id.slice(1, 12), 16),
		additional: parseBigInt16(id.slice(12, 24)),
	};
}

export function isSafeMeidgT(t: number): boolean {
	return t > 0;
}
