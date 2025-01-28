/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Directive } from 'vue';
import { makeHotkey } from '@/scripts/hotkey.js';

export default {
	mounted(el, binding) {
		el._hotkey_global = binding.modifiers.global === true;

		el._keyHandler = makeHotkey(binding.value);

		if (el._hotkey_global) {
			document.addEventListener('keydown', el._keyHandler, { passive: false });
		} else {
			el.addEventListener('keydown', el._keyHandler, { passive: false });
		}
	},

	unmounted(el) {
		if (el._hotkey_global) {
			document.removeEventListener('keydown', el._keyHandler);
		} else {
			el.removeEventListener('keydown', el._keyHandler);
		}
	},
} as Directive;
