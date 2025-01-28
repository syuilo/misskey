/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getBuiltinThemes } from '@/scripts/theme.js';
import type { Theme } from '@/scripts/theme.js';
import { miLocalStorage } from '@/local-storage.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { $i } from '@/account.js';

const lsCacheKey = $i ? `themes:${$i.id}` as const : null;

export function getThemes(): Theme[] {
	if ($i == null) return [];
	return JSON.parse(miLocalStorage.getItem(lsCacheKey!) ?? '[]');
}

export async function fetchThemes(): Promise<void> {
	if ($i == null) return;

	try {
		const themes = await misskeyApi('i/registry/get', { scope: ['client'], key: 'themes' });
		miLocalStorage.setItem(lsCacheKey!, JSON.stringify(themes));
	} catch (err) {
		if (err.code === 'NO_SUCH_KEY') return;
		throw err;
	}
}

export async function addTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const builtinThemes = await getBuiltinThemes();
	if (builtinThemes.some(t => t.id === theme.id)) {
		throw new Error('builtin theme');
	}
	await fetchThemes();
	const themes = getThemes().concat(theme);
	await misskeyApi('i/registry/set', { scope: ['client'], key: 'themes', value: themes });
	miLocalStorage.setItem(lsCacheKey!, JSON.stringify(themes));
}

export async function removeTheme(theme: Theme): Promise<void> {
	if ($i == null) return;
	const themes = getThemes().filter(t => t.id !== theme.id);
	await misskeyApi('i/registry/set', { scope: ['client'], key: 'themes', value: themes });
	miLocalStorage.setItem(lsCacheKey!, JSON.stringify(themes));
}
