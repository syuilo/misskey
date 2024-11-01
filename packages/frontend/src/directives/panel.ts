/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';

type VPanel = ObjectDirective<HTMLElement, null | undefined>;

export const vPanel = {
	async mounted(src) {
		const [
			{ getBgColor },
		] = await Promise.all([
			import('@/scripts/get-bg-color.js'),
		]);

		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = getComputedStyle(document.documentElement).getPropertyValue('--MI_THEME-panel');

		if (parentBg === myBg) {
			src.style.backgroundColor = 'var(--MI_THEME-bg)';
		} else {
			src.style.backgroundColor = 'var(--MI_THEME-panel)';
		}
	},
} satisfies VPanel as VPanel;
