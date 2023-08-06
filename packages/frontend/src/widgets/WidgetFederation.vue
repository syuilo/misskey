<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :foldable="foldable" :scrollable="scrollable" data-cy-mkw-federation class="mkw-federation">
	<template #icon><i class="ti ti-whirl"></i></template>
	<template #header>{{ i18n.ts._widgets.federation }}</template>

	<div class="wbrkwalb">
		<MkLoading v-if="fetching"/>
		<TransitionGroup v-else tag="div" :name="defaultStore.state.animation ? 'chart' : ''" class="instances">
			<div v-for="(instance, i) in instances" :key="instance.id" class="instance">
				<img :src="getInstanceIcon(instance)" alt=""/>
				<div class="body">
					<MkA class="a" :to="`/instance-info/${instance.host}`" behavior="window" :title="instance.host">{{ instance.host }}</MkA>
					<p>{{ instance.softwareName || '?' }} {{ instance.softwareVersion }}</p>
				</div>
				<MkMiniChart class="chart" :src="charts[i].requests.received"/>
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
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy';
import { defaultStore } from '@/store';

const name = 'federation';

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

const instances = ref([]);
const charts = ref([]);
const fetching = ref(true);

const fetch = async () => {
	const fetchedInstances = await os.api('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 5,
	});
	const fetchedCharts = await Promise.all(fetchedInstances.map(i => os.apiGet('charts/instance', { host: i.host, limit: 16, span: 'hour' })));
	instances.value = fetchedInstances;
	charts.value = fetchedCharts;
	fetching.value = false;
};

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

function getInstanceIcon(instance): string {
	return getProxiedImageUrlNullable(instance.iconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? '/client-assets/dummy.png';
}

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.wbrkwalb {
	$bodyTitleHieght: 18px;
	$bodyInfoHieght: 16px;

	height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
	overflow: hidden;

	> .instances {
		.chart-move {
			transition: transform 1s ease;
		}

		> .instance {
			display: flex;
			align-items: center;
			padding: 14px 16px;
			border-bottom: solid 0.5px var(--divider);

			> img {
				display: block;
				width: ($bodyTitleHieght + $bodyInfoHieght);
				height: ($bodyTitleHieght + $bodyInfoHieght);
				object-fit: cover;
				border-radius: 4px;
				margin-right: 8px;
			}

			> .body {
				flex: 1;
				overflow: hidden;
				font-size: 0.9em;
				color: var(--fg);
				padding-right: 8px;

				> .a {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					line-height: $bodyTitleHieght;
				}

				> p {
					margin: 0;
					font-size: 75%;
					opacity: 0.7;
					line-height: $bodyInfoHieght;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			}

			> .chart {
				height: 30px;
			}
		}
	}
}
</style>
