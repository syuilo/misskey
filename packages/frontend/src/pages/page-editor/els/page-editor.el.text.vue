<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer
	:draggable="true"
	:blockId="modelValue.id"
	@remove="() => emit('remove')"
	@move="(direction) => emit('move', direction)"
>
	<template #header><i class="ti ti-align-left"></i></template>
	<template #actions>
		<button class="_button" :class="$style.previewToggleRoot" @click="toggleEnablePreview">
			<MkSwitchButton :class="$style.previewToggleSwitch" :checked="enablePreview" @toggle="toggleEnablePreview"></MkSwitchButton>{{ i18n.ts.preview }}
		</button>
	</template>
	<template #default="{ focus }">
		<section>
			<div v-if="enablePreview" ref="previewEl" :class="$style.previewRoot"><Mfm :text="text"></Mfm></div>
			<textarea v-else ref="inputEl" v-model="text" :class="$style.textarea" @input.passive="calcTextAreaHeight"></textarea>
		</section>
	</template>
</XContainer>
</template>

<script lang="ts" setup>
import { watch, ref, computed, useTemplateRef, onMounted, onUnmounted, nextTick } from 'vue';
import * as Misskey from 'misskey-js';
import MkSwitchButton from '@/components/MkSwitch.button.vue';
import XContainer from '../page-editor.container.vue';
import { i18n } from '@/i18n.js';
import { Autocomplete } from '@/scripts/autocomplete.js';

const props = defineProps<{
	modelValue: Misskey.entities.PageBlock & { type: 'text' }
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'text' }): void;
	(ev: 'remove'): void;
	(ev: 'move', direction: 'up' | 'down'): void;
}>();

let autocomplete: Autocomplete;

const inputEl = useTemplateRef('inputEl');
const inputHeight = ref(150);
const previewEl = useTemplateRef('previewEl');
const previewHeight = ref(150);
const editorHeight = computed(() => Math.max(inputHeight.value, previewHeight.value));

function calcTextAreaHeight() {
	if (!inputEl.value) return;
	inputEl.value.setAttribute('style', 'min-height: auto');
	inputHeight.value = Math.max(150, inputEl.value.scrollHeight ?? 0);
	inputEl.value.removeAttribute('style');
}

const enablePreview = ref(false);
function toggleEnablePreview() {
	enablePreview.value = !enablePreview.value;

	if (enablePreview.value === true) {
		nextTick(() => {
			previewHeight.value = Math.max(150, previewEl.value?.scrollHeight ?? 0);
		});
	}
}

const text = ref(props.modelValue.text ?? '');

watch(text, () => {
	emit('update:modelValue', {
		...props.modelValue,
		text: text.value,
	});
});

onMounted(() => {
	if (!inputEl.value) return;
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
	min-height: v-bind("editorHeight + 'px'");
	border: none;
	box-shadow: none;
	padding: 16px;
	background: transparent;
	color: var(--MI_THEME-fg);
	font-size: 14px;
	box-sizing: border-box;
}

.previewRoot {
	padding: 16px;
	min-height: v-bind("editorHeight + 'px'");
	box-sizing: border-box;
}

.previewToggleRoot {
	display: flex;
	gap: 4px;
}

.previewToggleSwitch {
	--height: 1.35em;
}
</style>
