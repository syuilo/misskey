/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Crockford's Base32
// https://github.com/ulid/spec#encoding
import { parseBigInt32 } from '@/misc/bigint.js';

const CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const ulidRegExp = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

function parseBase32(timestamp: string) {
	let time = 0;
	for (let i = 0; i < timestamp.length; i++) {
		time = time * 32 + CHARS.indexOf(timestamp[i]);
	}
	return time;
}

export function parseUlid(id: string): { date: Date; } {
	return { date: new Date(parseBase32(id.slice(0, 10))) };
}

export function parseUlidFull(id: string): { date: number; additional: bigint; } {
	return {
		date: parseBase32(id.slice(0, 10)),
		additional: parseBigInt32(id.slice(10, 26)),
	};
}
