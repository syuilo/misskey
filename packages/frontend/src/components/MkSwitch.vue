<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.disabled]: disabled }]">
	<input
		ref="input"
		type="checkbox"
		:disabled="disabled"
		:class="$style.input"
		@click="toggle"
	>
	<XButton :class="$style.toggle" :checked="checked" :disabled="disabled" @toggle="toggle"/>
	<span v-if="!noBody" :class="$style.body">
		<!-- TODO: 無名slotの方は廃止 -->
		<span :class="$style.label">
			<span @click="toggle">
				<slot name="label"></slot><slot></slot>
			</span>
			<span v-if="helpText" v-tooltip:dialog="helpText" class="_button _help" :class="$style.help"><i class="ti ti-help-circle"></i></span>
		</span>
		<p :class="$style.caption"><slot name="caption"></slot></p>
	</span>
</div>
</template>

<script lang="ts" setup>
import { toRefs } from 'vue';
import type { Ref } from 'vue';
import XButton from '@/components/MkSwitch.button.vue';

const props = defineProps<{
	modelValue: boolean | Ref<boolean>;
	disabled?: boolean;
	helpText?: string;
	noBody?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: boolean): void;
	(ev: 'change', v: boolean): void;
}>();

const checked = toRefs(props).modelValue;
const toggle = () => {
	if (props.disabled) return;
	emit('update:modelValue', !checked.value);
	emit('change', !checked.value);
};
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;
	transition: all 0.2s ease;
	user-select: none;

	&:hover {
		> .button {
			border-color: var(--MI_THEME-inputBorderHover) !important;
		}
	}

	&.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
}

.input {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
	margin: 0;

	&:focus-visible ~ .toggle {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

.body {
	margin-left: 12px;
	margin-top: 2px;
	display: block;
	transition: inherit;
	color: var(--MI_THEME-fg);
}

.label {
	display: block;
	line-height: 20px;
	cursor: pointer;
	transition: inherit;
}

.caption {
	margin: 8px 0 0 0;
	color: var(--MI_THEME-fgTransparentWeak);
	font-size: 0.85em;

	&:empty {
		display: none;
	}
}

.help {
	margin-left: 0.5em;
	font-size: 85%;
	vertical-align: top;
}
</style>
