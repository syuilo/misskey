<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.paged]: isMainColumn, [$style.naked]: naked, [$style.active]: active, [$style.draghover]: draghover, [$style.dragging]: dragging, [$style.dropready]: dropready }]"
	@dragover.prevent.stop="onDragover"
	@dragleave="onDragleave"
	@drop.prevent.stop="onDrop"
>
	<header
		:class="[$style.header]"
		draggable="true"
		@click="goTop"
		@dragstart="onDragstart"
		@dragend="onDragend"
		@contextmenu.prevent.stop="onContextmenu"
		@wheel="emit('headerWheel', $event)"
	>
		<svg viewBox="0 0 256 128" :class="$style.tabShape">
			<g transform="matrix(6.2431,0,0,6.2431,-677.417,-29.3839)">
				<path d="M149.512,4.707L108.507,4.707C116.252,4.719 118.758,14.958 118.758,14.958C118.758,14.958 121.381,25.283 129.009,25.209L149.512,25.209L149.512,4.707Z" style="fill:var(--MI_THEME-deckBg);"/>
			</g>
		</svg>
		<div :class="$style.color"></div>
		<button v-if="isStacked && !isMainColumn" :class="$style.toggleActive" class="_button" @click="toggleActive">
			<template v-if="active"><i class="ti ti-chevron-up"></i></template>
			<template v-else><i class="ti ti-chevron-down"></i></template>
		</button>
		<span :class="$style.title"><slot name="header"></slot></span>
		<svg viewBox="0 0 16 16" version="1.1" :class="$style.grabber">
			<path fill="currentColor" d="M10 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm0-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm-4 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5-9a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>
		</svg>
		<button v-tooltip="i18n.ts.settings" :class="$style.menu" class="_button" @click.stop="showSettingsMenu"><i class="ti ti-dots"></i></button>
	</header>
	<div v-if="active" ref="body" :class="$style.body">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, provide, watch, shallowRef, ref, computed } from 'vue';
import { updateColumn, swapLeftColumn, swapRightColumn, swapUpColumn, swapDownColumn, stackLeftColumn, popRightColumn, removeColumn, swapColumn } from './deck-store.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import type { Column } from './deck-store.js';
import type { MenuItem } from '@/types/menu.js';

provide('shouldHeaderThin', true);
provide('shouldOmitHeaderTitle', true);
provide('forceSpacerMin', true);

const props = withDefaults(defineProps<{
	column: Column;
	isStacked?: boolean;
	naked?: boolean;
	menu?: MenuItem[];
	refresher?: () => Promise<void>;
}>(), {
	isStacked: false,
	naked: false,
});

const emit = defineEmits<{
	(ev: 'headerWheel', ctx: WheelEvent): void;
}>();

const body = shallowRef<HTMLDivElement | null>();

const dragging = ref(false);
watch(dragging, v => os.deckGlobalEvents.emit(v ? 'column.dragStart' : 'column.dragEnd'));

const draghover = ref(false);
const dropready = ref(false);

const isMainColumn = computed(() => props.column.type === 'main');
const active = computed(() => props.column.active !== false);

onMounted(() => {
	os.deckGlobalEvents.on('column.dragStart', onOtherDragStart);
	os.deckGlobalEvents.on('column.dragEnd', onOtherDragEnd);
});

onBeforeUnmount(() => {
	os.deckGlobalEvents.off('column.dragStart', onOtherDragStart);
	os.deckGlobalEvents.off('column.dragEnd', onOtherDragEnd);
});

function onOtherDragStart() {
	dropready.value = true;
}

function onOtherDragEnd() {
	dropready.value = false;
}

function toggleActive() {
	if (!props.isStacked) return;
	updateColumn(props.column.id, {
		active: !props.column.active,
	});
}

function getMenu() {
	const menuItems: MenuItem[] = [];

	if (props.menu) {
		menuItems.push(...props.menu, {
			type: 'divider',
		});
	}

	if (props.refresher) {
		menuItems.push({
			icon: 'ti ti-refresh',
			text: i18n.ts.reload,
			action: () => {
				if (props.refresher) {
					props.refresher();
				}
			},
		});
	}

	menuItems.push({
		icon: 'ti ti-settings',
		text: i18n.ts._deck.configureColumn,
		action: async () => {
			const { canceled, result } = await os.form(props.column.name, {
				name: {
					type: 'string',
					label: i18n.ts.name,
					default: props.column.name,
				},
				width: {
					type: 'number',
					label: i18n.ts.width,
					description: i18n.ts._deck.usedAsMinWidthWhenFlexible,
					default: props.column.width,
				},
				flexible: {
					type: 'boolean',
					label: i18n.ts._deck.flexible,
					default: props.column.flexible,
				},
			});
			if (canceled) return;
			updateColumn(props.column.id, result);
		},
	});

	const moveToMenuItems: MenuItem[] = [];

	moveToMenuItems.push({
		icon: 'ti ti-arrow-left',
		text: i18n.ts._deck.swapLeft,
		action: () => {
			swapLeftColumn(props.column.id);
		},
	}, {
		icon: 'ti ti-arrow-right',
		text: i18n.ts._deck.swapRight,
		action: () => {
			swapRightColumn(props.column.id);
		},
	});

	if (props.isStacked) {
		moveToMenuItems.push({
			icon: 'ti ti-arrow-up',
			text: i18n.ts._deck.swapUp,
			action: () => {
				swapUpColumn(props.column.id);
			},
		}, {
			icon: 'ti ti-arrow-down',
			text: i18n.ts._deck.swapDown,
			action: () => {
				swapDownColumn(props.column.id);
			},
		});
	}

	menuItems.push({
		type: 'parent',
		text: i18n.ts.move + '...',
		icon: 'ti ti-arrows-move',
		children: moveToMenuItems,
	}, {
		icon: 'ti ti-stack-2',
		text: i18n.ts._deck.stackLeft,
		action: () => {
			stackLeftColumn(props.column.id);
		},
	});

	if (props.isStacked) {
		menuItems.push({
			icon: 'ti ti-window-maximize',
			text: i18n.ts._deck.popRight,
			action: () => {
				popRightColumn(props.column.id);
			},
		});
	}

	menuItems.push({ type: 'divider' }, {
		icon: 'ti ti-trash',
		text: i18n.ts.remove,
		danger: true,
		action: () => {
			removeColumn(props.column.id);
		},
	});

	return menuItems;
}

function showSettingsMenu(ev: MouseEvent) {
	os.popupMenu(getMenu(), ev.currentTarget ?? ev.target);
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(getMenu(), ev);
}

function goTop() {
	if (body.value) {
		body.value.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	}
}

function onDragstart(ev) {
	ev.dataTransfer.effectAllowed = 'move';
	ev.dataTransfer.setData(_DATA_TRANSFER_DECK_COLUMN_, props.column.id);

	// Chromeのバグで、Dragstartハンドラ内ですぐにDOMを変更する(=リアクティブなプロパティを変更する)とDragが終了してしまう
	// SEE: https://stackoverflow.com/questions/19639969/html5-dragend-event-firing-immediately
	window.setTimeout(() => {
		dragging.value = true;
	}, 10);
}

function onDragend(ev) {
	dragging.value = false;
}

function onDragover(ev) {
	// 自分自身がドラッグされている場合
	if (dragging.value) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = 'none';
	} else {
		const isDeckColumn = ev.dataTransfer.types[0] === _DATA_TRANSFER_DECK_COLUMN_;

		ev.dataTransfer.dropEffect = isDeckColumn ? 'move' : 'none';

		if (isDeckColumn) draghover.value = true;
	}
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev) {
	draghover.value = false;
	os.deckGlobalEvents.emit('column.dragEnd');

	const id = ev.dataTransfer.getData(_DATA_TRANSFER_DECK_COLUMN_);
	if (id != null && id !== '') {
		swapColumn(props.column.id, id);
	}
}
</script>

<style lang="scss" module>
.root {
	--root-margin: 10px;
	--deckColumnHeaderHeight: 38px;

	height: 100%;
	overflow: clip;
	contain: strict;
	border-radius: 10px;

	&.draghover {
		&::after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--MI_THEME-focus);
		}
	}

	&.dragging {
		&::after {
			content: "";
			display: block;
			position: absolute;
			z-index: 1000;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--MI_THEME-focus);
			opacity: 0.5;
		}
	}

	&.dropready {
		* {
			pointer-events: none;
		}
	}

	&:not(.active) {
		flex-basis: var(--deckColumnHeaderHeight);
		min-height: var(--deckColumnHeaderHeight);
		border-bottom-right-radius: 0;
	}

	&.naked {
		background: var(--MI_THEME-acrylicBg) !important;
		-webkit-backdrop-filter: var(--MI-blur, blur(10px));
		backdrop-filter: var(--MI-blur, blur(10px));

		> .header {
			background: transparent;
			box-shadow: none;
			color: var(--MI_THEME-fg);
		}

		> .body {
			background: transparent !important;
			scrollbar-color: var(--MI_THEME-scrollbarHandle) transparent;

			&::-webkit-scrollbar-track {
				background: transparent;
			}
		}
	}

	&.paged {
		background: var(--MI_THEME-bg) !important;

		> .body {
			background: var(--MI_THEME-bg) !important;
			overflow-y: scroll !important;
			scrollbar-color: var(--MI_THEME-scrollbarHandle) transparent;

			&::-webkit-scrollbar-track {
				background: inherit;
			}
		}
	}
}

.header {
	position: relative;
	display: flex;
	z-index: 2;
	line-height: var(--deckColumnHeaderHeight);
	height: var(--deckColumnHeaderHeight);
	padding: 0 16px 0 30px;
	font-size: 0.9em;
	color: var(--MI_THEME-panelHeaderFg);
	background: var(--MI_THEME-panelHeaderBg);
	box-shadow: 0 1px 0 0 var(--MI_THEME-panelHeaderDivider);
	cursor: pointer;
	user-select: none;
}

.color {
	position: absolute;
	top: 12px;
	left: 12px;
	width: 3px;
	height: calc(100% - 24px);
	background: var(--MI_THEME-accent);
	border-radius: 999px;
}

.tabShape {
	position: absolute;
	top: 0;
	right: -8px;
	width: auto;
	height: calc(100% - 6px);
}

.title {
	display: inline-block;
	align-items: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	width: 100%;
}

.toggleActive,
.menu {
	z-index: 1;
	width: var(--deckColumnHeaderHeight);
	line-height: var(--deckColumnHeaderHeight);
}

.toggleActive {
	margin-left: -16px;
}

.grabber {
	margin-left: auto;
	margin-right: 10px;
	padding: 8px 8px;
	box-sizing: border-box;
	height: var(--deckColumnHeaderHeight);
	cursor: move;
	user-select: none;
	opacity: 0.5;
}

.menu {
	margin-right: -16px;
}

.body {
	height: calc(100% - var(--deckColumnHeaderHeight));
	overflow-y: auto;
	overflow-x: clip;
	overscroll-behavior-y: contain;
	box-sizing: border-box;
	container-type: size;
	background-color: var(--MI_THEME-bg);
	scrollbar-color: var(--MI_THEME-scrollbarHandle) var(--MI_THEME-panel);

	&::-webkit-scrollbar-track {
		background: var(--MI_THEME-panel);
	}
}
</style>
