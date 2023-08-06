// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EndoRelation, Predicate } from './relation';

/**
 * Count the number of elements that satisfy the predicate
 */

export function countIf<T>(f: Predicate<T>, xs: T[]): number {
	return xs.filter(f).length;
}

/**
 * Count the number of elements that is equal to the element
 */
export function count<T>(a: T, xs: T[]): number {
	return countIf(x => x === a, xs);
}

/**
 * Concatenate an array of arrays
 */
export function concat<T>(xss: T[][]): T[] {
	return ([] as T[]).concat(...xss);
}

/**
 * Intersperse the element between the elements of the array
 * @param sep The element to be interspersed
 */
export function intersperse<T>(sep: T, xs: T[]): T[] {
	return concat(xs.map(x => [sep, x])).slice(1);
}

/**
 * Returns the array of elements that is not equal to the element
 */
export function erase<T>(a: T, xs: T[]): T[] {
	return xs.filter(x => x !== a);
}

/**
 * Finds the array of all elements in the first array not contained in the second array.
 * The order of result values are determined by the first array.
 */
export function difference<T>(xs: T[], ys: T[]): T[] {
	return xs.filter(x => !ys.includes(x));
}

/**
 * Remove all but the first element from every group of equivalent elements
 */
export function unique<T>(xs: T[]): T[] {
	return [...new Set(xs)];
}

export function uniqueBy<TValue, TKey>(values: TValue[], keySelector: (value: TValue) => TKey): TValue[] {
	const map = new Map<TKey, TValue>();

	for (const value of values) {
		const key = keySelector(value);
		if (!map.has(key)) map.set(key, value);
	}

	return [...map.values()];
}

export function sum(xs: number[]): number {
	return xs.reduce((a, b) => a + b, 0);
}

export function maximum(xs: number[]): number {
	return Math.max(...xs);
}

/**
 * Splits an array based on the equivalence relation.
 * The concatenation of the result is equal to the argument.
 */
export function groupBy<T>(f: EndoRelation<T>, xs: T[]): T[][] {
	const groups = [] as T[][];
	for (const x of xs) {
		const lastGroup = groups.at(-1);
		if (lastGroup !== undefined && f(lastGroup[0], x)) {
			lastGroup.push(x);
		} else {
			groups.push([x]);
		}
	}
	return groups;
}

/**
 * Splits an array based on the equivalence relation induced by the function.
 * The concatenation of the result is equal to the argument.
 */
export function groupOn<T, S>(f: (x: T) => S, xs: T[]): T[][] {
	return groupBy((a, b) => f(a) === f(b), xs);
}

export function groupByX<T>(collections: T[], keySelector: (x: T) => string) {
	return collections.reduce((obj: Record<string, T[]>, item: T) => {
		const key = keySelector(item);
		if (typeof obj[key] === 'undefined') {
			obj[key] = [];
		}

		obj[key].push(item);

		return obj;
	}, {});
}

/**
 * Compare two arrays by lexicographical order
 */
export function lessThan(xs: number[], ys: number[]): boolean {
	for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
		if (xs[i] < ys[i]) return true;
		if (xs[i] > ys[i]) return false;
	}
	return xs.length < ys.length;
}

/**
 * Returns the longest prefix of elements that satisfy the predicate
 */
export function takeWhile<T>(f: Predicate<T>, xs: T[]): T[] {
	const ys: T[] = [];
	for (const x of xs) {
		if (f(x)) {
			ys.push(x);
		} else {
			break;
		}
	}
	return ys;
}

export function cumulativeSum(xs: number[]): number[] {
	const ys = Array.from(xs); // deep copy
	for (let i = 1; i < ys.length; i++) ys[i] += ys[i - 1];
	return ys;
}

export function toArray<T>(x: T | T[] | undefined): T[] {
	return Array.isArray(x) ? x : x != null ? [x] : [];
}

export function toSingle<T>(x: T | T[] | undefined): T | undefined {
	return Array.isArray(x) ? x[0] : x;
}
