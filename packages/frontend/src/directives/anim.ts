/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';

export const vAnim: ObjectDirective<HTMLElement, number | null | undefined> = {
	beforeMount(src) {
		src.style.opacity = '0';
		src.style.transform = 'scale(0.9)';
		// ページネーションと相性が悪いので
		// if (typeof binding.value === 'number') {
		// 	src.style.transitionDelay = `${binding.value * 30}ms`;
		// }
		src.classList.add('_zoom');
	},

	mounted(src) {
		window.setTimeout(() => {
			src.style.opacity = '1';
			src.style.transform = 'none';
		}, 1);
	},
};
