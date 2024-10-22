/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';

const mountings = new Map<HTMLElement, {
	resize: ResizeObserver;
	intersection?: IntersectionObserver;
	fn: (w: number, h: number) => void;
}>();

export const vGetSize: ObjectDirective<HTMLElement, ((w: number, h: number) => unknown) | null | undefined> = {
	mounted(src, binding) {
		const resize = new ResizeObserver(() => {
			calc(src);
		});
		resize.observe(src);

		mountings.set(src, { resize, fn: binding.value });
		calc(src);
	},

	unmounted(src, binding) {
		if (binding.value != null) binding.value(0, 0);
		const info = mountings.get(src);
		if (!info) return;
		info.resize.disconnect();
		if (info.intersection) info.intersection.disconnect();
		mountings.delete(src);
	},
};

function calc(src: HTMLElement) {
	const info = mountings.get(src);
	const height = src.clientHeight;
	const width = src.clientWidth;

	if (!info) return;

	// アクティベート前などでsrcが描画されていない場合
	if (!height) {
		// IntersectionObserverで表示検出する
		if (!info.intersection) {
			info.intersection = new IntersectionObserver((entries) => {
				if (entries.some((entry) => entry.isIntersecting)) calc(src);
			});
		}
		info.intersection.observe(src);
		return;
	}
	if (info.intersection) {
		info.intersection.disconnect();
		delete info.intersection;
	}

	info.fn(width, height);
}
