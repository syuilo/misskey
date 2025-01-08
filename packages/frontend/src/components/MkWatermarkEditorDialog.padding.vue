<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div :class="$style.root">
		<svg version="1.1" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" :class="$style.graphic">
			<defs>
				<marker id="Arrow3" overflow="visible" markerHeight="6" markerWidth="4.2069998" orient="auto-start-reverse" preserveAspectRatio="none" viewBox="0 0 4.2071068 7">
					<path transform="rotate(180 .125 0)" d="m3-3-3 3 3 3" fill="none" stroke="context-stroke" stroke-linecap="round" />
				</marker>
				<pattern id="pattern5942" patternTransform="matrix(1.452 1.452 -3.1368 3.8697 -1.7474 -2.9488)" xlink:href="#Strips1_1white" />
				<pattern id="Strips1_1white" width="2" height="1" patternTransform="translate(0) scale(10)" patternUnits="userSpaceOnUse">
					<rect y="-.5" width="1" height="2" fill="var(--MI_THEME-panel)" />
				</pattern>
				<marker id="Arrow3-6" overflow="visible" markerHeight="6" markerWidth="4.2069998" orient="auto-start-reverse" preserveAspectRatio="none" viewBox="0 0 4.2071068 7">
					<path transform="rotate(180 .125 0)" d="m3-3-3 3 3 3" fill="none" stroke="context-stroke" stroke-linecap="round" />
				</marker>
				<marker id="Arrow3-6-9" overflow="visible" markerHeight="6" markerWidth="4.2069998" orient="auto-start-reverse" preserveAspectRatio="none" viewBox="0 0 4.2071068 7">
					<path transform="rotate(180 .125 0)" d="m3-3-3 3 3 3" fill="none" stroke="context-stroke" stroke-linecap="round" />
				</marker>
				<marker id="Arrow3-6-9-1" overflow="visible" markerHeight="6" markerWidth="4.2069998" orient="auto-start-reverse" preserveAspectRatio="none" viewBox="0 0 4.2071068 7">
					<path transform="rotate(180 .125 0)" d="m3-3-3 3 3 3" fill="none" stroke="context-stroke" stroke-linecap="round" />
				</marker>
			</defs>
			<g transform="translate(-21.709 -14.787)" stroke-linecap="round" stroke-linejoin="round">
				<g fill-rule="evenodd">
					<rect x="21.709" y="14.787" width="120" height="80" fill="var(--MI_THEME-bg)" stop-color="#000000" stroke-dasharray="1.1384, 3.4152" stroke-width="1.1384" style="mix-blend-mode:normal" />
					<rect x="21.709" y="14.787" width="120" height="80" fill="url(#pattern5942)" stop-color="#000000" stroke-dasharray="1.1384, 3.4152" stroke-width="1.1384" style="mix-blend-mode:normal" />
					<rect x="47.101" y="40.105" width="69.216" height="29.364" ry="5.3019" fill="var(--MI_THEME-accentDarken)" stop-color="#000000" stroke-dasharray="1.13855, 3.41565" stroke-width="1.1386" />
				</g>
				<g fill="none" stroke="var(--MI_THEME-error)">
					<path v-if="props.arrow === 'top'" d="m81.709 16.167 2e-6 22.601" marker-end="url(#Arrow3)" marker-start="url(#Arrow3)" stop-color="#000000" stroke-width="1.3038" />
					<path v-else-if="props.arrow === 'left'" d="m23.011 54.787 22.751-4e-6" marker-end="url(#Arrow3-6)" marker-start="url(#Arrow3-6)" stop-color="#000000" stroke-width="1.322" />
					<path v-else-if="props.arrow === 'bottom'" d="m81.709 70.772-1e-6 22.647" marker-end="url(#Arrow3-6-9)" marker-start="url(#Arrow3-6-9)" stop-color="#000000" stroke-width="1.2715" />
					<path v-else-if="props.arrow === 'right'" d="m117.58 54.787 22.828 5e-6" marker-end="url(#Arrow3-6-9-1)" marker-start="url(#Arrow3-6-9-1)" stop-color="#000000" stroke-width="1.285" />
				</g>
			</g>
		</svg>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	arrow: 'top' | 'bottom' | 'left' | 'right' | null;
}>();
</script>

<style module>
.root {
	border-radius: var(--MI-radius);
	overflow: clip;
	box-sizing: border-box;
	border: thin solid var(--MI_THEME-divider);
	max-width: 242px; /* 240px + 左右ボーダー2px */
	width: 100%;
	height: auto;
}

.graphic {
	display: block;
	width: 100%;
	height: auto;
}
</style>
