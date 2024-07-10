<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component
	:is="tag"
	:class="[
		$style.main,
		{
			[$style.active]: active,
			[$style.large]: large,
		}
	]"
	class="_button"
>
	<span :class="$style.icon"><slot name="icon"></slot></span>
	<div :class="$style.headerText">
		<div>
			<MkCondensedLine :minScale="2 / 3"><slot></slot></MkCondensedLine>
		</div>
		<div v-if="$slots.caption" :class="$style.headerTextSub">
			<MkCondensedLine :minScale="2 / 3"><slot name="caption"></slot></MkCondensedLine>
		</div>
	</div>
	<span :class="$style.suffix">
		<span :class="$style.suffixText"><slot name="suffix"></slot></span>
		<span><slot name="suffixIcon"></slot></span>
	</span>
</component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	tag?: string;
	active?: boolean;
	large?: boolean;
}>(), {
	tag: 'button',
});
</script>

<style lang="scss" module>
.main {
	display: flex;
	align-items: center;
	width: 100%;
	box-sizing: border-box;
	padding: 10px 14px;
	background: var(--buttonBg);
	border-radius: 6px;
	font-size: 0.9em;

	&.large {
		font-size: 1em;
	}

	&:hover {
		text-decoration: none;
		background: var(--buttonHoverBg);
	}

	&.active {
		color: var(--accent);
		background: var(--buttonHoverBg);
	}
}

.icon {
	margin-right: 0.75em;
	flex-shrink: 0;
	text-align: center;
	color: var(--fgTransparentWeak);

	&:empty {
		display: none;

		& + .headerText {
			padding-left: 4px;
		}
	}
}

.headerText {
	white-space: nowrap;
	text-overflow: ellipsis;
	text-align: start;
	overflow: hidden;
	padding-right: 12px;
}

.headerTextSub {
	color: var(--fgTransparentWeak);
	font-size: .85em;
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
