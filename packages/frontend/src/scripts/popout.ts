// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { appendQuery } from './url';
import * as config from '@/config';

export function popout(path: string, w?: HTMLElement) {
	let url = path.startsWith('http://') || path.startsWith('https://') ? path : config.url + path;
	url = appendQuery(url, 'zen');
	if (w) {
		const position = w.getBoundingClientRect();
		const width = parseInt(getComputedStyle(w, '').width, 10);
		const height = parseInt(getComputedStyle(w, '').height, 10);
		const x = window.screenX + position.left;
		const y = window.screenY + position.top;
		window.open(url, url,
			`width=${width}, height=${height}, top=${y}, left=${x}`);
	} else {
		const width = 400;
		const height = 500;
		const x = window.top.outerHeight / 2 + window.top.screenY - (height / 2);
		const y = window.top.outerWidth / 2 + window.top.screenX - (width / 2);
		window.open(url, url,
			`width=${width}, height=${height}, top=${x}, left=${y}`);
	}
}
