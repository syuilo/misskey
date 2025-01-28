<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="showBottom ? $style.rootWithBottom : $style.root">
	<div style="container-type: inline-size;">
		<RouterView/>
	</div>

	<XCommon/>
</div>

<!--
	デッキUIが設定されている場合はデッキUIに戻れるようにする (ただし?zenが明示された場合は表示しない)
	See https://github.com/misskey-dev/misskey/issues/10905
-->
<div v-if="showBottom" :class="$style.bottom">
	<button v-tooltip="i18n.ts.goToMisskey" :class="['_button', '_shadow', $style.button]" @click="goToMisskey"><i class="ti ti-home"></i></button>
</div>
</template>

<script lang="ts" setup>
import { computed, provide, ref } from 'vue';
import XCommon from './_common_/common.vue';
import { provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import type { PageMetadata } from '@/scripts/page-metadata.js';
import { instanceName, ui } from '@@/js/config.js';
import { i18n } from '@/i18n.js';
import { mainRouter } from '@/router/main.js';

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const pageMetadata = ref<null | PageMetadata>(null);

const showBottom = !(new URLSearchParams(location.search)).has('zen') && ui === 'deck';

provide('router', mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			document.title = pageMetadata.value.title;
		} else {
			document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);

function goToMisskey() {
	window.location.href = '/';
}

document.documentElement.style.overflowY = 'scroll';
</script>

<style lang="scss" module>
.root {
	min-height: 100dvh;
	box-sizing: border-box;
}

.rootWithBottom {
	min-height: calc(100dvh - (60px + (var(--MI-margin) * 2) + env(safe-area-inset-bottom, 0px)));
	box-sizing: border-box;
}

.bottom {
	height: calc(60px + (var(--MI-margin) * 2) + env(safe-area-inset-bottom, 0px));
	width: 100%;
	margin-top: auto;
}

.button {
	position: fixed !important;
	padding: 0;
	aspect-ratio: 1;
	width: 100%;
	max-width: 60px;
	margin: auto;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);
	right: var(--MI-margin);
	bottom: calc(var(--MI-margin) + env(safe-area-inset-bottom, 0px));
}
</style>
