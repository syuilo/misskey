<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-memo class="mkw-memo">
	<template #icon><i class="ti ti-note"></i></template>
	<template #header>{{ i18n.ts._widgets.memo }}</template>

	<div :class="$style.root">
		<textarea v-model="text" :style="`height: ${widgetProps.height}px;`" :class="$style.textarea" :placeholder="i18n.ts.placeholder" @input="onChange"></textarea>
		<button :class="$style.save" :disabled="!changed" class="_buttonPrimary" @click="saveMemo">{{ i18n.ts.save }}</button>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';

const name = 'memo';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 100,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const text = ref<string | null>(defaultStore.state.memo);
const changed = ref(false);
let timeoutId;

const saveMemo = () => {
	defaultStore.set('memo', text.value);
	changed.value = false;
};

const onChange = () => {
	changed.value = true;
	window.clearTimeout(timeoutId);
	timeoutId = window.setTimeout(saveMemo, 1000);
};

watch(() => defaultStore.reactiveState.memo, newText => {
	text.value = newText.value;
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding-bottom: 28px + 16px;
}

.textarea {
	display: block;
	width: 100%;
	max-width: 100%;
	min-width: 100%;
	padding: 16px;
	color: var(--MI_THEME-fg);
	background: transparent;
	border: none;
	border-bottom: solid 0.5px var(--MI_THEME-divider);
	border-radius: 0;
	box-sizing: border-box;
	font: inherit;
	font-size: 0.9em;

	&:focus-visible {
		outline: none;
	}
}

.save {
	display: block;
	position: absolute;
	bottom: 8px;
	right: 8px;
	margin: 0;
	padding: 0 10px;
	height: 28px;
	outline: none;
	border-radius: 4px;

	&:disabled {
		opacity: 0.7;
		cursor: default;
	}
}
</style>
