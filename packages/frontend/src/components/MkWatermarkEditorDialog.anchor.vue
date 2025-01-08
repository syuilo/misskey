<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div :class="$style.anchorGridRoot">
	<div v-for="anchor in watermarkAnchor" :class="$style.anchorGridItem">
		<input :id="`${id}-${anchor}`" v-model="value" type="radio" :name="id" :value="anchor" :class="$style.anchorGridItemRadio"/>
		<label :for="`${id}-${anchor}`" :class="$style.anchorGridItemLabel">
			<div :class="$style.anchorGridItemInner">{{ langMap[anchor] }}</div>
		</label>
	</div>
</div>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { i18n } from '@/i18n.js';
import { watermarkAnchor } from '@/scripts/watermark.js';
import type { WatermarkAnchor } from '@/scripts/watermark.js';

const langMap = {
	'top': i18n.ts.centerTop,
	'top-left': i18n.ts.leftTop,
	'top-right': i18n.ts.rightTop,
	'left': i18n.ts.leftCenter,
	'right': i18n.ts.rightCenter,
	'bottom': i18n.ts.centerBottom,
	'bottom-left': i18n.ts.leftBottom,
	'bottom-right': i18n.ts.rightBottom,
	'center': i18n.ts.center,
} satisfies Record<WatermarkAnchor, string>;

const value = defineModel<WatermarkAnchor | undefined | null>({ required: true });

const id = useId();
</script>

<style module>
.anchorGridRoot {
	position: relative;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(3, 1fr);
	border-radius: var(--MI-radius);
	overflow: clip;
	box-sizing: border-box;
	border: thin solid var(--MI_THEME-divider);
	background-color: var(--MI_THEME-divider);
	gap: 1px;
	max-width: 242px; /* 240px + 左右ボーダー2px */
	width: 100%;
	aspect-ratio: 3/2;
	height: auto;
}

.anchorGridItemRadio {
	position: absolute;
	clip: rect(0, 0, 0, 0);
	pointer-events: none;
}

.anchorGridItem {
	background-color: var(--MI_THEME-panel);
}

.anchorGridItemLabel {
	cursor: pointer;
}

.anchorGridItemInner {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 4px;
	font-size: 0.8em;
}

.anchorGridItemInner:hover {
	background-color: var(--MI_THEME-buttonHoverBg);
}

.anchorGridItemRadio:checked + .anchorGridItemLabel .anchorGridItemInner {
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.anchorGridItemRadio:focus-visible + .anchorGridItemLabel .anchorGridItemInner {
	outline: 2px solid var(--MI_THEME-accent);
}
</style>
