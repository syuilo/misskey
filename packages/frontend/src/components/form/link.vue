<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="to ? 'div' : 'button'"
	:class="[
		$style.root,
		{
			[$style.inline]: inline,
			'_button': !to,
		},
	]"
>
	<MkHeaderButton
		:tag="to ? (external ? 'a' : 'MkA') : 'div'"
		:active="active"
		:large="large"
		v-bind="to ? (external ? { href: to, target: '_blank' } : { to, behavior }) : {}"
	>
		<template v-if="$slots.icon" #icon><slot name="icon"></slot></template>
		<template #default><slot></slot></template>
		<template v-if="$slots.caption" #caption><slot name="caption"></slot></template>
		<template v-if="$slots.suffix" #suffix><slot name="suffix"></slot></template>
		<template #suffixIcon><i :class="to && external ? 'ti ti-external-link' : 'ti ti-chevron-right'"></i></template>
	</MkHeaderButton>
</component>
</template>

<script lang="ts" setup>
import MkHeaderButton from '@/components/MkHeaderButton.vue';

defineProps<{
	to?: string;
	active?: boolean;
	external?: boolean;
	behavior?: null | 'window' | 'browser';
	inline?: boolean;
	large?: boolean;
}>();
</script>

<style lang="scss" module>
.root {
	display: block;

	&.inline {
		display: inline-block;
	}
}
</style>
