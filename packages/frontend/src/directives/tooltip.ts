/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: useTooltip関数使うようにしたい
// ただディレクティブ内でonUnmountedなどのcomposition api使えるのか不明

import { type ObjectDirective, defineAsyncComponent, ref } from 'vue';

type VTooltip = ObjectDirective<HTMLElement, string | null | undefined, 'noDelay' | 'mfm' | 'top' | 'right' | 'bottom' | 'left', 'dialog'>;

export const vTooltip = {
	async mounted(src, binding) {
		const [
			{ alert, popup },
			{ isTouchUsing },
		] = await Promise.all([
			import('@/os.js'),
			import('@/scripts/touch.js'),
		]);

		const start = isTouchUsing ? 'touchstart' : 'mouseenter';
		const end = isTouchUsing ? 'touchend' : 'mouseleave';

		const delay = binding.modifiers.noDelay ? 0 : 100;

		//@ts-expect-error HTMLElementにプロパティを追加している
		const self = src._tooltipDirective_ = {} as any;

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
					text: binding.value ?? '',
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
			if (self.showTimer != null) window.clearTimeout(self.showTimer);
			if (self.hideTimer != null) window.clearTimeout(self.hideTimer);
			if (delay === 0) {
				self.show();
			} else {
				self.showTimer = window.setTimeout(self.show, delay);
			}
		}, { passive: true });

		src.addEventListener(end, () => {
			if (self.showTimer != null) window.clearTimeout(self.showTimer);
			if (self.hideTimer != null) window.clearTimeout(self.hideTimer);
			if (delay === 0) {
				self.close();
			} else {
				self.hideTimer = window.setTimeout(self.close, delay);
			}
		}, { passive: true });

		src.addEventListener('click', () => {
			if (self.showTimer != null) window.clearTimeout(self.showTimer);
			self.close();
		});
	},

	async updated(src, binding) {
		//@ts-expect-error HTMLElementにプロパティを追加している
		const self = src._tooltipDirective_;
		self.text = binding.value as string;
	},

	async unmounted(src) {
		//@ts-expect-error HTMLElementにプロパティを追加している
		const self = src._tooltipDirective_;
		if (self.checkTimer != null) window.clearInterval(self.checkTimer);
	},
} satisfies VTooltip as VTooltip;
