<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
// @ts-nocheck
import { onMounted } from 'vue';
import { Chart, ChartDataset } from 'chart.js';
import * as misskey from 'misskey-js';
import gradient from 'chartjs-plugin-gradient';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { chartVLine } from '@/scripts/chart-vline';
import { initChart } from '@/scripts/init-chart';
import { chartLegend } from '@/scripts/chart-legend';
import MkChartLegend from '@/components/MkChartLegend.vue';

initChart();

const props = defineProps<{
	user: misskey.entities.User;
}>();

const chartEl = $shallowRef<HTMLCanvasElement>(null);
let legendEl = $shallowRef<InstanceType<typeof MkChartLegend>>();
const now = new Date();
let chartInstance: Chart = null;
const chartLimit = 30;
let fetching = $ref(true);

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

	const raw = await os.api('charts/user/pv', { userId: props.user.id, limit: chartLimit, span: 'day' });

	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	const colorUser = '#3498db';
	const colorVisitor = '#2ecc71';
	const colorUser2 = '#3498db88';
	const colorVisitor2 = '#2ecc7188';

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

	chartInstance = new Chart(chartEl, {
		type: 'bar',
		data: {
			datasets: [
				makeDataset('UPV (user)', format(raw.upv.user).slice().reverse(), { backgroundColor: colorUser, stack: 'u' }),
				makeDataset('UPV (visitor)', format(raw.upv.visitor).slice().reverse(), { backgroundColor: colorVisitor, stack: 'u' }),
				makeDataset('NPV (user)', format(raw.pv.user).slice().reverse(), { backgroundColor: colorUser2, stack: 'n' }),
				makeDataset('NPV (visitor)', format(raw.pv.visitor).slice().reverse(), { backgroundColor: colorVisitor2, stack: 'n' }),
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
				title: {
					display: true,
					text: 'Unique/Natural PV',
					padding: {
						left: 0,
						right: 0,
						top: 0,
						bottom: 12,
					},
				},
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
		plugins: [chartVLine(vLineColor), chartLegend(legendEl)],
	});

	fetching = false;
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
