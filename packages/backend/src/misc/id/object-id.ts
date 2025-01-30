/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parseBigInt16 } from '@/misc/bigint.js';

const CHARS = '0123456789abcdef';

// same as meid
export const objectIdRegExp = /^[0-9a-f]{24}$/;

function getTime(time: number) {
	if (time < 0) time = 0;
	if (time === 0) {
		return CHARS[0];
	}

	time = Math.floor(time / 1000);

	return time.toString(16).padStart(8, CHARS[0]);
}

function getRandom() {
	let str = '';

	for (let i = 0; i < 16; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genObjectId(t: number): string {
	return getTime(t) + getRandom();
}

export function parseObjectId(id: string): { date: Date; } {
	return {
		date: new Date(parseInt(id.slice(0, 8), 16) * 1000),
	};
}

export function parseObjectIdFull(id: string): { date: number; additional: bigint; } {
	return {
		date: parseInt(id.slice(0, 8), 16) * 1000,
		additional: parseBigInt16(id.slice(8, 24)),
	};
}

export function isSafeObjectIdT(t: number): boolean {
	return t > 0;
}
