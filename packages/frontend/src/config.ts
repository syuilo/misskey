/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { miLocalStorage } from '@/local-storage.js';

//#region language detection
const supportedLangs = _LANGS_.map(it => it[0]);
let _lang = miLocalStorage.getItem('lang');
if (_lang == null || !supportedLangs.includes(_lang)) {
	if (supportedLangs.includes(navigator.language)) {
		_lang = navigator.language;
	} else {
		_lang = supportedLangs.find(x => x.split('-')[0] === navigator.language) ?? null;

		// Fallback
		if (_lang == null) _lang = 'en-US';
	}
	miLocalStorage.setItem('lang', _lang);
}
// for https://github.com/misskey-dev/misskey/issues/10202
if (_lang.toString == null || _lang.toString() === 'null') {
	console.error('invalid lang value detected!!!', typeof _lang, _lang);
	_lang = 'en-US';
	miLocalStorage.setItem('lang', _lang);
}
//#endregion

const address = new URL(document.querySelector<HTMLMetaElement>('meta[property="instance_url"]')?.content || location.href);
const siteName = document.querySelector<HTMLMetaElement>('meta[property="og:site_name"]')?.content;

export const host = address.host;
export const hostname = address.hostname;
export const url = address.origin;
export const apiUrl = location.origin + '/api';
export const wsOrigin = location.origin;
export const lang = _lang;
export const langs = _LANGS_;
export const version = _VERSION_;
export const instanceName = siteName === 'Misskey' || siteName == null ? host : siteName;
export const ui = miLocalStorage.getItem('ui');
export const debug = miLocalStorage.getItem('debug') === 'true';
