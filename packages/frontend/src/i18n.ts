/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import type { Locale } from '../../../locales/index.js';
import { I18n } from '@/scripts/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { version, lang } from '@/config.js';

const preParseLocale = miLocalStorage.getItem('locale');
export let locale = preParseLocale ? JSON.parse(preParseLocale) : null;

if (locale == null) {
	const localRes = await window.fetch(`/assets/locales/${lang}.${version}.json`);
	if (localRes.status === 200) {
		locale = await localRes.json();
		localStorage.setItem('locale', JSON.stringify(locale));
		localStorage.setItem('localeVersion', version);
	} else {
		throw new Error('Failed to fetch locale file');
	}
}

//#region Detect language & fetch translations
const localeVersion = miLocalStorage.getItem('localeVersion');
const localeOutdated = (localeVersion == null || localeVersion !== version);
if (localeOutdated) {
	const res = await window.fetch(`/assets/locales/${lang}.${version}.json`);
	if (res.status === 200) {
		const newLocale = await res.text();
		const parsedNewLocale = JSON.parse(newLocale);
		miLocalStorage.setItem('locale', newLocale);
		miLocalStorage.setItem('localeVersion', version);
		locale = parsedNewLocale;
	}
}
//#endregion

// dev-modeの場合は常に取り直す
if (_DEV_) {
	const x = _LANGS_FULL_.find(it => it[0] === lang)!;
	localStorage.setItem('locale', JSON.stringify(x[1]));
	localStorage.setItem('localeVersion', version);
	locale = x[1];
}

export function updateLocale(newLocale): void {
	locale = newLocale;
}

export const i18n = markRaw(new I18n<Locale>(locale));

export function updateI18n(newLocale: Locale) {
	i18n.locale = newLocale;
}
