/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse, http } from 'msw';
import type { DefaultBodyType, HttpResponseResolver, JsonBodyType, PathParams } from 'msw';
import seedrandom from 'seedrandom';
import { action } from '@storybook/addon-actions';

function getChartArray(seed: string, limit: number, option?: { accumulate?: boolean, mul?: number }): number[] {
	const rng = seedrandom(seed);
	const max = Math.floor(option?.mul ?? 250 * rng());
	let accumulation = 0;
	const array: number[] = [];
	for (let i = 0; i < limit; i++) {
		const num = Math.floor((max + 1) * rng());
		if (option?.accumulate) {
			accumulation += num;
			array.unshift(accumulation);
		} else {
			array.push(num);
		}
	}
	return array;
}

export function getChartResolver(fields: string[], option?: { accumulate?: boolean, mulMap?: Record<string, number> }): HttpResponseResolver<PathParams, DefaultBodyType, JsonBodyType> {
	return ({ request }) => {
		action(`GET ${request.url}`)();
		const limitParam = new URL(request.url).searchParams.get('limit');
		const limit = limitParam ? parseInt(limitParam) : 30;
		const res = {};
		for (const field of fields) {
			const layers = field.split('.');
			let current = res;
			while (layers.length > 1) {
				const currentKey = layers.shift()!;
				if (current[currentKey] == null) current[currentKey] = {};
				current = current[currentKey];
			}
			current[layers[0]] = getChartArray(field, limit, {
				accumulate: option?.accumulate,
				mul: option?.mulMap != null && field in option.mulMap ? option.mulMap[field] : undefined,
			});
		}
		return HttpResponse.json(res);
	};
}
