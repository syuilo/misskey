<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkTooltip ref="tooltip" :showing="showing" :targetElement="targetElement" :maxWidth="250" @closed="emit('closed')">
	<div :class="$style.root">
		{{ content }}
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkTooltip from '@/components/MkTooltip.vue';

defineProps<{
	showing: boolean;
	content: string;
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" module>
.root {
	font-size: 0.9em;
	text-align: left;
	text-wrap: normal;
}
</style>
