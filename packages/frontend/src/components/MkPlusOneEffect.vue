<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" :style="{ zIndex, top: `${y - 64}px`, left: `${x - 64}px` }">
	<span class="text" :class="{ up }">+1</span>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted } from 'vue';
import * as os from '@/os';

const props = withDefaults(defineProps<{
	x: number;
	y: number;
}>(), {
});

const emit = defineEmits<{
	(ev: 'end'): void;
}>();

let up = $ref(false);
const zIndex = os.claimZIndex('middle');
const angle = (45 - (Math.random() * 90)) + 'deg';

onMounted(() => {
	window.setTimeout(() => {
		up = true;
	}, 10);

	window.setTimeout(() => {
		emit('end');
	}, 1100);
});
</script>

<style lang="scss" module>
.root {
	pointer-events: none;
	position: fixed;
	width: 128px;
	height: 128px;

	&:global {
		> .text {
			display: block;
			height: 1em;
			text-align: center;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			color: #fff;
			text-shadow: 0 0 6px #000;
			font-size: 18px;
			font-weight: bold;
			transform: translateY(0px);
			transition: transform 1s cubic-bezier(0,.5,0,1), opacity 1s cubic-bezier(.5,0,1,.5);
			will-change: opacity, transform;

			&.up {
				opacity: 0;
				transform: translateY(-50px) rotateZ(v-bind(angle));
			}
		}
	}
}
</style>
