/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { getBgColor } from '@/scripts/get-bg-color.js';

export default {
	mounted(src, binding, vn) {
		const parentBg = getBgColor(src.parentElement) ?? 'transparent';

		const myBg = window.getComputedStyle(src).backgroundColor;

		if (parentBg === myBg) {
			src.style.borderColor = 'var(--MI_THEME-divider)';
		} else {
			src.style.borderColor = myBg;
		}
	},
} as Directive;
