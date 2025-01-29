<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" @click="(ev) => emit('click', ev)">
	<span v-if="iconClass" :class="[$style.icon, iconClass]"></span>
	<span :class="$style.content">{{ content }}</span>
	<MkButton v-if="exButtonIconClass" :class="$style.exButton" @click="(ev) => emit('exButtonClick', ev)">
		<span :class="[$style.exButtonIcon, exButtonIconClass]"></span>
	</MkButton>
</div>
</template>

<script setup lang="ts">
import MkButton from '@/components/MkButton.vue';

const emit = defineEmits<{
	(ev: 'click', payload: MouseEvent): void;
	(ev: 'exButtonClick', payload: MouseEvent): void;
}>();

defineProps<{
	iconClass?: string;
	content: string;
	exButtonIconClass?: string
}>();
</script>

<style module lang="scss">
$buttonSize : 1.8em;

.root {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 9999px;
	padding: 4px 6px;
	gap: 3px;

	background-color: var(--MI_THEME-buttonBg);

	&:hover {
		background-color: var(--MI_THEME-buttonHoverBg);
	}
}

.icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 0.70em;
}

.exButton {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 9999px;
	max-height: $buttonSize;
	max-width: $buttonSize;
	min-height: $buttonSize;
	min-width: $buttonSize;
	padding: 0;
	box-sizing: border-box;
	font-size: 0.65em;
}

.exButtonIcon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 0.80em;
}
</style>
