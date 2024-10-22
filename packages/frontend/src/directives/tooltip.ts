/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: useTooltip関数使うようにしたい
// ただディレクティブ内でonUnmountedなどのcomposition api使えるのか不明

import { defineAsyncComponent, ref } from 'vue';
import type { ObjectDirective } from 'vue';
import { isTouchUsing } from '@/scripts/touch.js';
import { popup, alert } from '@/os.js';

const start = isTouchUsing ? 'touchstart' : 'mouseenter';
const end = isTouchUsing ? 'touchend' : 'mouseleave';

export const vTooltip: ObjectDirective<HTMLElement, string | null | undefined, 'noDelay' | 'mfm' | 'top' | 'right' | 'bottom' | 'left', 'dialog'> = {
	mounted(src, binding) {
		const delay = binding.modifiers.noDelay ? 0 : 100;

		const self = (src as any)._tooltipDirective_ = {} as any;

		self.text = binding.value as string;
		self._close = null;
		self.showTimer = null;
		self.hideTimer = null;
		self.checkTimer = null;

		self.close = () => {
			if (self._close) {
				window.clearInterval(self.checkTimer);
				self._close();
				self._close = null;
			}
		};

		if (binding.arg === 'dialog') {
			src.addEventListener('click', (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				alert({
					type: 'info',
					text: binding.value,
				});
				return false;
			});
		}

		self.show = () => {
			if (!document.body.contains(src)) return;
			if (self._close) return;
			if (self.text == null) return;

			const showing = ref(true);
			const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkTooltip.vue')), {
				showing,
				text: self.text,
				asMfm: binding.modifiers.mfm,
				direction: binding.modifiers.left ? 'left' : binding.modifiers.right ? 'right' : binding.modifiers.top ? 'top' : binding.modifiers.bottom ? 'bottom' : 'top',
				targetElement: src,
			}, {
				closed: () => dispose(),
			});

			self._close = () => {
				showing.value = false;
			};
		};

		src.addEventListener('selectstart', (ev) => {
			ev.preventDefault();
		});

		src.addEventListener(start, () => {
			window.clearTimeout(self.showTimer);
			window.clearTimeout(self.hideTimer);
			if (delay === 0) {
				self.show();
			} else {
				self.showTimer = window.setTimeout(self.show, delay);
			}
		}, { passive: true });

		src.addEventListener(end, () => {
			window.clearTimeout(self.showTimer);
			window.clearTimeout(self.hideTimer);
			if (delay === 0) {
				self.close();
			} else {
				self.hideTimer = window.setTimeout(self.close, delay);
			}
		}, { passive: true });

		src.addEventListener('click', () => {
			window.clearTimeout(self.showTimer);
			self.close();
		});
	},

	updated(src, binding) {
		const self = (src as any)._tooltipDirective_;
		self.text = binding.value as string;
	},

	unmounted(src) {
		const self = (src as any)._tooltipDirective_;
		window.clearInterval(self.checkTimer);
	},
};
