<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.label"><slot name="label"></slot></div>
	<div :class="[$style.input, { disabled }]">
		<input
			ref="inputEl"
			v-model="v"
			v-adaptive-border
			:class="$style.inputCore"
			type="color"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			@input="onInput"
		>
	</div>
	<div :class="$style.caption"><slot name="caption"></slot></div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, nextTick, ref, shallowRef, watch, computed, toRefs } from 'vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	modelValue: string | null;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: string): void;
}>();

const { modelValue } = toRefs(props);
const v = ref(modelValue.value);
const inputEl = shallowRef<HTMLElement>();

const onInput = (ev: KeyboardEvent) => {
	emit('update:modelValue', v.value);
};
</script>

<style lang="scss" module>
.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;

	&:empty {
		display: none;
	}
}

.caption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: var(--fgTransparentWeak);

	&:empty {
		display: none;
	}
}

.input {
	position: relative;

	&.focused {
		> .inputCore {
			border-color: var(--accent) !important;
			//box-shadow: 0 0 0 4px var(--focus);
		}
	}

	&.disabled {
		opacity: 0.7;

		&,
		> .inputCore {
			cursor: not-allowed !important;
		}
	}
}

.inputCore {
	appearance: none;
	-webkit-appearance: none;
	display: block;
	height: 42px;
	width: 100%;
	margin: 0;
	padding: 0 12px;
	font: inherit;
	font-weight: normal;
	font-size: 1em;
	color: var(--fg);
	background: var(--panel);
	border: solid 1px var(--panel);
	border-radius: 6px;
	outline: none;
	box-shadow: none;
	box-sizing: border-box;
	transition: border-color 0.1s ease-out;

	&:hover {
		border-color: var(--inputBorderHover) !important;
	}
}
</style>
