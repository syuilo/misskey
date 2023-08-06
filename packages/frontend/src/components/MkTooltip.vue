<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="defaultStore.state.animation ? $style.transition_tooltip_enterActive : ''"
	:leaveActiveClass="defaultStore.state.animation ? $style.transition_tooltip_leaveActive : ''"
	:enterFromClass="defaultStore.state.animation ? $style.transition_tooltip_enterFrom : ''"
	:leaveToClass="defaultStore.state.animation ? $style.transition_tooltip_leaveTo : ''"
	appear @afterLeave="emit('closed')"
>
	<div v-show="showing" ref="el" :class="$style.root" class="_acrylic _shadow" :style="{ zIndex, maxWidth: maxWidth + 'px' }">
		<slot>
			<Mfm v-if="asMfm" :text="text"/>
			<span v-else>{{ text }}</span>
		</slot>
	</div>
</Transition>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { nextTick, onMounted, onUnmounted, shallowRef } from 'vue';
import * as os from '@/os';
import { calcPopupPosition } from '@/scripts/popup-position';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	showing: boolean;
	targetElement?: HTMLElement;
	x?: number;
	y?: number;
	text?: string;
	asMfm?: boolean;
	maxWidth?: number;
	direction?: 'top' | 'bottom' | 'right' | 'left';
	innerMargin?: number;
}>(), {
	maxWidth: 250,
	direction: 'top',
	innerMargin: 0,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

// タイミングによっては最初から showing = false な場合があり、その場合に closed 扱いにしないと永久にDOMに残ることになる
if (!props.showing) emit('closed');

const el = shallowRef<HTMLElement>();
const zIndex = os.claimZIndex('high');

function setPosition() {
	const data = calcPopupPosition(el.value, {
		anchorElement: props.targetElement,
		direction: props.direction,
		align: 'center',
		innerMargin: props.innerMargin,
		x: props.x,
		y: props.y,
	});

	el.value.style.transformOrigin = data.transformOrigin;
	el.value.style.left = data.left + 'px';
	el.value.style.top = data.top + 'px';
}

let loopHandler;

onMounted(() => {
	nextTick(() => {
		setPosition();

		const loop = () => {
			setPosition();
			loopHandler = window.requestAnimationFrame(loop);
		};

		loop();
	});
});

onUnmounted(() => {
	window.cancelAnimationFrame(loopHandler);
});
</script>

<style lang="scss" module>
.transition_tooltip_enterActive,
.transition_tooltip_leaveActive {
	opacity: 1;
	transform: scale(1);
	transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_tooltip_enterFrom,
.transition_tooltip_leaveTo {
	opacity: 0;
	transform: scale(0.75);
}

.root {
	position: absolute;
	font-size: 0.8em;
	padding: 8px 12px;
	box-sizing: border-box;
	text-align: center;
	border-radius: 4px;
	border: solid 0.5px var(--divider);
	pointer-events: none;
	transform-origin: center center;
}
</style>
