<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent">
	<template #icon><i class="ti ti-server"></i></template>
	<template #header>{{ i18n.ts._widgets.serverMetric }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="toggleView()"><i class="ti ti-selector"></i></button></template>

	<div v-if="meta" data-cy-mkw-serverMetric class="mkw-serverMetric">
		<XCpuMemory v-if="widgetProps.view === 0" :connection="connection" :meta="meta"/>
		<XNet v-else-if="widgetProps.view === 1" :connection="connection" :meta="meta"/>
		<XCpu v-else-if="widgetProps.view === 2" :connection="connection" :meta="meta"/>
		<XMemory v-else-if="widgetProps.view === 3" :connection="connection" :meta="meta"/>
		<XDisk v-else-if="widgetProps.view === 4" :connection="connection" :meta="meta"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from '../widget.js';
import type { WidgetComponentProps, WidgetComponentEmits, WidgetComponentExpose } from '../widget.js';
import XCpuMemory from './cpu-mem.vue';
import XNet from './net.vue';
import XCpu from './cpu.vue';
import XMemory from './mem.vue';
import XDisk from './disk.vue';
import MkContainer from '@/components/MkContainer.vue';
import type { GetFormResultType } from '@/scripts/form.js';
import { misskeyApiGet } from '@/scripts/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';

const name = 'serverMetric';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	view: {
		type: 'number' as const,
		default: 0,
		hidden: true,
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

const meta = ref<Misskey.entities.ServerInfoResponse | null>(null);

misskeyApiGet('server-info', {}).then(res => {
	meta.value = res;
});

const toggleView = () => {
	if (widgetProps.view === 4) {
		widgetProps.view = 0;
	} else {
		widgetProps.view++;
	}
	save();
};

const connection = useStream().useChannel('serverStats');
onUnmounted(() => {
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
