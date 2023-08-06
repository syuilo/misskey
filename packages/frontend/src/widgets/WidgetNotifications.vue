<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :style="`height: ${widgetProps.height}px;`" :showHeader="widgetProps.showHeader" :scrollable="true" data-cy-mkw-notifications class="mkw-notifications">
	<template #icon><i class="ti ti-bell"></i></template>
	<template #header>{{ i18n.ts.notifications }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configureNotification()"><i class="ti ti-settings"></i></button></template>

	<div>
		<XNotifications :includeTypes="widgetProps.includingTypes"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import MkContainer from '@/components/MkContainer.vue';
import XNotifications from '@/components/MkNotifications.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const name = 'notifications';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	height: {
		type: 'number' as const,
		default: 300,
	},
	includingTypes: {
		type: 'array' as const,
		hidden: true,
		default: null,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const configureNotification = () => {
	os.popup(defineAsyncComponent(() => import('@/components/MkNotificationSettingWindow.vue')), {
		includingTypes: widgetProps.includingTypes,
	}, {
		done: async (res) => {
			const { includingTypes } = res;
			widgetProps.includingTypes = includingTypes;
			save();
		},
	}, 'closed');
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
