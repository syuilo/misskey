<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span :class="[$style.root, { [$style.static]: static }]">
	<span :class="$style.dot">.</span><span :class="$style.dot">.</span><span :class="$style.dot">.</span>
</span>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';

const props = withDefaults(defineProps<{
	static?: boolean;
}>(), {
	static: false,
});
</script>

<style lang="scss" module>
@keyframes ellipsis {
	0%, 80%, 100% {
		opacity: 1;
	}
	40% {
		opacity: 0;
	}
}

.root {
	&.static > .dot {
		animation-play-state: paused;
	}
}

.dot {
	animation: ellipsis 1.4s infinite ease-in-out both;

	&:nth-child(1) {
		animation-delay: 0s;
	}

	&:nth-child(2) {
		animation-delay: 0.16s;
	}

	&:nth-child(3) {
		animation-delay: 0.32s;
	}
}
</style>
