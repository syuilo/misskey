<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	appear
	:enterActiveClass="defaultStore.state.animation ? $style.transition_fade_enterActive : ''"
	:leaveActiveClass="defaultStore.state.animation ? $style.transition_fade_leaveActive : ''"
	:enterFromClass="defaultStore.state.animation ? $style.transition_fade_enterFrom : ''"
	:leaveToClass="defaultStore.state.animation ? $style.transition_fade_leaveTo : ''"
>
	<div ref="rootEl" :class="$style.root" :style="{ zIndex }" @contextmenu.prevent.stop="() => {}">
		<MkMenu :items="items" :align="'left'" @close="$emit('closed')"/>
	</div>
</Transition>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, onBeforeUnmount } from 'vue';
import MkMenu from './MkMenu.vue';
import { MenuItem } from './types/menu.vue';
import contains from '@/scripts/contains';
import { defaultStore } from '@/store';
import * as os from '@/os';

const props = defineProps<{
	items: MenuItem[];
	ev: MouseEvent;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

let rootEl = $shallowRef<HTMLDivElement>();

let zIndex = $ref<number>(os.claimZIndex('high'));

const SCROLLBAR_THICKNESS = 16;

onMounted(() => {
	let left = props.ev.pageX + 1; // 間違って右ダブルクリックした場合に意図せずアイテムがクリックされるのを防ぐため + 1
	let top = props.ev.pageY + 1; // 間違って右ダブルクリックした場合に意図せずアイテムがクリックされるのを防ぐため + 1

	const width = rootEl.offsetWidth;
	const height = rootEl.offsetHeight;

	if (left + width - window.pageXOffset >= (window.innerWidth - SCROLLBAR_THICKNESS)) {
		left = (window.innerWidth - SCROLLBAR_THICKNESS) - width + window.pageXOffset;
	}

	if (top + height - window.pageYOffset >= (window.innerHeight - SCROLLBAR_THICKNESS)) {
		top = (window.innerHeight - SCROLLBAR_THICKNESS) - height + window.pageYOffset;
	}

	if (top < 0) {
		top = 0;
	}

	if (left < 0) {
		left = 0;
	}

	rootEl.style.top = `${top}px`;
	rootEl.style.left = `${left}px`;

	document.body.addEventListener('mousedown', onMousedown);
});

onBeforeUnmount(() => {
	document.body.removeEventListener('mousedown', onMousedown);
});

function onMousedown(evt: Event) {
	if (!contains(rootEl, evt.target) && (rootEl !== evt.target)) emit('closed');
}
</script>

<style lang="scss" module>
.transition_fade_enterActive,
.transition_fade_leaveActive {
	transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
	transform-origin: left top;
}
.transition_fade_enterFrom,
.transition_fade_leaveTo {
	opacity: 0;
	transform: scale(0.9);
}

.root {
	position: absolute;
}
</style>
