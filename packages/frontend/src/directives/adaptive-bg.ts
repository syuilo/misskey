/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';

type VAdaptiveBg = ObjectDirective<HTMLElement, null | undefined>;

export const vAdaptiveBg = {
	async mounted(src) {
		const [
			{ getBgColor },
		] = await Promise.all([
			import('@/scripts/get-bg-color.js'),
		]);

		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = window.getComputedStyle(src).backgroundColor;

		if (parentBg === myBg) {
			src.style.backgroundColor = 'var(--MI_THEME-bg)';
		} else {
			src.style.backgroundColor = myBg;
		}
	},
} satisfies VAdaptiveBg as VAdaptiveBg;
