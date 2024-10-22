/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ObjectDirective } from 'vue';
import { defaultStore } from '@/store.js';

export const vClickAnime: ObjectDirective<HTMLElement, null | undefined> = {
	mounted(src) {
		if (!defaultStore.state.animation) return;

		const target = src.children[0];

		if (target == null) return;

		target.classList.add('_anime_bounce_standBy');

		src.addEventListener('mousedown', () => {
			target.classList.remove('_anime_bounce');

			target.classList.add('_anime_bounce_standBy');
			target.classList.add('_anime_bounce_ready');

			target.addEventListener('mouseleave', () => {
				target.classList.remove('_anime_bounce_ready');
			});
		});

		src.addEventListener('click', () => {
			target.classList.add('_anime_bounce');
			target.classList.remove('_anime_bounce_ready');
		});

		src.addEventListener('animationend', () => {
			target.classList.remove('_anime_bounce');
			target.classList.add('_anime_bounce_standBy');
		});
	},
};
