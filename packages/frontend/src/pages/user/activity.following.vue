<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkLoading v-if="fetching"/>
	<div v-show="!fetching" :class="$style.root" class="_panel">
		<canvas ref="chartEl"></canvas>
		<MkChartLegend ref="legendEl" style="margin-top: 8px;"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, shallowRef, ref } from 'vue';
import { Chart } from 'chart.js';
import type { ChartDataset } from 'chart.js';
import * as Misskey from 'misskey-js';
import gradient from 'chartjs-plugin-gradient';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { defaultStore } from '@/store.js';
import { useChartTooltip } from '@/scripts/use-chart-tooltip.js';
import { chartVLine } from '@/scripts/chart-vline.js';
import { initChart } from '@/scripts/init-chart.js';
import { chartLegend } from '@/scripts/chart-legend.js';
import MkChartLegend from '@/components/MkChartLegend.vue';

initChart();

const props = defineProps<{
	user: Misskey.entities.User;
}>();

const chartEl = shallowRef<HTMLCanvasElement>(null);
const legendEl = shallowRef<InstanceType<typeof MkChartLegend>>();
const now = new Date();
let chartInstance: Chart = null;
const chartLimit = 30;
const fetching = ref(true);

const { handler: externalTooltipHandler } = useChartTooltip();

async function renderChart() {
	if (chartInstance) {
		chartInstance.destroy();
	}

	const getDate = (ago: number) => {
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();

		return new Date(y, m, d - ago);
	};

	const format = (arr) => {
		return arr.map((v, i) => ({
			x: getDate(i).getTime(),
			y: v,
		}));
	};

	const raw = await misskeyApi('charts/user/following', { userId: props.user.id, limit: chartLimit, span: 'day' });

	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	const colorFollowLocal = '#008FFB';
	const colorFollowRemote = '#008FFB88';
	const colorFollowedLocal = '#2ecc71';
	const colorFollowedRemote = '#2ecc7188';

	function makeDataset(label: string, data: ChartDataset['data'], extra: Partial<ChartDataset> = {}): ChartDataset {
		return Object.assign({
			label: label,
			data: data,
			parsing: false,
			pointRadius: 0,
			borderWidth: 0,
			borderJoinStyle: 'round',
			borderRadius: 4,
			barPercentage: 0.7,
			categoryPercentage: 0.7,
			fill: true,
		/* @see <https://github.com/misskey-dev/misskey/pull/10365#discussion_r1155511107>
		} satisfies ChartData, extra);
		 */
		}, extra);
	}

	chartInstance = new Chart(chartEl.value, {
		type: 'bar',
		data: {
			datasets: [
				makeDataset('Follow (local)', format(raw.local.followings.inc).slice().reverse(), { backgroundColor: colorFollowLocal, stack: 'follow' }),
				makeDataset('Follow (remote)', format(raw.remote.followings.inc).slice().reverse(), { backgroundColor: colorFollowRemote, stack: 'follow' }),
				makeDataset('Followed (local)', format(raw.local.followers.inc).slice().reverse(), { backgroundColor: colorFollowedLocal, stack: 'followed' }),
				makeDataset('Followed (remote)', format(raw.remote.followers.inc).slice().reverse(), { backgroundColor: colorFollowedRemote, stack: 'followed' }),
			],
		},
		options: {
			aspectRatio: 3,
			layout: {
				padding: {
					left: 0,
					right: 8,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					type: 'time',
					offset: true,
					stacked: true,
					time: {
						stepSize: 1,
						unit: 'day',
						displayFormats: {
							day: 'M/d',
							month: 'Y/M',
						},
					},
					grid: {
						display: false,
					},
					ticks: {
						display: true,
						maxRotation: 0,
						autoSkipPadding: 8,
					},
				},
				y: {
					position: 'left',
					stacked: true,
					suggestedMax: 10,
					grid: {
						display: true,
					},
					ticks: {
						display: true,
						//mirror: true,
					},
				},
			},
			interaction: {
				intersect: false,
				mode: 'index',
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					mode: 'index',
					animation: {
						duration: 0,
					},
					external: externalTooltipHandler,
				},
				gradient,
			},
		},
		plugins: [chartVLine(vLineColor), chartLegend(legendEl.value)],
	});

	fetching.value = false;
}

onMounted(async () => {
	renderChart();
});
</script>

<style lang="scss" module>
.root {
	padding: 20px;
}
</style>
