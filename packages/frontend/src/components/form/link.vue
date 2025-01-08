<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.inline]: inline }]">
	<component
		:is="external ? 'a' : to ? MkA : 'button'"
		:class="[$style.main, { [$style.active]: active }]"
		class="_button"
		v-bind="external ? { href: to, target: '_blank', rel: 'noopener' } : to ? { to, behavior } : {}"
	>
		<span :class="$style.icon"><slot name="icon"></slot></span>
		<span :class="$style.text"><slot></slot></span>
		<span :class="$style.suffix">
			<span :class="$style.suffixText"><slot name="suffix"></slot></span>
			<i v-if="external" class="ti ti-external-link"></i>
			<i v-else class="ti ti-chevron-right"></i>
		</span>
	</component>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkA, { type MkABehavior } from '@/components/global/MkA.vue';

const props = defineProps<{
	to?: string;
	active?: boolean;
	external?: boolean;
	behavior?: MkABehavior;
	inline?: boolean;
}>();
</script>

<style lang="scss" module>
.root {
	display: block;

	&.inline {
		display: inline-block;
	}
}

.main {
	display: flex;
	align-items: center;
	width: 100%;
	box-sizing: border-box;
	padding: 10px 14px;
	background: var(--MI_THEME-folderHeaderBg);
	border-radius: 6px;
	font-size: 0.9em;

	&:hover {
		text-decoration: none;
		background: var(--MI_THEME-folderHeaderHoverBg);
	}

	&.active {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-folderHeaderHoverBg);
	}
}

.icon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	color: var(--MI_THEME-fgTransparentWeak);

	&:empty {
		display: none;

		& + .text {
			padding-left: 4px;
		}
	}
}

.text {
	flex-shrink: 1;
	white-space: normal;
	padding-right: 12px;
	text-align: center;
}

.suffix {
	margin-left: auto;
	opacity: 0.7;
	white-space: nowrap;

	> .suffixText:not(:empty) {
		margin-right: 0.75em;
	}
}
</style>
