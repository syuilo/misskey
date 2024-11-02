<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:initialWidth="500"
	:initialHeight="500"
	:canResize="true"
	:closeButton="true"
	:buttonsLeft="buttonsLeft"
	:buttonsRight="buttonsRight"
	:contextmenu="contextmenu"
	@closed="emit('closed')"
>
	<template #header>
		<template v-if="pageMetadata">
			<i v-if="pageMetadata.icon" :class="pageMetadata.icon" style="margin-right: 0.5em;"></i>
			<span>{{ pageMetadata.title }}</span>
		</template>
	</template>

	<div ref="contents" :class="$style.root" style="container-type: inline-size;">
		<RouterView :key="reloadCount" :router="windowRouter"/>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, provide, ref, shallowRef } from 'vue';
import { url } from '@@/js/config.js';
import { getScrollContainer } from '@@/js/scroll.js';
import RouterView from '@/components/global/RouterView.vue';
import MkWindow from '@/components/MkWindow.vue';
import { popout as _popout } from '@/scripts/popout.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { useScrollPositionManager } from '@/nirax.js';
import { i18n } from '@/i18n.js';
import { PageMetadata, provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import { openingWindowsCount } from '@/os.js';
import { claimAchievement } from '@/scripts/achievements.js';
import { useRouterFactory } from '@/router/supplier.js';
import { mainRouter } from '@/router/main.js';

const props = defineProps<{
	initialPath: string;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const routerFactory = useRouterFactory();
const windowRouter = routerFactory(props.initialPath);

const contents = shallowRef<HTMLElement | null>(null);
const pageMetadata = ref<null | PageMetadata>(null);
const windowEl = shallowRef<InstanceType<typeof MkWindow>>();
const history = ref<{ path: string; key: string; }[]>([{
	path: windowRouter.getCurrentPath(),
	key: windowRouter.getCurrentKey(),
}]);
const buttonsLeft = computed(() => {
	const buttons: Record<string, unknown>[] = [];

	if (history.value.length > 1) {
		buttons.push({
			icon: 'ti ti-arrow-left',
			onClick: back,
		});
	}

	return buttons;
});
const buttonsRight = computed(() => {
	const buttons = [{
		icon: 'ti ti-reload',
		title: i18n.ts.reload,
		onClick: reload,
	}, {
		icon: 'ti ti-player-eject',
		title: i18n.ts.showInPage,
		onClick: expand,
	}];

	return buttons;
});
const reloadCount = ref(0);

windowRouter.addListener('push', ctx => {
	history.value.push({ path: ctx.path, key: ctx.key });
});

windowRouter.addListener('replace', ctx => {
	history.value.pop();
	history.value.push({ path: ctx.path, key: ctx.key });
});

windowRouter.init();

provide('router', windowRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
});
provideReactiveMetadata(pageMetadata);
provide('shouldOmitHeaderTitle', true);
provide('shouldHeaderThin', true);
provide('forceSpacerMin', true);

const contextmenu = computed(() => ([{
	icon: 'ti ti-player-eject',
	text: i18n.ts.showInPage,
	action: expand,
}, {
	icon: 'ti ti-window-maximize',
	text: i18n.ts.popout,
	action: popout,
}, {
	icon: 'ti ti-external-link',
	text: i18n.ts.openInNewTab,
	action: () => {
		window.open(url + windowRouter.getCurrentPath(), '_blank', 'noopener');
		windowEl.value?.close();
	},
}, {
	icon: 'ti ti-link',
	text: i18n.ts.copyLink,
	action: () => {
		copyToClipboard(url + windowRouter.getCurrentPath());
	},
}]));

function back() {
	history.value.pop();
	windowRouter.replace(history.value.at(-1)!.path, history.value.at(-1)!.key);
}

function reload() {
	reloadCount.value++;
}

function close() {
	windowEl.value?.close();
}

function expand() {
	mainRouter.push(windowRouter.getCurrentPath(), 'forcePage');
	windowEl.value?.close();
}

function popout() {
	_popout(windowRouter.getCurrentPath(), windowEl.value?.$el);
	windowEl.value?.close();
}

useScrollPositionManager(() => getScrollContainer(contents.value), windowRouter);

onMounted(() => {
	openingWindowsCount.value++;
	if (openingWindowsCount.value >= 3) {
		claimAchievement('open3windows');
	}
});

onUnmounted(() => {
	openingWindowsCount.value--;
});

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.root {
	overscroll-behavior: contain;

	min-height: 100%;
	background: var(--MI_THEME-bg);

	--MI-margin: var(--MI-marginHalf);
}
</style>
