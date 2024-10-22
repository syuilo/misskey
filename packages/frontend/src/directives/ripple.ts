/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';
import { popup } from '@/os.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';

export const vRipple: ObjectDirective<HTMLElement, boolean | null | undefined> = {
	mounted(src, binding) {
		// 明示的に false であればバインドしない
		if (binding.value === false) return;

		src.addEventListener('click', () => {
			const rect = src.getBoundingClientRect();

			const x = rect.left + (src.offsetWidth / 2);
			const y = rect.top + (src.offsetHeight / 2);

			const { dispose } = popup(MkRippleEffect, { x, y }, {
				end: () => dispose(),
			});
		});
	},
};
