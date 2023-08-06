<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="gbhvwtnk" :class="{ wallpaper }" :style="`--globalHeaderHeight:${globalHeaderHeight}px`">
	<XHeaderMenu v-if="showMenuOnTop" v-get-size="(w, h) => globalHeaderHeight = h"/>

	<div class="columns" :class="{ fullView, withGlobalHeader: showMenuOnTop }">
		<div v-if="!showMenuOnTop" class="sidebar">
			<XSidebar/>
		</div>
		<div v-else ref="widgetsLeft" class="widgets left">
			<XWidgets place="left" :marginTop="'var(--margin)'" @mounted="attachSticky(widgetsLeft)"/>
		</div>

		<main class="main" @contextmenu.stop="onContextmenu">
			<div class="content" style="container-type: inline-size;">
				<RouterView/>
			</div>
		</main>

		<div v-if="isDesktop" ref="widgetsRight" class="widgets right">
			<XWidgets :place="showMenuOnTop ? 'right' : null" :marginTop="showMenuOnTop ? '0' : 'var(--margin)'" @mounted="attachSticky(widgetsRight)"/>
		</div>
	</div>

	<Transition :name="defaultStore.state.animation ? 'tray-back' : ''">
		<div
			v-if="widgetsShowing"
			class="tray-back _modalBg"
			@click="widgetsShowing = false"
			@touchstart.passive="widgetsShowing = false"
		></div>
	</Transition>

	<Transition :name="defaultStore.state.animation ? 'tray' : ''">
		<XWidgets v-if="widgetsShowing" class="tray"/>
	</Transition>

	<iframe v-if="defaultStore.state.aiChanMode" ref="live2d" class="ivnzpscs" src="https://misskey-dev.github.io/mascot-web/?scale=2&y=1.4"></iframe>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent, ComputedRef, onMounted, provide } from 'vue';
import XSidebar from './classic.sidebar.vue';
import XCommon from './_common_/common.vue';
import { instanceName } from '@/config';
import { StickySidebar } from '@/scripts/sticky-sidebar';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { miLocalStorage } from '@/local-storage';
const XHeaderMenu = defineAsyncComponent(() => import('./classic.header.vue'));
const XWidgets = defineAsyncComponent(() => import('./universal.widgets.vue'));

const DESKTOP_THRESHOLD = 1100;

let isDesktop = $ref(window.innerWidth >= DESKTOP_THRESHOLD);

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();
let widgetsShowing = $ref(false);
let fullView = $ref(false);
let globalHeaderHeight = $ref(0);
const wallpaper = miLocalStorage.getItem('wallpaper') != null;
const showMenuOnTop = $computed(() => defaultStore.state.menuDisplay === 'top');
let live2d = $shallowRef<HTMLIFrameElement>();
let widgetsLeft = $ref();
let widgetsRight = $ref();

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
	if (pageMetadata.value) {
		document.title = `${pageMetadata.value.title} | ${instanceName}`;
	}
});
provide('shouldHeaderThin', showMenuOnTop);
provide('forceSpacerMin', true);

function attachSticky(el) {
	const sticky = new StickySidebar(el, 0, defaultStore.state.menuDisplay === 'top' ? 60 : 0); // TODO: ヘッダーの高さを60pxと決め打ちしているのを直す
	window.addEventListener('scroll', () => {
		sticky.calc(window.scrollY);
	}, { passive: true });
}

function top() {
	window.scroll({ top: 0, behavior: 'smooth' });
}

function onContextmenu(ev: MouseEvent) {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(ev.target.tagName) || ev.target.attributes['contenteditable']) return;
	if (window.getSelection().toString() !== '') return;
	const path = mainRouter.getCurrentPath();
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: fullView ? 'ti ti-minimize' : 'ti ti-maximize',
		text: fullView ? i18n.ts.quitFullView : i18n.ts.fullView,
		action: () => {
			fullView = !fullView;
		},
	}, {
		icon: 'ti ti-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(path);
		},
	}], ev);
}

function onAiClick(ev) {
	//if (this.live2d) this.live2d.click(ev);
}

if (window.innerWidth < 1024) {
	const currentUI = miLocalStorage.getItem('ui');
	miLocalStorage.setItem('ui_temp', currentUI ?? 'default');
	miLocalStorage.setItem('ui', 'default');
	location.reload();
}

document.documentElement.style.overflowY = 'scroll';

defaultStore.loaded.then(() => {
	if (defaultStore.state.widgets.length === 0) {
		defaultStore.set('widgets', [{
			name: 'calendar',
			id: 'a', place: null, data: {},
		}, {
			name: 'notifications',
			id: 'b', place: null, data: {},
		}, {
			name: 'trends',
			id: 'c', place: null, data: {},
		}]);
	}
});

onMounted(() => {
	window.addEventListener('resize', () => {
		isDesktop = (window.innerWidth >= DESKTOP_THRESHOLD);
	}, { passive: true });

	if (defaultStore.state.aiChanMode) {
		const iframeRect = live2d.getBoundingClientRect();
		window.addEventListener('mousemove', ev => {
			live2d.contentWindow.postMessage({
				type: 'moveCursor',
				body: {
					x: ev.clientX - iframeRect.left,
					y: ev.clientY - iframeRect.top,
				},
			}, '*');
		}, { passive: true });
		window.addEventListener('touchmove', ev => {
			live2d.contentWindow.postMessage({
				type: 'moveCursor',
				body: {
					x: ev.touches[0].clientX - iframeRect.left,
					y: ev.touches[0].clientY - iframeRect.top,
				},
			}, '*');
		}, { passive: true });
	}
});
</script>

<style lang="scss" scoped>
.tray-enter-active,
.tray-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-enter-from,
.tray-leave-active {
	opacity: 0;
	transform: translateX(240px);
}

.tray-back-enter-active,
.tray-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-back-enter-from,
.tray-back-leave-active {
	opacity: 0;
}

.gbhvwtnk {
	$ui-font-size: 1em;
	$widgets-hide-threshold: 1200px;

	min-height: 100dvh;
	box-sizing: border-box;

	&.wallpaper {
		background: var(--wallpaperOverlay);
		//backdrop-filter: var(--blur, blur(4px));
	}

	> .columns {
		display: flex;
		justify-content: center;
		max-width: 100%;
		//margin: 32px 0;

		&.fullView {
			margin: 0;

			> .sidebar {
				display: none;
			}

			> .widgets {
				display: none;
			}

			> .main {
				margin: 0;
				border-radius: 0;
				box-shadow: none;
				width: 100%;
			}
		}

		> .main {
			min-width: 0;
			width: 750px;
			margin: 0 16px 0 0;
			border-left: solid 1px var(--divider);
			border-right: solid 1px var(--divider);
			border-radius: 0;
			overflow: clip;
			--margin: 12px;
		}

		> .widgets {
			//--panelBorder: none;
			width: 300px;
			padding-bottom: calc(var(--margin) + env(safe-area-inset-bottom, 0px));

			@media (max-width: $widgets-hide-threshold) {
				display: none;
			}

			&.left {
				margin-right: 16px;
			}
		}

		> .sidebar {
			margin-top: 16px;
		}

		&.withGlobalHeader {
			> .main {
				margin-top: 0;
				border: solid 1px var(--divider);
				border-radius: var(--radius);
				--stickyTop: var(--globalHeaderHeight);
			}

			> .widgets {
				--stickyTop: var(--globalHeaderHeight);
				margin-top: 0;
			}
		}

		@media (max-width: 850px) {
			margin: 0;

			> .sidebar {
				border-right: solid 0.5px var(--divider);
			}

			> .main {
				margin: 0;
				border-radius: 0;
				box-shadow: none;
				width: 100%;
			}
		}
	}

	> .tray-back {
		z-index: 1001;
	}

	> .tray {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 1001;
		height: 100dvh;
		padding: var(--margin) var(--margin) calc(var(--margin) + env(safe-area-inset-bottom, 0px));
		box-sizing: border-box;
		overflow: auto;
		background: var(--bg);
	}

	> .ivnzpscs {
		position: fixed;
		bottom: 0;
		right: 0;
		width: 300px;
		height: 600px;
		border: none;
		pointer-events: none;
	}
}
</style>
