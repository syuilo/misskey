<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :column="column" :isStacked="isStacked" :menu="menu" :refresher="async () => { await notificationsComponent?.reload() }">
	<template #header><i class="ti ti-bell" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<XNotifications ref="notificationsComponent" :excludeTypes="props.column.excludeTypes"/>
</XColumn>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, shallowRef } from 'vue';
import XColumn from './column.vue';
import { updateColumn } from './deck-store.js';
import type { Column } from './deck-store.js';
import XNotifications from '@/components/MkNotifications.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const notificationsComponent = shallowRef<InstanceType<typeof XNotifications>>();

function func() {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkNotificationSelectWindow.vue')), {
		excludeTypes: props.column.excludeTypes,
	}, {
		done: async (res) => {
			const { excludeTypes } = res;
			updateColumn(props.column.id, {
				excludeTypes: excludeTypes,
			});
		},
		closed: () => dispose(),
	});
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.notificationSetting,
	action: func,
}];
</script>
