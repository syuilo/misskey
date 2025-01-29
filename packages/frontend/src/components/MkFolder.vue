<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" role="group" :aria-expanded="opened">
	<MkStickyContainer>
		<template #header>
			<button :class="[$style.header, { [$style.opened]: opened }]" class="_button" role="button" data-cy-folder-header @click="toggle">
				<div :class="$style.headerIcon"><slot name="icon"></slot></div>
				<div :class="$style.headerText">
					<div :class="$style.headerTextMain">
						<MkCondensedLine :minScale="2 / 3"><slot name="label"></slot></MkCondensedLine>
					</div>
					<div :class="$style.headerTextSub">
						<slot name="caption"></slot>
					</div>
				</div>
				<div :class="$style.headerRight">
					<span :class="$style.headerRightText"><slot name="suffix"></slot></span>
					<i v-if="opened" class="ti ti-chevron-up icon"></i>
					<i v-else class="ti ti-chevron-down icon"></i>
				</div>
			</button>
		</template>

		<div v-if="openedAtLeastOnce" :class="[$style.body, { [$style.bgSame]: bgSame }]" :style="{ maxHeight: maxHeight ? `${maxHeight}px` : undefined, overflow: maxHeight ? `auto` : undefined }" :aria-hidden="!opened">
			<Transition
				:enterActiveClass="defaultStore.state.animation ? $style.transition_toggle_enterActive : ''"
				:leaveActiveClass="defaultStore.state.animation ? $style.transition_toggle_leaveActive : ''"
				:enterFromClass="defaultStore.state.animation ? $style.transition_toggle_enterFrom : ''"
				:leaveToClass="defaultStore.state.animation ? $style.transition_toggle_leaveTo : ''"
				@enter="enter"
				@afterEnter="afterEnter"
				@leave="leave"
				@afterLeave="afterLeave"
			>
				<KeepAlive>
					<div v-show="opened">
						<MkSpacer v-if="withSpacer" :marginMin="spacerMin" :marginMax="spacerMax">
							<slot></slot>
						</MkSpacer>
						<div v-else>
							<slot></slot>
						</div>
						<div v-if="$slots.footer" :class="$style.footer">
							<slot name="footer"></slot>
						</div>
					</div>
				</KeepAlive>
			</Transition>
		</div>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, shallowRef } from 'vue';
import { defaultStore } from '@/store.js';
import { getBgColor } from '@/scripts/get-bg-color.js';

const props = withDefaults(defineProps<{
	defaultOpen?: boolean;
	maxHeight?: number | null;
	withSpacer?: boolean;
	spacerMin?: number;
	spacerMax?: number;
}>(), {
	defaultOpen: false,
	maxHeight: null,
	withSpacer: true,
	spacerMin: 14,
	spacerMax: 22,
});

const rootEl = shallowRef<HTMLElement>();
const bgSame = ref(false);
const opened = ref(props.defaultOpen);
const openedAtLeastOnce = ref(props.defaultOpen);

function enter(el: Element) {
	if (!(el instanceof HTMLElement)) return;
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = '0';
	el.offsetHeight; // reflow
	el.style.height = `${Math.min(elementHeight, props.maxHeight ?? Infinity)}px`;
}

function afterEnter(el: Element) {
	if (!(el instanceof HTMLElement)) return;
	el.style.height = '';
}

function leave(el: Element) {
	if (!(el instanceof HTMLElement)) return;
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = `${elementHeight}px`;
	el.offsetHeight; // reflow
	el.style.height = '0';
}

function afterLeave(el: Element) {
	if (!(el instanceof HTMLElement)) return;
	el.style.height = '';
}

function toggle() {
	if (!opened.value) {
		openedAtLeastOnce.value = true;
	}

	nextTick(() => {
		opened.value = !opened.value;
	});
}

onMounted(() => {
	const computedStyle = getComputedStyle(document.documentElement);
	const parentBg = getBgColor(rootEl.value?.parentElement) ?? 'transparent';
	const myBg = computedStyle.getPropertyValue('--MI_THEME-panel');
	bgSame.value = parentBg === myBg;
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive,
.transition_toggle_leaveActive {
	overflow-y: clip;
	transition: opacity 0.3s, height 0.3s, transform 0.3s !important;
}
.transition_toggle_enterFrom,
.transition_toggle_leaveTo {
	opacity: 0;
}

.root {
	display: block;
}

.header {
	display: flex;
	align-items: center;
	width: 100%;
	box-sizing: border-box;
	padding: 9px 12px 9px 12px;
	background: var(--MI_THEME-folderHeaderBg);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-radius: 6px;
	transition: border-radius 0.3s;

	&:hover {
		text-decoration: none;
		background: var(--MI_THEME-folderHeaderHoverBg);
	}

	&:focus-within {
		outline-offset: 2px;
	}

	&.active {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-folderHeaderHoverBg);
	}

	&.opened {
		border-radius: 6px 6px 0 0;
	}
}

.headerUpper {
	display: flex;
	align-items: center;
}

.headerLower {
	color: var(--MI_THEME-fgTransparentWeak);
	font-size: .85em;
	padding-left: 4px;
}

.headerIcon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	opacity: 0.8;

	&:empty {
		display: none;

		& + .headerText {
			padding-left: 4px;
		}
	}
}

.headerText {
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	padding-right: 12px;
}

.headerTextMain,
.headerTextSub {
	width: fit-content;
	max-width: 100%;
}

.headerTextSub {
	color: var(--MI_THEME-fgTransparentWeak);
	font-size: .85em;
}

.headerRight {
	margin-left: auto;
	color: var(--MI_THEME-fgTransparentWeak);
	white-space: nowrap;
}

.headerRightText:not(:empty) {
	margin-right: 0.75em;
}

.body {
	background: var(--MI_THEME-panel);
	border-radius: 0 0 6px 6px;
	container-type: inline-size;

	&.bgSame {
		background: var(--MI_THEME-bg);
	}
}

.footer {
	position: sticky !important;
	z-index: 1;
	bottom: var(--MI-stickyBottom, 0px);
	left: 0;
	padding: 12px;
	background: var(--MI_THEME-acrylicBg);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 5px, var(--MI_THEME-panel) 5px, var(--MI_THEME-panel) 10px);
	border-radius: 0 0 6px 6px;
}
</style>
