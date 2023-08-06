<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-trends class="mkw-trends">
	<template #icon><i class="ti ti-hash"></i></template>
	<template #header>{{ i18n.ts._widgets.trends }}</template>

	<div class="wbrkwala">
		<MkLoading v-if="fetching"/>
		<TransitionGroup v-else tag="div" :name="defaultStore.state.animation ? 'chart' : ''" class="tags">
			<div v-for="stat in stats" :key="stat.tag">
				<div class="tag">
					<MkA class="a" :to="`/tags/${ encodeURIComponent(stat.tag) }`" :title="stat.tag">#{{ stat.tag }}</MkA>
					<p>{{ i18n.t('nUsersMentioned', { n: stat.usersCount }) }}</p>
				</div>
				<MkMiniChart class="chart" :src="stat.chart"/>
			</div>
		</TransitionGroup>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import MkContainer from '@/components/MkContainer.vue';
import MkMiniChart from '@/components/MkMiniChart.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';

const name = 'hashtags';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const stats = ref([]);
const fetching = ref(true);

const fetch = () => {
	os.apiGet('hashtags/trend').then(res => {
		stats.value = res;
		fetching.value = false;
	});
};

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.wbrkwala {
	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .tags {
		.chart-move {
			transition: transform 1s ease;
		}

		> div {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 0.5px var(--divider);

			> .tag {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--fg);

				> .a {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: 18px;
				}

				> p {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					line-height: 16px;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>
