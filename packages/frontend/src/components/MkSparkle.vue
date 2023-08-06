<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span :class="$style.root">
	<span ref="el" style="display: inline-block;">
		<slot></slot>
	</span>
	<!-- なぜか path に対する key が機能しないため
	<svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" xmlns="http://www.w3.org/2000/svg">
		<path v-for="particle in particles" :key="particle.id" style="transform-origin: center; transform-box: fill-box;"
			:transform="`translate(${particle.x} ${particle.y})`"
			:fill="particle.color"
			d="M29.427,2.011C29.721,0.83 30.782,0 32,0C33.218,0 34.279,0.83 34.573,2.011L39.455,21.646C39.629,22.347 39.991,22.987 40.502,23.498C41.013,24.009 41.653,24.371 42.354,24.545L61.989,29.427C63.17,29.721 64,30.782 64,32C64,33.218 63.17,34.279 61.989,34.573L42.354,39.455C41.653,39.629 41.013,39.991 40.502,40.502C39.991,41.013 39.629,41.653 39.455,42.354L34.573,61.989C34.279,63.17 33.218,64 32,64C30.782,64 29.721,63.17 29.427,61.989L24.545,42.354C24.371,41.653 24.009,41.013 23.498,40.502C22.987,39.991 22.347,39.629 21.646,39.455L2.011,34.573C0.83,34.279 0,33.218 0,32C0,30.782 0.83,29.721 2.011,29.427L21.646,24.545C22.347,24.371 22.987,24.009 23.498,23.498C24.009,22.987 24.371,22.347 24.545,21.646L29.427,2.011Z"
		>
			<animateTransform
				attributeName="transform"
				attributeType="XML"
				type="rotate"
				from="0 0 0"
				to="360 0 0"
				:dur="`${particle.dur}ms`"
				repeatCount="indefinite"
				additive="sum"
			/>
			<animateTransform
				attributeName="transform"
				attributeType="XML"
				type="scale"
				:values="`0; ${particle.size}; 0`"
				:dur="`${particle.dur}ms`"
				repeatCount="indefinite"
				additive="sum"
			/>
		</path>
	</svg>
	-->
	<!-- MFMで上位レイヤーに表示されるため、リンクをクリックできるようにstyleにpointer-events: none;を付与。 -->
	<svg v-for="particle in particles" :key="particle.id" :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: -32px; left: -32px; pointer-events: none;">
		<path
			style="transform-origin: center; transform-box: fill-box;"
			:transform="`translate(${particle.x} ${particle.y})`"
			:fill="particle.color"
			d="M29.427,2.011C29.721,0.83 30.782,0 32,0C33.218,0 34.279,0.83 34.573,2.011L39.455,21.646C39.629,22.347 39.991,22.987 40.502,23.498C41.013,24.009 41.653,24.371 42.354,24.545L61.989,29.427C63.17,29.721 64,30.782 64,32C64,33.218 63.17,34.279 61.989,34.573L42.354,39.455C41.653,39.629 41.013,39.991 40.502,40.502C39.991,41.013 39.629,41.653 39.455,42.354L34.573,61.989C34.279,63.17 33.218,64 32,64C30.782,64 29.721,63.17 29.427,61.989L24.545,42.354C24.371,41.653 24.009,41.013 23.498,40.502C22.987,39.991 22.347,39.629 21.646,39.455L2.011,34.573C0.83,34.279 0,33.218 0,32C0,30.782 0.83,29.721 2.011,29.427L21.646,24.545C22.347,24.371 22.987,24.009 23.498,23.498C24.009,22.987 24.371,22.347 24.545,21.646L29.427,2.011Z"
		>
			<animateTransform
				attributeName="transform"
				attributeType="XML"
				type="rotate"
				from="0 0 0"
				to="360 0 0"
				:dur="`${particle.dur}ms`"
				repeatCount="1"
				additive="sum"
			/>
			<animateTransform
				attributeName="transform"
				attributeType="XML"
				type="scale"
				:values="`0; ${particle.size}; 0`"
				:dur="`${particle.dur}ms`"
				repeatCount="1"
				additive="sum"
			/>
		</path>
	</svg>
</span>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';

const particles = ref([]);
const el = shallowRef<HTMLElement>();
const width = ref(0);
const height = ref(0);
const colors = ['#FF1493', '#00FFFF', '#FFE202', '#FFE202', '#FFE202'];
let stop = false;
let ro: ResizeObserver | undefined;

onMounted(() => {
	ro = new ResizeObserver((entries, observer) => {
		width.value = el.value?.offsetWidth + 64;
		height.value = el.value?.offsetHeight + 64;
	});
	ro.observe(el.value);
	const add = () => {
		if (stop) return;
		const x = (Math.random() * (width.value - 64));
		const y = (Math.random() * (height.value - 64));
		const sizeFactor = Math.random();
		const particle = {
			id: Math.random().toString(),
			x,
			y,
			size: 0.2 + ((sizeFactor / 10) * 3),
			dur: 1000 + (sizeFactor * 1000),
			color: colors[Math.floor(Math.random() * colors.length)],
		};
		particles.value.push(particle);
		window.setTimeout(() => {
			particles.value = particles.value.filter(x => x.id !== particle.id);
		}, particle.dur - 100);

		window.setTimeout(() => {
			add();
		}, 500 + (Math.random() * 500));
	};
	add();
});

onUnmounted(() => {
	if (ro) ro.disconnect();
	stop = true;
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
}
</style>
