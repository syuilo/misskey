<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkButton primary :disabled="min === current" @click="onToPrevButtonClicked">&lt;</MkButton>

	<div :class="$style.buttons">
		<div v-if="prevDotVisible" :class="$style.headTailButtons">
			<MkButton @click="onToHeadButtonClicked">{{ min }}</MkButton>
			<span class="ti ti-dots"/>
		</div>

		<MkButton
			v-for="i in buttonRanges" :key="i"
			:disabled="current === i"
			@click="onNumberButtonClicked(i)"
		>
			{{ i }}
		</MkButton>

		<div v-if="nextDotVisible" :class="$style.headTailButtons">
			<span class="ti ti-dots"/>
			<MkButton @click="onToTailButtonClicked">{{ max }}</MkButton>
		</div>
	</div>

	<MkButton primary :disabled="max === current" @click="onToNextButtonClicked">&gt;</MkButton>
</div>
</template>

<script setup lang="ts">

import { computed, toRefs } from 'vue';
import MkButton from '@/components/MkButton.vue';

const min = 1;

const emit = defineEmits<{
	(ev: 'pageChanged', pageNumber: number): void;
}>();

const props = defineProps<{
	current: number;
	max: number;
	buttonCount: number;
}>();

const { current, max } = toRefs(props);

const buttonCount = computed(() => Math.min(max.value, props.buttonCount));
const buttonCountHalf = computed(() => Math.floor(buttonCount.value / 2));
const buttonCountStart = computed(() => Math.min(Math.max(min, current.value - buttonCountHalf.value), max.value - buttonCount.value + 1));
const buttonRanges = computed(() => Array.from({ length: buttonCount.value }, (_, i) => buttonCountStart.value + i));

const prevDotVisible = computed(() => (current.value - 1 > buttonCountHalf.value) && (max.value > buttonCount.value));
const nextDotVisible = computed(() => (current.value < max.value - buttonCountHalf.value) && (max.value > buttonCount.value));

if (_DEV_) {
	console.log('[MkPagingButtons]', current.value, max.value, buttonCount.value, buttonCountHalf.value);
	console.log('[MkPagingButtons]', current.value < max.value - buttonCountHalf.value);
	console.log('[MkPagingButtons]', max.value > buttonCount.value);
}

function onNumberButtonClicked(pageNumber: number) {
	emit('pageChanged', pageNumber);
}

function onToHeadButtonClicked() {
	emit('pageChanged', min);
}

function onToPrevButtonClicked() {
	const newPageNumber = current.value <= min ? min : current.value - 1;
	emit('pageChanged', newPageNumber);
}

function onToNextButtonClicked() {
	const newPageNumber = current.value >= max.value ? max.value : current.value + 1;
	emit('pageChanged', newPageNumber);
}

function onToTailButtonClicked() {
	emit('pageChanged', max.value);
}
</script>

<style module lang="scss">
.root {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 24px;

	button {
		border-radius: 9999px;
		min-width: 2.5em;
		min-height: 2.5em;
		max-width: 2.5em;
		max-height: 2.5em;
		padding: 4px;
	}
}

.buttons {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
}

.headTailButtons {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;

	span {
		font-size: 0.75em;
	}
}
</style>
