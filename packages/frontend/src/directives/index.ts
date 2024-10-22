/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { App } from 'vue';

import { vAdaptiveBg } from '@/directives/adaptive-bg.js';
import { vAdaptiveBorder } from '@/directives/adaptive-border.js';
import { vAnim } from '@/directives/anim.js';
import { vAppear } from '@/directives/appear.js';
import { vClickAnime } from '@/directives/click-anime.js';
import { vGetSize } from '@/directives/get-size.js';
import { vHotkey } from '@/directives/hotkey.js';
import { vPanel } from '@/directives/panel.js';
import { vRipple } from '@/directives/ripple.js';
import { vTooltip } from '@/directives/tooltip.js';
import { vUserPreview } from '@/directives/user-preview.js';

export default function(app: App) {
	for (const [key, value] of Object.entries(directives)) {
		app.directive(key, value);
	}
}

export const directives = {
	'adaptive-bg': vAdaptiveBg,
	'adaptive-border': vAdaptiveBorder,
	'anim': vAnim,
	'appear': vAppear,
	'click-anime': vClickAnime,
	'get-size': vGetSize,
	'hotkey': vHotkey,
	'panel': vPanel,
	'ripple': vRipple,
	'tooltip': vTooltip,
	'user-preview': vUserPreview,
} as const;

declare module '@vue/runtime-core' {
	export interface GlobalDirectives {
		vAdaptiveBg: typeof vAdaptiveBg;
		vAdaptiveBorder: typeof vAdaptiveBorder;
		vAnim: typeof vAnim;
		vAppear: typeof vAppear;
		vClickAnime: typeof vClickAnime;
		vGetSize: typeof vGetSize;
		vHotkey: typeof vHotkey;
		vPanel: typeof vPanel;
		vRipple: typeof vRipple;
		vTooltip: typeof vTooltip;
		vUserPreview: typeof vUserPreview;
	}
}
