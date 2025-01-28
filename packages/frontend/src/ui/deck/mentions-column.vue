<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :refresher="() => reloadTimeline()">
	<template #header><i class="ti ti-at" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<MkNotes ref="tlComponent" :pagination="pagination"/>
</XColumn>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import XColumn from './column.vue';
import type { Column } from './deck-store.js';
import MkNotes from '@/components/MkNotes.vue';

defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const tlComponent = ref<InstanceType<typeof MkNotes>>();

function reloadTimeline() {
	return new Promise<void>((res) => {
		tlComponent.value?.pagingComponent?.reload().then(() => {
			res();
		});
	});
}

const pagination = {
	endpoint: 'notes/mentions' as const,
	limit: 10,
};
</script>
