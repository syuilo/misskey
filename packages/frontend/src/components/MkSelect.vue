<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.label" @click="focus"><slot name="label"></slot></div>
	<div ref="container" :class="[$style.input, { [$style.inline]: inline, [$style.disabled]: disabled, [$style.focused]: focused }]" @mousedown.prevent="show">
		<div ref="prefixEl" :class="$style.prefix"><slot name="prefix"></slot></div>
		<select
			ref="inputEl"
			v-model="v"
			v-adaptive-border
			:class="$style.inputCore"
			:disabled="disabled"
			:required="required"
			:readonly="readonly"
			:placeholder="placeholder"
			@focus="focused = true"
			@blur="focused = false"
			@input="onInput"
		>
			<slot></slot>
		</select>
		<div ref="suffixEl" :class="$style.suffix"><i class="ti ti-chevron-down" :class="[$style.chevron, { [$style.chevronOpening]: opening }]"></i></div>
	</div>
	<div :class="$style.caption"><slot name="caption"></slot></div>

	<MkButton v-if="manualSave && changed" primary @click="updated"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, nextTick, ref, watch, computed, toRefs, VNode, useSlots } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { i18n } from '@/i18n';

const props = defineProps<{
	modelValue: string | null;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	placeholder?: string;
	autofocus?: boolean;
	inline?: boolean;
	manualSave?: boolean;
	small?: boolean;
	large?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'change', _ev: KeyboardEvent): void;
	(ev: 'update:modelValue', value: string | null): void;
}>();

const slots = useSlots();

const { modelValue, autofocus } = toRefs(props);
const v = ref(modelValue.value);
const focused = ref(false);
const opening = ref(false);
const changed = ref(false);
const invalid = ref(false);
const filled = computed(() => v.value !== '' && v.value != null);
const inputEl = ref(null);
const prefixEl = ref(null);
const suffixEl = ref(null);
const container = ref(null);
const height =
	props.small ? 33 :
	props.large ? 39 :
	36;

const focus = () => inputEl.value.focus();
const onInput = (ev) => {
	changed.value = true;
	emit('change', ev);
};

const updated = () => {
	changed.value = false;
	emit('update:modelValue', v.value);
};

watch(modelValue, newValue => {
	v.value = newValue;
});

watch(v, newValue => {
	if (!props.manualSave) {
		updated();
	}

	invalid.value = inputEl.value.validity.badInput;
});

// このコンポーネントが作成された時、非表示状態である場合がある
// 非表示状態だと要素の幅などは0になってしまうので、定期的に計算する
useInterval(() => {
	if (prefixEl.value) {
		if (prefixEl.value.offsetWidth) {
			inputEl.value.style.paddingLeft = prefixEl.value.offsetWidth + 'px';
		}
	}
	if (suffixEl.value) {
		if (suffixEl.value.offsetWidth) {
			inputEl.value.style.paddingRight = suffixEl.value.offsetWidth + 'px';
		}
	}
}, 100, {
	immediate: true,
	afterMounted: true,
});

onMounted(() => {
	nextTick(() => {
		if (autofocus.value) {
			focus();
		}
	});
});

function show(ev: MouseEvent) {
	focused.value = true;
	opening.value = true;

	const menu = [];
	let options = slots.default!();

	const pushOption = (option: VNode) => {
		menu.push({
			text: option.children,
			active: computed(() => v.value === option.props.value),
			action: () => {
				v.value = option.props.value;
			},
		});
	};

	const scanOptions = (options: VNode[]) => {
		for (const vnode of options) {
			if (vnode.type === 'optgroup') {
				const optgroup = vnode;
				menu.push({
					type: 'label',
					text: optgroup.props.label,
				});
				scanOptions(optgroup.children);
			} else if (Array.isArray(vnode.children)) { // 何故かフラグメントになってくることがある
				const fragment = vnode;
				scanOptions(fragment.children);
			} else if (vnode.props == null) { // v-if で条件が false のときにこうなる
				// nop?
			} else {
				const option = vnode;
				pushOption(option);
			}
		}
	};

	scanOptions(options);

	os.popupMenu(menu, container.value, {
		width: container.value.offsetWidth,
		onClosing: () => {
			opening.value = false;
		},
	}).then(() => {
		focused.value = false;
	});
}
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
	cursor: pointer;

	&.inline {
		display: inline-block;
		margin: 0;
	}

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

	&:hover {
		> .inputCore {
			border-color: var(--inputBorderHover) !important;
		}
	}
}

.inputCore {
	appearance: none;
	-webkit-appearance: none;
	display: block;
	height: v-bind("height + 'px'");
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
	cursor: pointer;
	pointer-events: none;
	user-select: none;
}

.prefix,
.suffix {
	display: flex;
	align-items: center;
	position: absolute;
	z-index: 1;
	top: 0;
	padding: 0 12px;
	font-size: 1em;
	height: v-bind("height + 'px'");
	min-width: 16px;
	max-width: 150px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	box-sizing: border-box;
	pointer-events: none;

	&:empty {
		display: none;
	}
}

.prefix {
	left: 0;
	padding-right: 6px;
}

.suffix {
	right: 0;
	padding-left: 6px;
}

.chevron {
	transition: transform 0.1s ease-out;
}

.chevronOpening {
	transform: rotateX(180deg);
}
</style>
