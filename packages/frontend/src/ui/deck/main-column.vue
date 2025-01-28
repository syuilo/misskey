<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn v-if="deckStore.state.alwaysShowMainColumn || mainRouter.currentRoute.value.name !== 'index'" :column="column" :isStacked="isStacked">
	<template #header>
		<template v-if="pageMetadata">
			<i :class="pageMetadata.icon"></i>
			{{ pageMetadata.title }}
		</template>
	</template>

	<div ref="contents">
		<RouterView @contextmenu.stop="onContextmenu"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { provide, shallowRef, ref } from 'vue';
import XColumn from './column.vue';
import { deckStore } from '@/ui/deck/deck-store.js';
import type { Column } from '@/ui/deck/deck-store.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import type { PageMetadata } from '@/scripts/page-metadata.js';
import { useScrollPositionManager } from '@/nirax.js';
import { getScrollContainer } from '@@/js/scroll.js';
import { isLink } from '@@/js/is-link.js';
import { mainRouter } from '@/router/main.js';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const contents = shallowRef<HTMLElement>();
const pageMetadata = ref<null | PageMetadata>(null);

provide('router', mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
});
provideReactiveMetadata(pageMetadata);

/*
function back() {
	history.back();
}
*/
function onContextmenu(ev: MouseEvent) {
	if (!ev.target) return;

	if (isLink(ev.target as HTMLElement)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes((ev.target as HTMLElement).tagName) || (ev.target as HTMLElement).attributes['contenteditable']) return;
	if (window.getSelection()?.toString() !== '') return;
	const path = mainRouter.currentRoute.value.path;
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: 'ti ti-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(path);
		},
	}], ev);
}

useScrollPositionManager(() => getScrollContainer(contents.value), mainRouter);
</script>
