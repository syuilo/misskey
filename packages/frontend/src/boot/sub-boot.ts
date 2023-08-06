// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, createApp, watch, markRaw, version as vueVersion, defineAsyncComponent } from 'vue';
import { common } from './common';

export async function subBoot() {
	const { isClientUpdated } = await common(() => createApp(
		defineAsyncComponent(() => import('@/ui/minimum.vue')),
	));
}
