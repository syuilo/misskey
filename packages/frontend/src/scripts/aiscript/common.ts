/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { errors, utils } from '@syuilo/aiscript';
import type { values } from '@syuilo/aiscript';

export function assertStringAndIsIn<A extends readonly string[]>(value: values.Value | undefined, expects: A): asserts value is values.VStr & { value: A[number] } {
	utils.assertString(value);
	const str = value.value;
	if (!expects.includes(str)) {
		const expected = expects.map((expect) => `"${expect}"`).join(', ');
		throw new errors.AiScriptRuntimeError(`"${value.value}" is not in ${expected}`);
	}
}
