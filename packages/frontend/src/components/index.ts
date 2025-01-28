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
	I18n: I18n,
	RouterView: RouterView,
	Mfm: Mfm,
	MkA: MkA,
	MkAcct: MkAcct,
	MkAvatar: MkAvatar,
	MkEmoji: MkEmoji,
	MkCondensedLine: MkCondensedLine,
	MkCustomEmoji: MkCustomEmoji,
	MkUserName: MkUserName,
	MkEllipsis: MkEllipsis,
	MkTime: MkTime,
	MkUrl: MkUrl,
	MkLoading: MkLoading,
	MkError: MkError,
	MkAd: MkAd,
	MkPageHeader: MkPageHeader,
	MkSpacer: MkSpacer,
	MkFooterSpacer: MkFooterSpacer,
	MkStickyContainer: MkStickyContainer,
	MkLazy: MkLazy,
};

declare module '@vue/runtime-core' {
	export interface GlobalComponents {
		I18n: typeof I18n;
		RouterView: typeof RouterView;
		Mfm: typeof Mfm;
		MkA: typeof MkA;
		MkAcct: typeof MkAcct;
		MkAvatar: typeof MkAvatar;
		MkEmoji: typeof MkEmoji;
		MkCondensedLine: typeof MkCondensedLine;
		MkCustomEmoji: typeof MkCustomEmoji;
		MkUserName: typeof MkUserName;
		MkEllipsis: typeof MkEllipsis;
		MkTime: typeof MkTime;
		MkUrl: typeof MkUrl;
		MkLoading: typeof MkLoading;
		MkError: typeof MkError;
		MkAd: typeof MkAd;
		MkPageHeader: typeof MkPageHeader;
		MkSpacer: typeof MkSpacer;
		MkFooterSpacer: typeof MkFooterSpacer;
		MkStickyContainer: typeof MkStickyContainer;
		MkLazy: typeof MkLazy;
	}
}
