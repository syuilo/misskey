/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';

export const vAppear: ObjectDirective<HTMLElement, (() => unknown) | null | undefined> = {
	mounted(src, binding) {
		const fn = binding.value;
		if (fn == null) return;

		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				fn();
			}
		});

		observer.observe(src);

		src._observer_ = observer;
	},

	unmounted(src) {
		src._observer_?.disconnect();
	},
};
