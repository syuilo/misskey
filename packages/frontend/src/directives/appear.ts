/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';

type VAppear = ObjectDirective<HTMLElement, (() => unknown) | null | undefined>;

export const vAppear = {
	async mounted(src, binding) {
		const fn = binding.value;
		if (fn == null) return;

		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				fn();
			}
		});

		observer.observe(src);

		//@ts-expect-error HTMLElementにプロパティを追加している
		src._observer_ = observer;
	},

	async unmounted(src) {
		//@ts-expect-error HTMLElementにプロパティを追加している
		src._observer_?.disconnect();
	},
} satisfies VAppear as VAppear;
