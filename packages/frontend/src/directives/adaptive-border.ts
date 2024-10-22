/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';
import { getBgColor } from '@/scripts/get-bg-color.js';

export const vAdaptiveBorder: ObjectDirective<HTMLElement, null | undefined> = {
	mounted(src) {
		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = window.getComputedStyle(src).backgroundColor;

		if (parentBg === myBg) {
			src.style.borderColor = 'var(--MI_THEME-divider)';
		} else {
			src.style.borderColor = myBg;
		}
	},
};
