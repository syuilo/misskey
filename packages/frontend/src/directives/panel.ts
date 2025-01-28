/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { getBgColor } from '@/scripts/get-bg-color.js';

export default {
	mounted(src, binding, vn) {
		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = getComputedStyle(document.documentElement).getPropertyValue('--MI_THEME-panel');

		if (parentBg === myBg) {
			src.style.backgroundColor = 'var(--MI_THEME-bg)';
		} else {
			src.style.backgroundColor = 'var(--MI_THEME-panel)';
		}
	},
} as Directive;
