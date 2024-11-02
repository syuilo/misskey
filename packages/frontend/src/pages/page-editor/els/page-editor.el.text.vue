<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => emit('remove')">
	<template #header><i class="ti ti-align-left"></i> {{ i18n.ts._pages.blocks.text }}</template>

	<section>
		<textarea ref="inputEl" v-model="text" :class="$style.textarea"></textarea>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
 
import { watch, ref, shallowRef, onMounted, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '../page-editor.container.vue';
import { i18n } from '@/i18n.js';
import { Autocomplete } from '@/scripts/autocomplete.js';

const props = defineProps<{
	modelValue: Misskey.entities.PageBlock & { type: 'text' }
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'text' }): void;
}>();

let autocomplete: Autocomplete;

const text = ref(props.modelValue.text ?? '');
const inputEl = shallowRef<HTMLTextAreaElement | null>(null);

watch(text, () => {
	emit('update:modelValue', {
		...props.modelValue,
		text: text.value,
	});
});

onMounted(() => {
	autocomplete = new Autocomplete(inputEl.value, text);
});

onUnmounted(() => {
	autocomplete.detach();
});
</script>

<style lang="scss" module>
.textarea {
	display: block;
	-webkit-appearance: none;
	-moz-appearance: none;
	appearance: none;
	width: 100%;
	min-width: 100%;
	min-height: 150px;
	border: none;
	box-shadow: none;
	padding: 16px;
	background: transparent;
	color: var(--MI_THEME-fg);
	font-size: 14px;
	box-sizing: border-box;
}
</style>
