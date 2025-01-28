<!--
SPDX-FileCopyrightText: syuilo and misskey-project
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
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkMiniChart from '@/components/MkMiniChart.vue';
import { misskeyApi, misskeyApiGet } from '@/scripts/misskey-api.js';
import { useInterval } from '@@/js/use-interval.js';
import { i18n } from '@/i18n.js';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy.js';
import { defaultStore } from '@/store.js';

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

const instances = ref<Misskey.entities.FederationInstance[]>([]);
const charts = ref<Misskey.entities.ChartsInstanceResponse[]>([]);
const fetching = ref(true);

const fetch = async () => {
	const fetchedInstances = await misskeyApi('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 5,
	});
	const fetchedCharts = await Promise.all(fetchedInstances.map(i => misskeyApiGet('charts/instance', { host: i.host, limit: 16, span: 'hour' })));
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
			border-bottom: solid 0.5px var(--MI_THEME-divider);

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
				color: var(--MI_THEME-fg);
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
