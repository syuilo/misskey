/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';

type VAdaptiveBorder = ObjectDirective<HTMLElement, null | undefined>;

export const vAdaptiveBorder = {
	async mounted(src) {
		const [
			{ getBgColor },
		] = await Promise.all([
			import('@/scripts/get-bg-color.js'),
		]);

		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = window.getComputedStyle(src).backgroundColor;

		if (parentBg === myBg) {
			src.style.borderColor = 'var(--MI_THEME-divider)';
		} else {
			src.style.borderColor = myBg;
		}
	},
} satisfies VAdaptiveBorder as VAdaptiveBorder;
