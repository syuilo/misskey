/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';
import type { Keymap } from '@/scripts/hotkey.js';

type VHotkey = ObjectDirective<HTMLElement, Keymap | null | undefined, 'global'>;

export const vHotkey = {
	async mounted(src, binding) {
		const [
			{ makeHotkey },
		] = await Promise.all([
			import('@/scripts/hotkey.js'),
		]);

		//@ts-expect-error HTMLElementにプロパティを追加している
		src._hotkey_global = binding.modifiers.global === true;

		//@ts-expect-error HTMLElementにプロパティを追加している
		src._keyHandler = makeHotkey(binding.value);

		//@ts-expect-error HTMLElementにプロパティを追加している
		if (src._hotkey_global) {
			//@ts-expect-error HTMLElementにプロパティを追加している
			document.addEventListener('keydown', src._keyHandler, { passive: false });
		} else {
			//@ts-expect-error HTMLElementにプロパティを追加している
			src.addEventListener('keydown', src._keyHandler, { passive: false });
		}
	},

	async unmounted(src) {
		//@ts-expect-error HTMLElementにプロパティを追加している
		if (src._hotkey_global) {
			//@ts-expect-error HTMLElementにプロパティを追加している
			document.removeEventListener('keydown', src._keyHandler);
		} else {
			//@ts-expect-error HTMLElementにプロパティを追加している
			src.removeEventListener('keydown', src._keyHandler);
		}
	},
} satisfies VHotkey as VHotkey;
