// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Theme } from './scripts/theme';
import { miLocalStorage } from './local-storage';
import { api } from '@/os';
import { $i } from '@/account';

const lsCacheKey = $i ? `themes:${$i.id}` as const : null;

export function getThemes(): Theme[] {
	if ($i == null) return [];
	return JSON.parse(miLocalStorage.getItem(lsCacheKey!) ?? '[]');
}

export async function fetchThemes(): Promise<void> {
	if ($i == null) return;

	try {
		const themes = await api('i/registry/get', { scope: ['client'], key: 'themes' });
		miLocalStorage.setItem(lsCacheKey!, JSON.stringify(themes));
	} catch (err) {
		if (err.code === 'NO_SUCH_KEY') return;
		throw err;
	}
}

export async function addTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	await fetchThemes();
	const themes = getThemes().concat(theme);
	await api('i/registry/set', { scope: ['client'], key: 'themes', value: themes });
	miLocalStorage.setItem(lsCacheKey!, JSON.stringify(themes));
}

export async function removeTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const themes = getThemes().filter(t => t.id !== theme.id);
	await api('i/registry/set', { scope: ['client'], key: 'themes', value: themes });
	miLocalStorage.setItem(lsCacheKey!, JSON.stringify(themes));
}
