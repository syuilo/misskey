/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * textをregexesで分割するが、分割するときに regexes にマッチした部分も含める。
 */
export function splitSegments(text: string, regexes: RegExp[]): [regexIdx: number, text: string][] {
	const result: [regexIdx: number, text: string][] = [];

	let rest = text;
	for (;;) {
		let matchRegex: [number, RegExpExecArray] | null = null;

		for (let i = 0; i < regexes.length; i++) {
			const regex = regexes[i];
			regex.lastIndex = 0;
			const matchCurrent = regex.exec(rest);
			if (matchCurrent) {
				if (matchRegex != null) {
					if (matchCurrent.index < matchRegex[1].index) {
						matchRegex = [i, matchCurrent];
					}
				} else {
					matchRegex = [i, matchCurrent];
				}
			}
		}

		if (matchRegex != null) {
			const [i, match] = matchRegex;

			const head = rest.slice(0, match.index);
			const segment = match[0];
			const tail = rest.slice(match.index + segment.length);

			result.push([-1, head]);
			result.push([i, segment]);
			rest = tail;
		} else {
			result.push([-1, rest]);
			break;
		}
	}

	return result;
}
