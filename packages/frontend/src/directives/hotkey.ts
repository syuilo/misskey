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

		src._hotkey_global = binding.modifiers.global === true;

		src._keyHandler = makeHotkey(binding.value);

		if (src._hotkey_global) {
			document.addEventListener('keydown', src._keyHandler, { passive: false });
		} else {
			src.addEventListener('keydown', src._keyHandler, { passive: false });
		}
	},

	async unmounted(src) {
		if (src._hotkey_global) {
			document.removeEventListener('keydown', src._keyHandler);
		} else {
			src.removeEventListener('keydown', src._keyHandler);
		}
	},
} satisfies VHotkey as VHotkey;
