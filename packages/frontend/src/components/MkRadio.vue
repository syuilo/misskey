<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-adaptive-border
	:class="[$style.root, { [$style.disabled]: disabled, [$style.checked]: checked }]"
	:aria-checked="checked"
	:aria-disabled="disabled"
	role="checkbox"
	@click="toggle"
>
	<input
		type="radio"
		:disabled="disabled"
		:class="$style.input"
	>
	<span :class="$style.button">
		<span></span>
	</span>
	<span :class="$style.label"><slot></slot></span>
</div>
</template>

<script lang="ts" setup generic="T extends unknown">
import { computed } from 'vue';

const props = defineProps<{
	modelValue: T;
	value: T;
	disabled?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: T): void;
}>();

const checked = computed(() => props.modelValue === props.value);

function toggle(): void {
	if (props.disabled) return;
	emit('update:modelValue', props.value);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: inline-block;
	text-align: left;
	cursor: pointer;
	padding: 7px 10px;
	min-width: 60px;
	background-color: var(--MI_THEME-panel);
	background-clip: padding-box !important;
	border: solid 1px var(--MI_THEME-panel);
	border-radius: 6px;
	font-size: 90%;
	transition: all 0.2s;
	user-select: none;

	&.disabled {
		opacity: 0.6;
		cursor: not-allowed !important;
	}

	&:hover {
		border-color: var(--MI_THEME-inputBorderHover) !important;
	}

	&:focus-within {
		outline: none;
		box-shadow: 0 0 0 2px var(--MI_THEME-focus);
	}

	&.checked {
		background-color: var(--MI_THEME-accentedBg) !important;
		border-color: var(--MI_THEME-accentedBg) !important;
		color: var(--MI_THEME-accent);
		cursor: default !important;

		> .button {
			border-color: var(--MI_THEME-accent);

			&::after {
				background-color: var(--MI_THEME-accent);
				transform: scale(1);
				opacity: 1;
			}
		}
	}
}

.input {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
	margin: 0;
}

.button {
	position: absolute;
	width: 14px;
	height: 14px;
	background: none;
	border: solid 2px var(--MI_THEME-inputBorder);
	border-radius: 100%;
	transition: inherit;

	&::after {
		content: '';
		display: block;
		position: absolute;
		top: 3px;
		right: 3px;
		bottom: 3px;
		left: 3px;
		border-radius: 100%;
		opacity: 0;
		transform: scale(0);
		transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
	}
}

.label {
	margin-left: 28px;
	display: block;
	line-height: 20px;
	cursor: pointer;
}
</style>
