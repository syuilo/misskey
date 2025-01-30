/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// AIDX
// 長さ8の[2000年1月1日からの経過ミリ秒をbase36でエンコードしたもの] + 長さ4の[個体ID] + 長さ4の[カウンタ]
// (c) mei23
// https://misskey.m544.net/notes/71899acdcc9859ec5708ac24

import { customAlphabet } from 'nanoid';
import { parseBigInt36 } from '@/misc/bigint.js';

export const aidxRegExp = /^[0-9a-z]{16}$/;

const TIME2000 = 946684800000;
const TIME_LENGTH = 8;
const NODE_LENGTH = 4;
const NOISE_LENGTH = 4;
const AIDX_LENGTH = TIME_LENGTH + NODE_LENGTH + NOISE_LENGTH;

const nodeId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', NODE_LENGTH)();
let counter = 0;

function getTime(time: number): string {
	time = time - TIME2000;
	if (time < 0) time = 0;

	return time.toString(36).padStart(TIME_LENGTH, '0').slice(-TIME_LENGTH);
}

function getNoise(): string {
	return counter.toString(36).padStart(NOISE_LENGTH, '0').slice(-NOISE_LENGTH);
}

export function genAidx(t: number): string {
	if (isNaN(t)) throw new Error('Failed to create AIDX: Invalid Date');
	counter++;
	return getTime(t) + nodeId + getNoise();
}

export function parseAidx(id: string): { date: Date; } {
	const time = parseInt(id.slice(0, TIME_LENGTH), 36) + TIME2000;
	return { date: new Date(time) };
}

export function parseAidxFull(id: string): { date: number; additional: bigint; } {
	const date = parseInt(id.slice(0, TIME_LENGTH), 36) + TIME2000;
	const additional = parseBigInt36(id.slice(TIME_LENGTH, AIDX_LENGTH));
	return { date, additional };
}

export function isSafeAidxT(t: number): boolean {
	return t > TIME2000;
}
