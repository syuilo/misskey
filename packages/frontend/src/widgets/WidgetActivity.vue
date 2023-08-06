<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent" data-cy-mkw-activity class="mkw-activity">
	<template #icon><i class="ti ti-chart-line"></i></template>
	<template #header>{{ i18n.ts._widgets.activity }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="toggleView()"><i class="ti ti-selector"></i></button></template>

	<div>
		<MkLoading v-if="fetching"/>
		<template v-else>
			<XCalendar v-show="widgetProps.view === 0" :activity="[].concat(activity)"/>
			<XChart v-show="widgetProps.view === 1" :activity="[].concat(activity)"/>
		</template>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import XCalendar from './WidgetActivity.calendar.vue';
import XChart from './WidgetActivity.chart.vue';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import { $i } from '@/account';
import { i18n } from '@/i18n';

const name = 'activity';

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

const activity = ref(null);
const fetching = ref(true);

const toggleView = () => {
	if (widgetProps.view === 1) {
		widgetProps.view = 0;
	} else {
		widgetProps.view++;
	}
	save();
};

os.apiGet('charts/user/notes', {
	userId: $i.id,
	span: 'day',
	limit: 7 * 21,
}).then(res => {
	activity.value = res.diffs.normal.map((_, i) => ({
		total: res.diffs.normal[i] + res.diffs.reply[i] + res.diffs.renote[i],
		notes: res.diffs.normal[i],
		replies: res.diffs.reply[i],
		renotes: res.diffs.renote[i],
	}));
	fetching.value = false;
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
