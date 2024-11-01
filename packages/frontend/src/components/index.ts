/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { App } from 'vue';

import Mfm from './global/MkMfm.js';
import MkA from './global/MkA.vue';
import MkAcct from './global/MkAcct.vue';
import MkAvatar from './global/MkAvatar.vue';
import MkEmoji from './global/MkEmoji.vue';
import MkCondensedLine from './global/MkCondensedLine.vue';
import MkCustomEmoji from './global/MkCustomEmoji.vue';
import MkUserName from './global/MkUserName.vue';
import MkEllipsis from './global/MkEllipsis.vue';
import MkTime from './global/MkTime.vue';
import MkUrl from './global/MkUrl.vue';
import I18n from './global/I18n.vue';
import RouterView from './global/RouterView.vue';
import MkLoading from './global/MkLoading.vue';
import MkError from './global/MkError.vue';
import MkAd from './global/MkAd.vue';
import MkPageHeader from './global/MkPageHeader.vue';
import MkSpacer from './global/MkSpacer.vue';
import MkFooterSpacer from './global/MkFooterSpacer.vue';
import MkStickyContainer from './global/MkStickyContainer.vue';
import MkLazy from './global/MkLazy.vue';

export default function(app: App) {
	for (const [key, value] of Object.entries(components)) {
		app.component(key, value);
	}
}

export const components = {
	I18n,
	RouterView,
	Mfm,
	MkA,
	MkAcct,
	MkAd,
	MkAvatar,
	MkCondensedLine,
	MkCustomEmoji,
	MkEllipsis,
	MkEmoji,
	MkError,
	MkFooterSpacer,
	MkLazy,
	MkLoading,
	MkPageHeader,
	MkSpacer,
	MkStickyContainer,
	MkTime,
	MkUrl,
	MkUserName,
} as const;

declare module '@vue/runtime-core' {
	export interface GlobalComponents {
		I18n: typeof I18n;
		RouterView: typeof RouterView;
		Mfm: typeof Mfm;
		MkA: typeof MkA;
		MkAcct: typeof MkAcct;
		MkAd: typeof MkAd;
		MkAvatar: typeof MkAvatar;
		MkCondensedLine: typeof MkCondensedLine;
		MkCustomEmoji: typeof MkCustomEmoji;
		MkEllipsis: typeof MkEllipsis;
		MkEmoji: typeof MkEmoji;
		MkError: typeof MkError;
		MkFooterSpacer: typeof MkFooterSpacer;
		MkLazy: typeof MkLazy;
		MkLoading: typeof MkLoading;
		MkPageHeader: typeof MkPageHeader;
		MkSpacer: typeof MkSpacer;
		MkStickyContainer: typeof MkStickyContainer;
		MkTime: typeof MkTime;
		MkUrl: typeof MkUrl;
		MkUserName: typeof MkUserName;
	}
}
