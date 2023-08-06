<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="defaultStore.state.animation ? $style.transition_window_enterActive : ''"
	:leaveActiveClass="defaultStore.state.animation ? $style.transition_window_leaveActive : ''"
	:enterFromClass="defaultStore.state.animation ? $style.transition_window_enterFrom : ''"
	:leaveToClass="defaultStore.state.animation ? $style.transition_window_leaveTo : ''"
	appear
	@afterLeave="$emit('closed')"
>
	<div v-if="showing" ref="rootEl" :class="[$style.root, { [$style.maximized]: maximized }]">
		<div :class="$style.body" class="_shadow" @mousedown="onBodyMousedown" @keydown="onKeydown">
			<div :class="[$style.header, { [$style.mini]: mini }]" @contextmenu.prevent.stop="onContextmenu">
				<span :class="$style.headerLeft">
					<template v-if="!minimized">
						<button v-for="button in buttonsLeft" v-tooltip="button.title" class="_button" :class="[$style.headerButton, { [$style.highlighted]: button.highlighted }]" @click="button.onClick"><i :class="button.icon"></i></button>
					</template>
				</span>
				<span :class="$style.headerTitle" @mousedown.prevent="onHeaderMousedown" @touchstart.prevent="onHeaderMousedown">
					<slot name="header"></slot>
				</span>
				<span :class="$style.headerRight">
					<template v-if="!minimized">
						<button v-for="button in buttonsRight" v-tooltip="button.title" class="_button" :class="[$style.headerButton, { [$style.highlighted]: button.highlighted }]" @click="button.onClick"><i :class="button.icon"></i></button>
					</template>
					<button v-if="canResize && minimized" v-tooltip="i18n.ts.windowRestore" class="_button" :class="$style.headerButton" @click="unMinimize()"><i class="ti ti-maximize"></i></button>
					<button v-else-if="canResize && !maximized" v-tooltip="i18n.ts.windowMinimize" class="_button" :class="$style.headerButton" @click="minimize()"><i class="ti ti-minimize"></i></button>
					<button v-if="canResize && maximized" v-tooltip="i18n.ts.windowRestore" class="_button" :class="$style.headerButton" @click="unMaximize()"><i class="ti ti-picture-in-picture"></i></button>
					<button v-else-if="canResize && !maximized && !minimized" v-tooltip="i18n.ts.windowMaximize" class="_button" :class="$style.headerButton" @click="maximize()"><i class="ti ti-rectangle"></i></button>
					<button v-if="closeButton" v-tooltip="i18n.ts.close" class="_button" :class="$style.headerButton" @click="close()"><i class="ti ti-x"></i></button>
				</span>
			</div>
			<div :class="$style.content">
				<slot></slot>
			</div>
		</div>
		<template v-if="canResize && !minimized">
			<div :class="$style.handleTop" @mousedown.prevent="onTopHandleMousedown"></div>
			<div :class="$style.handleRight" @mousedown.prevent="onRightHandleMousedown"></div>
			<div :class="$style.handleBottom" @mousedown.prevent="onBottomHandleMousedown"></div>
			<div :class="$style.handleLeft" @mousedown.prevent="onLeftHandleMousedown"></div>
			<div :class="$style.handleTopLeft" @mousedown.prevent="onTopLeftHandleMousedown"></div>
			<div :class="$style.handleTopRight" @mousedown.prevent="onTopRightHandleMousedown"></div>
			<div :class="$style.handleBottomRight" @mousedown.prevent="onBottomRightHandleMousedown"></div>
			<div :class="$style.handleBottomLeft" @mousedown.prevent="onBottomLeftHandleMousedown"></div>
		</template>
	</div>
</Transition>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onBeforeUnmount, onMounted, provide } from 'vue';
import contains from '@/scripts/contains';
import * as os from '@/os';
import { MenuItem } from '@/types/menu';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';

const minHeight = 50;
const minWidth = 250;

function dragListen(fn: (ev: MouseEvent) => void) {
	window.addEventListener('mousemove', fn);
	window.addEventListener('touchmove', fn);
	window.addEventListener('mouseleave', dragClear.bind(null, fn));
	window.addEventListener('mouseup', dragClear.bind(null, fn));
	window.addEventListener('touchend', dragClear.bind(null, fn));
}

function dragClear(fn) {
	window.removeEventListener('mousemove', fn);
	window.removeEventListener('touchmove', fn);
	window.removeEventListener('mouseleave', dragClear);
	window.removeEventListener('mouseup', dragClear);
	window.removeEventListener('touchend', dragClear);
}

const props = withDefaults(defineProps<{
	initialWidth: number;
	initialHeight: number | null;
	canResize?: boolean;
	closeButton?: boolean;
	mini?: boolean;
	front?: boolean;
	contextmenu?: MenuItem[] | null;
	buttonsLeft?: any[];
	buttonsRight?: any[];
}>(), {
	initialWidth: 400,
	initialHeight: null,
	canResize: false,
	closeButton: true,
	mini: false,
	front: false,
	contextmenu: null,
	buttonsLeft: () => [],
	buttonsRight: () => [],
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

provide('inWindow', true);

let rootEl = $shallowRef<HTMLElement | null>();
let showing = $ref(true);
let beforeClickedAt = 0;
let maximized = $ref(false);
let minimized = $ref(false);
let unResizedTop = '';
let unResizedLeft = '';
let unResizedWidth = '';
let unResizedHeight = '';

function close() {
	showing = false;
}

function onKeydown(evt) {
	if (evt.which === 27) { // Esc
		evt.preventDefault();
		evt.stopPropagation();
		close();
	}
}

function onContextmenu(ev: MouseEvent) {
	if (props.contextmenu) {
		os.contextMenu(props.contextmenu, ev);
	}
}

// 最前面へ移動
function top() {
	if (rootEl) {
		rootEl.style.zIndex = os.claimZIndex(props.front ? 'middle' : 'low');
	}
}

function maximize() {
	maximized = true;
	unResizedTop = rootEl.style.top;
	unResizedLeft = rootEl.style.left;
	unResizedWidth = rootEl.style.width;
	unResizedHeight = rootEl.style.height;
	rootEl.style.top = '0';
	rootEl.style.left = '0';
	rootEl.style.width = '100%';
	rootEl.style.height = '100%';
}

function unMaximize() {
	maximized = false;
	rootEl.style.top = unResizedTop;
	rootEl.style.left = unResizedLeft;
	rootEl.style.width = unResizedWidth;
	rootEl.style.height = unResizedHeight;
}

function minimize() {
	minimized = true;
	unResizedWidth = rootEl.style.width;
	unResizedHeight = rootEl.style.height;
	rootEl.style.width = minWidth + 'px';
	rootEl.style.height = props.mini ? '32px' : '39px';
}

function unMinimize() {
	const main = rootEl;
	if (main == null) return;

	minimized = false;
	rootEl.style.width = unResizedWidth;
	rootEl.style.height = unResizedHeight;
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = main.offsetWidth;
	const windowHeight = main.offsetHeight;

	const position = main.getBoundingClientRect();
	if (position.top + windowHeight > browserHeight) main.style.top = browserHeight - windowHeight + 'px';
	if (position.left + windowWidth > browserWidth) main.style.left = browserWidth - windowWidth + 'px';
}

function onBodyMousedown() {
	top();
}

function onDblClick() {
	if (minimized) {
		unMinimize();
	} else {
		maximize();
	}
}

function onHeaderMousedown(evt: MouseEvent) {
	// 右クリックはコンテキストメニューを開こうとした可能性が高いため無視
	if (evt.button === 2) return;

	let beforeMaximized = false;

	if (maximized) {
		beforeMaximized = true;
		unMaximize();
	}

	// ダブルクリック判定
	if (Date.now() - beforeClickedAt < 300) {
		beforeClickedAt = Date.now();
		onDblClick();
		return;
	}

	beforeClickedAt = Date.now();

	const main = rootEl;
	if (main == null) return;

	if (!contains(main, document.activeElement)) main.focus();

	const position = main.getBoundingClientRect();

	const clickX = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientX : evt.clientX;
	const clickY = evt.touches && evt.touches.length > 0 ? evt.touches[0].clientY : evt.clientY;
	const moveBaseX = beforeMaximized ? parseInt(unResizedWidth, 10) / 2 : clickX - position.left; // TODO: parseIntやめる
	const moveBaseY = beforeMaximized ? 20 : clickY - position.top;
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = main.offsetWidth;
	const windowHeight = main.offsetHeight;

	function move(x: number, y: number) {
		let moveLeft = x - moveBaseX;
		let moveTop = y - moveBaseY;

		// 下はみ出し
		if (moveTop + windowHeight > browserHeight) moveTop = browserHeight - windowHeight;

		// 左はみ出し
		if (moveLeft < 0) moveLeft = 0;

		// 上はみ出し
		if (moveTop < 0) moveTop = 0;

		// 右はみ出し
		if (moveLeft + windowWidth > browserWidth) moveLeft = browserWidth - windowWidth;

		rootEl.style.left = moveLeft + 'px';
		rootEl.style.top = moveTop + 'px';
	}

	if (beforeMaximized) {
		move(clickX, clickY);
	}

	// 動かした時
	dragListen(me => {
		const x = me.touches && me.touches.length > 0 ? me.touches[0].clientX : me.clientX;
		const y = me.touches && me.touches.length > 0 ? me.touches[0].clientY : me.clientY;

		move(x, y);
	});
}

// 上ハンドル掴み時
function onTopHandleMousedown(evt) {
	const main = rootEl;
	// どういうわけかnullになることがある
	if (main == null) return;

	const base = evt.clientY;
	const height = parseInt(getComputedStyle(main, '').height, 10);
	const top = parseInt(getComputedStyle(main, '').top, 10);

	// 動かした時
	dragListen(me => {
		const move = me.clientY - base;
		if (top + move > 0) {
			if (height + -move > minHeight) {
				applyTransformHeight(height + -move);
				applyTransformTop(top + move);
			} else { // 最小の高さより小さくなろうとした時
				applyTransformHeight(minHeight);
				applyTransformTop(top + (height - minHeight));
			}
		} else { // 上のはみ出し時
			applyTransformHeight(top + height);
			applyTransformTop(0);
		}
	});
}

// 右ハンドル掴み時
function onRightHandleMousedown(evt) {
	const main = rootEl;
	if (main == null) return;

	const base = evt.clientX;
	const width = parseInt(getComputedStyle(main, '').width, 10);
	const left = parseInt(getComputedStyle(main, '').left, 10);
	const browserWidth = window.innerWidth;

	// 動かした時
	dragListen(me => {
		const move = me.clientX - base;
		if (left + width + move < browserWidth) {
			if (width + move > minWidth) {
				applyTransformWidth(width + move);
			} else { // 最小の幅より小さくなろうとした時
				applyTransformWidth(minWidth);
			}
		} else { // 右のはみ出し時
			applyTransformWidth(browserWidth - left);
		}
	});
}

// 下ハンドル掴み時
function onBottomHandleMousedown(evt) {
	const main = rootEl;
	if (main == null) return;

	const base = evt.clientY;
	const height = parseInt(getComputedStyle(main, '').height, 10);
	const top = parseInt(getComputedStyle(main, '').top, 10);
	const browserHeight = window.innerHeight;

	// 動かした時
	dragListen(me => {
		const move = me.clientY - base;
		if (top + height + move < browserHeight) {
			if (height + move > minHeight) {
				applyTransformHeight(height + move);
			} else { // 最小の高さより小さくなろうとした時
				applyTransformHeight(minHeight);
			}
		} else { // 下のはみ出し時
			applyTransformHeight(browserHeight - top);
		}
	});
}

// 左ハンドル掴み時
function onLeftHandleMousedown(evt) {
	const main = rootEl;
	if (main == null) return;

	const base = evt.clientX;
	const width = parseInt(getComputedStyle(main, '').width, 10);
	const left = parseInt(getComputedStyle(main, '').left, 10);

	// 動かした時
	dragListen(me => {
		const move = me.clientX - base;
		if (left + move > 0) {
			if (width + -move > minWidth) {
				applyTransformWidth(width + -move);
				applyTransformLeft(left + move);
			} else { // 最小の幅より小さくなろうとした時
				applyTransformWidth(minWidth);
				applyTransformLeft(left + (width - minWidth));
			}
		} else { // 左のはみ出し時
			applyTransformWidth(left + width);
			applyTransformLeft(0);
		}
	});
}

// 左上ハンドル掴み時
function onTopLeftHandleMousedown(evt) {
	onTopHandleMousedown(evt);
	onLeftHandleMousedown(evt);
}

// 右上ハンドル掴み時
function onTopRightHandleMousedown(evt) {
	onTopHandleMousedown(evt);
	onRightHandleMousedown(evt);
}

// 右下ハンドル掴み時
function onBottomRightHandleMousedown(evt) {
	onBottomHandleMousedown(evt);
	onRightHandleMousedown(evt);
}

// 左下ハンドル掴み時
function onBottomLeftHandleMousedown(evt) {
	onBottomHandleMousedown(evt);
	onLeftHandleMousedown(evt);
}

// 高さを適用
function applyTransformHeight(height) {
	if (height > window.innerHeight) height = window.innerHeight;
	rootEl.style.height = height + 'px';
}

// 幅を適用
function applyTransformWidth(width) {
	if (width > window.innerWidth) width = window.innerWidth;
	rootEl.style.width = width + 'px';
}

// Y座標を適用
function applyTransformTop(top) {
	rootEl.style.top = top + 'px';
}

// X座標を適用
function applyTransformLeft(left) {
	rootEl.style.left = left + 'px';
}

function onBrowserResize() {
	const main = rootEl;
	if (main == null) return;

	const position = main.getBoundingClientRect();
	const browserWidth = window.innerWidth;
	const browserHeight = window.innerHeight;
	const windowWidth = main.offsetWidth;
	const windowHeight = main.offsetHeight;
	if (position.left < 0) main.style.left = '0'; // 左はみ出し
	if (position.top + windowHeight > browserHeight) main.style.top = browserHeight - windowHeight + 'px'; // 下はみ出し
	if (position.left + windowWidth > browserWidth) main.style.left = browserWidth - windowWidth + 'px'; // 右はみ出し
	if (position.top < 0) main.style.top = '0'; // 上はみ出し
}

onMounted(() => {
	applyTransformWidth(props.initialWidth);
	if (props.initialHeight) applyTransformHeight(props.initialHeight);

	applyTransformTop((window.innerHeight / 2) - (rootEl.offsetHeight / 2));
	applyTransformLeft((window.innerWidth / 2) - (rootEl.offsetWidth / 2));

	// 他のウィンドウ内のボタンなどを押してこのウィンドウが開かれた場合、親が最前面になろうとするのでそれに隠されないようにする
	top();

	window.addEventListener('resize', onBrowserResize);
});

onBeforeUnmount(() => {
	window.removeEventListener('resize', onBrowserResize);
});

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.transition_window_enterActive,
.transition_window_leaveActive {
	transition: opacity 0.2s, transform 0.2s !important;
}
.transition_window_enterFrom,
.transition_window_leaveTo {
	pointer-events: none;
	opacity: 0;
	transform: scale(0.9);
}

.root {
	position: fixed;
	top: 0;
	left: 0;

	&.maximized {
		> .body {
			border-radius: 0;
		}
	}
}

.body {
	overflow: clip;
	display: flex;
	flex-direction: column;
	contain: content;
	width: 100%;
	height: 100%;
	border-radius: var(--radius);
}

.header {
	--height: 39px;

	&.mini {
		--height: 32px;
	}

	display: flex;
	position: relative;
	z-index: 1;
	flex-shrink: 0;
	user-select: none;
	height: var(--height);
	background: var(--windowHeader);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	//border-bottom: solid 1px var(--divider);
	font-size: 90%;
	font-weight: bold;
}

.headerButton {
	height: var(--height);
	width: var(--height);

	&:hover {
		color: var(--fgHighlighted);
	}

	&.highlighted {
		color: var(--accent);
	}
}

.headerLeft {
	margin-right: 16px;
}

.headerRight {
	min-width: 16px;
}

.headerTitle {
	flex: 1;
	position: relative;
	line-height: var(--height);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	cursor: move;
}

.content {
	flex: 1;
	overflow: auto;
	background: var(--panel);
	container-type: size;
}

$handleSize: 8px;

.handle {
	position: absolute;
}

.handleTop {
	composes: handle;
	top: -($handleSize);
	left: 0;
	width: 100%;
	height: $handleSize;
	cursor: ns-resize;
}

.handleRight {
	composes: handle;
	top: 0;
	right: -($handleSize);
	width: $handleSize;
	height: 100%;
	cursor: ew-resize;
}

.handleBottom {
	composes: handle;
	bottom: -($handleSize);
	left: 0;
	width: 100%;
	height: $handleSize;
	cursor: ns-resize;
}

.handleLeft {
	composes: handle;
	top: 0;
	left: -($handleSize);
	width: $handleSize;
	height: 100%;
	cursor: ew-resize;
}

.handleTopLeft {
	composes: handle;
	top: -($handleSize);
	left: -($handleSize);
	width: $handleSize * 2;
	height: $handleSize * 2;
	cursor: nwse-resize;
}

.handleTopRight {
	composes: handle;
	top: -($handleSize);
	right: -($handleSize);
	width: $handleSize * 2;
	height: $handleSize * 2;
	cursor: nesw-resize;
}

.handleBottomRight {
	composes: handle;
	bottom: -($handleSize);
	right: -($handleSize);
	width: $handleSize * 2;
	height: $handleSize * 2;
	cursor: nwse-resize;
}

.handleBottomLeft {
	composes: handle;
	bottom: -($handleSize);
	left: -($handleSize);
	width: $handleSize * 2;
	height: $handleSize * 2;
	cursor: nesw-resize;
}
</style>
