/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from '@jest/globals';
import { splitSegments } from '@/misc/split-segments.js';

describe('misc:split-segments', () => {
	test('simple', () => {
		expect(splitSegments('abcdefghijklmn', [/c/])).toStrictEqual([[-1, 'ab'], [0, 'c'], [-1, 'defghijklmn']]);
		expect(splitSegments('abcdefgabcdefg', [/c/])).toStrictEqual([[-1, 'ab'], [0, 'c'], [-1, 'defgab'], [0, 'c'], [-1, 'defg']]);

		expect(splitSegments('abcdefghijklmn', [/c/, /x/])).toStrictEqual([[-1, 'ab'], [0, 'c'], [-1, 'defghijklmn']]);
		expect(splitSegments('abcdefghijklmn', [/x/, /c/])).toStrictEqual([[-1, 'ab'], [1, 'c'], [-1, 'defghijklmn']]);
	});
	test('match multiple regex', () => {
		expect(splitSegments('abcdefgabcdefg', [/c/, /f/])).toStrictEqual([[-1, 'ab'], [0, 'c'], [-1, 'de'], [1, 'f'], [-1, 'gab'], [0, 'c'], [-1, 'de'], [1, 'f'], [-1, 'g']]);
	});
});
