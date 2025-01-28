<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<script lang="ts">
import { defineComponent, h, ref, watch } from 'vue';
import type { VNode } from 'vue';
import MkRadio from './MkRadio.vue';

export default defineComponent({
	props: {
		modelValue: {
			required: false,
		},
	},
	setup(props, context) {
		const value = ref(props.modelValue);
		watch(value, () => {
			context.emit('update:modelValue', value.value);
		});
		watch(() => props.modelValue, v => {
			value.value = v;
		});
		if (!context.slots.default) return null;
		let options = context.slots.default();
		const label = context.slots.label && context.slots.label();
		const caption = context.slots.caption && context.slots.caption();

		// なぜかFragmentになることがあるため
		if (options.length === 1 && options[0].props == null) options = options[0].children as VNode[];

		// vnodeのうちv-if=falseなものを除外する(trueになるものはoptionなど他typeになる)
		options = options.filter(vnode => !(typeof vnode.type === 'symbol' && vnode.type.description === 'v-cmt' && vnode.children === 'v-if'));

		return () => h('div', {
			class: 'novjtcto',
		}, [
			...(label ? [h('div', {
				class: 'label',
			}, label)] : []),
			h('div', {
				class: 'body',
			}, options.map(option => h(MkRadio, {
				key: option.key as string,
				value: option.props?.value,
				disabled: option.props?.disabled,
				modelValue: value.value,
				'onUpdate:modelValue': _v => value.value = _v,
			}, () => option.children)),
			),
			...(caption ? [h('div', {
				class: 'caption',
			}, caption)] : []),
		]);
	},
});
</script>

<style lang="scss">
.novjtcto {
	> .label {
		font-size: 0.85em;
		padding: 0 0 8px 0;
		user-select: none;

		&:empty {
			display: none;
		}
	}

	> .body {
		display: flex;
    gap: 12px;
    flex-wrap: wrap;
	}

	> .caption {
		font-size: 0.85em;
		padding: 8px 0 0 0;
		color: var(--MI_THEME-fgTransparentWeak);

		&:empty {
			display: none;
		}
	}
}
</style>
