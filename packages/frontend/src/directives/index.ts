/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { App } from 'vue';

import userPreview from './user-preview.js';
import getSize from './get-size.js';
import ripple from './ripple.js';
import tooltip from './tooltip.js';
import hotkey from './hotkey.js';
import appear from './appear.js';
import anim from './anim.js';
import clickAnime from './click-anime.js';
import panel from './panel.js';
import adaptiveBorder from './adaptive-border.js';
import adaptiveBg from './adaptive-bg.js';

export default function(app: App) {
	for (const [key, value] of Object.entries(directives)) {
		app.directive(key, value);
	}
}

export const directives = {
	'userPreview': userPreview,
	'user-preview': userPreview,
	'get-size': getSize,
	'ripple': ripple,
	'tooltip': tooltip,
	'hotkey': hotkey,
	'appear': appear,
	'anim': anim,
	'click-anime': clickAnime,
	'panel': panel,
	'adaptive-border': adaptiveBorder,
	'adaptive-bg': adaptiveBg,
};
