/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import JSON5 from 'json5';
import { addTheme, getThemes } from '@/theme-store.js';
import { applyTheme, validateTheme } from '@/scripts/theme.js';
import type { Theme } from '@/scripts/theme.js';

export function parseThemeCode(code: string): Theme {
	let theme;

	try {
		theme = JSON5.parse(code);
	} catch (err) {
		throw new Error('Failed to parse theme json');
	}
	if (!validateTheme(theme)) {
		throw new Error('This theme is invaild');
	}
	if (getThemes().some(t => t.id === theme.id)) {
		throw new Error('This theme is already installed');
	}

	return theme;
}

export function previewTheme(code: string): void {
	const theme = parseThemeCode(code);
	if (theme) applyTheme(theme, false);
}

export async function installTheme(code: string): Promise<void> {
	const theme = parseThemeCode(code);
	if (!theme) return;
	await addTheme(theme);
}
