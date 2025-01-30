/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from '@jest/globals';
import { SearchCondition, parseSearchString } from '@/misc/search-query.js';

describe('misc:search-query', () => {
	test('simple word', () => {
		const q = 'word';
		const condition: SearchCondition = { type: 'contains', value: 'word' };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('simple quoted word', () => {
		const q = '"word + word - word OR word"';
		const condition: SearchCondition = { type: 'contains', value: 'word + word - word or word' };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('simple and', () => {
		const q = 'word1 word2 + word3+word4';
		const condition: SearchCondition = {
			type: 'and',
			subConditions: [
				{ type: 'contains', value: 'word1' },
				{ type: 'contains', value: 'word2' },
				{ type: 'contains', value: 'word3' },
				{ type: 'contains', value: 'word4' },
			],
		};
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('simple or', () => {
		const q = 'word1 OR word2 OR word3 OR word4';
		const condition: SearchCondition = {
			type: 'or',
			subConditions: [
				{ type: 'contains', value: 'word1' },
				{ type: 'contains', value: 'word2' },
				{ type: 'contains', value: 'word3' },
				{ type: 'contains', value: 'word4' },
			],
		};
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('simple not', () => {
		const q = 'word1 - word2';
		const condition: SearchCondition = {
			type: 'and',
			subConditions: [
				{ type: 'contains', value: 'word1' },
				{ type: 'not_contains', value: 'word2' },
			],
		};
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('simple and/or/not - left-associative', () => {
		const q = 'word1 word2 OR word3 - word4';
		const condition: SearchCondition = {
			type: 'and',
			subConditions: [
				{ type: 'or', subConditions: [
					{ type: 'and', subConditions: [
						{ type: 'contains', value: 'word1' },
						{ type: 'contains', value: 'word2' },
					] },
					{ type: 'contains', value: 'word3' },
				] },
				{ type: 'not_contains', value: 'word4' },
			],
		};
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('brackets', () => {
		const q = 'word1 (word2 OR word3)';
		const condition: SearchCondition = {
			type: 'and',
			subConditions: [
				{ type: 'contains', value: 'word1' },
				{ type: 'or', subConditions: [
					{ type: 'contains', value: 'word2' },
					{ type: 'contains', value: 'word3' },
				] },
			],
		};
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('brackets - nested', () => {
		const q = 'word1 (word2 OR (word3 -word4))';
		const condition: SearchCondition = {
			type: 'and',
			subConditions: [
				{ type: 'contains', value: 'word1' },
				{ type: 'or', subConditions: [
					{ type: 'contains', value: 'word2' },
					{ type: 'and', subConditions: [
						{ type: 'contains', value: 'word3' },
						{ type: 'not_contains', value: 'word4' },
					] },
				] },
			],
		};
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('brackets with not', () => {
		const q = 'word1 -(word2 OR (word3 word4))';
		const condition: SearchCondition = {
			type: 'and',
			subConditions: [
				{ type: 'contains', value: 'word1' },
				{ type: 'not_contains', value: 'word2' },
				{ type: 'or', subConditions: [
					{ type: 'not_contains', value: 'word3' },
					{ type: 'not_contains', value: 'word4' },
				] },
			],
		};
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('unclosed brackets', () => {
		const q = 'word1 (word2 OR word3';
		const condition: SearchCondition = { type: 'and', subConditions: [
			{ type: 'contains', value: 'word1' },
			{ type: 'or', subConditions: [
				{ type: 'contains', value: 'word2' },
				{ type: 'contains', value: 'word3' },
			] },
		] };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('overclosed brackets', () => {
		const q = '(word1 OR word2)) word3';
		const condition: SearchCondition = { type: 'and', subConditions: [
			{ type: 'or', subConditions: [
				{ type: 'contains', value: 'word1' },
				{ type: 'contains', value: 'word2' },
			] },
			{ type: 'contains', value: 'word3' },
		] };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('empty string', () => {
		const q = '';
		const condition: SearchCondition = { type: 'empty' };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('empty brackets', () => {
		const q = 'word1 () word2';
		const condition: SearchCondition = { type: 'and', subConditions: [
			{ type: 'contains', value: 'word1' },
			{ type: 'contains', value: 'word2' },
		] };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('empty brackets with not', () => {
		const q = 'word1 -() word2';
		const condition: SearchCondition = { type: 'and', subConditions: [
			{ type: 'contains', value: 'word1' },
			{ type: 'contains', value: 'word2' },
		] };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('empty brackets with or', () => {
		const q = 'word1 OR() word2';
		const condition: SearchCondition = { type: 'and', subConditions: [
			{ type: 'contains', value: 'word1' },
			{ type: 'contains', value: 'word2' },
		] };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('unclosed quoted word', () => {
		const q = '"word';
		const condition: SearchCondition = { type: 'contains', value: 'word' };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('escaped characters', () => {
		const q = 'word\\- word\\+ word\\( word\\\\';
		const condition: SearchCondition = { type: 'and', subConditions: [
			{ type: 'contains', value: 'word-' },
			{ type: 'contains', value: 'word+' },
			{ type: 'contains', value: 'word(' },
			{ type: 'contains', value: 'word\\' },
		] };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('redundant conditions AND', () => {
		const q = 'abc abc ab';
		const condition: SearchCondition = { type: 'contains', value: 'abc' };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('redundant conditions OR', () => {
		const q = 'abc OR abc OR ab';
		const condition: SearchCondition = { type: 'contains', value: 'ab' };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('redundant conditions complex AND', () => {
		const q = 'abab (abc OR ab)';
		const condition: SearchCondition = { type: 'contains', value: 'abab' };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});

	test('redundant conditions complex OR', () => {
		const q = 'abcde OR (abc ab)';
		const condition: SearchCondition = { type: 'contains', value: 'abc' };
		expect(parseSearchString(q)).toStrictEqual(condition);
	});
});
