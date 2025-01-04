/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { deepClone } from './clone.js';
import type { Cloneable } from './clone.js';

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends Record<PropertyKey, unknown> ? DeepPartial<T[P]> : T[P];
};

function isPureObject(value: unknown): value is Record<PropertyKey, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * valueにないキーをdefからもらう（再帰的）\
 * nullはそのまま、undefinedはdefの値
 **/
export function deepMerge<X extends Record<PropertyKey, unknown>>(value: DeepPartial<X>, def: X): X {
	if (isPureObject(value) && isPureObject(def)) {
		const result = deepClone(value as Cloneable) as X;
		for (const [k, v] of Object.entries(def) as [keyof X, X[keyof X]][]) {
			if (!Object.hasOwn(value, k) || value[k] === undefined) {
				result[k] = v;
			} else if (isPureObject(v) && isPureObject(result[k])) {
				const child = deepClone(result[k] as Cloneable) as DeepPartial<X[keyof X] & Record<PropertyKey, unknown>>;
				result[k] = deepMerge<typeof v>(child, v);
			}
		}
		return result;
	}
	throw new Error('deepMerge: value and def must be pure objects');
}
