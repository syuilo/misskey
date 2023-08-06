<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl">
	<MkLoading v-if="fetching"/>
	<div v-else>
		<canvas ref="chartEl"></canvas>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, nextTick, watch } from 'vue';
import { Chart } from 'chart.js';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { alpha } from '@/scripts/color';
import { initChart } from '@/scripts/init-chart';

initChart();

const props = defineProps<{
	src: string;
}>();

const rootEl = $shallowRef<HTMLDivElement>(null);
const chartEl = $shallowRef<HTMLCanvasElement>(null);
const now = new Date();
let chartInstance: Chart = null;
let fetching = $ref(true);

const { handler: externalTooltipHandler } = useChartTooltip({
	position: 'middle',
});

async function renderChart() {
	if (chartInstance) {
		chartInstance.destroy();
	}

	const wide = rootEl.offsetWidth > 700;
	const narrow = rootEl.offsetWidth < 400;

	const weeks = wide ? 50 : narrow ? 10 : 25;
	const chartLimit = 7 * weeks;

	const getDate = (ago: number) => {
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();

		return new Date(y, m, d - ago);
	};

	const format = (arr) => {
		return arr.map((v, i) => {
			const dt = getDate(i);
			const iso = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`;
			return {
				x: iso,
				y: dt.getDay(),
				d: iso,
				v,
			};
		});
	};

	let values;

	if (props.src === 'active-users') {
		const raw = await os.api('charts/active-users', { limit: chartLimit, span: 'day' });
		values = raw.readWrite;
	} else if (props.src === 'notes') {
		const raw = await os.api('charts/notes', { limit: chartLimit, span: 'day' });
		values = raw.local.inc;
	} else if (props.src === 'ap-requests-inbox-received') {
		const raw = await os.api('charts/ap-request', { limit: chartLimit, span: 'day' });
		values = raw.inboxReceived;
	} else if (props.src === 'ap-requests-deliver-succeeded') {
		const raw = await os.api('charts/ap-request', { limit: chartLimit, span: 'day' });
		values = raw.deliverSucceeded;
	} else if (props.src === 'ap-requests-deliver-failed') {
		const raw = await os.api('charts/ap-request', { limit: chartLimit, span: 'day' });
		values = raw.deliverFailed;
	}

	fetching = false;

	await nextTick();

	const color = defaultStore.state.darkMode ? '#b4e900' : '#86b300';

	// 視覚上の分かりやすさのため上から最も大きい3つの値の平均を最大値とする
	const max = values.slice().sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / 3;

	const min = Math.max(0, Math.min(...values) - 1);

	const marginEachCell = 4;

	chartInstance = new Chart(chartEl, {
		type: 'matrix',
		data: {
			datasets: [{
				label: 'Read & Write',
				data: format(values),
				pointRadius: 0,
				borderWidth: 0,
				borderJoinStyle: 'round',
				borderRadius: 3,
				backgroundColor(c) {
					const value = c.dataset.data[c.dataIndex].v;
					let a = (value - min) / max;
					if (value !== 0) { // 0でない限りは完全に不可視にはしない
						a = Math.max(a, 0.05);
					}
					return alpha(color, a);
				},
				fill: true,
				width(c) {
					const a = c.chart.chartArea ?? {};
					return (a.right - a.left) / weeks - marginEachCell;
				},
				height(c) {
					const a = c.chart.chartArea ?? {};
					return (a.bottom - a.top) / 7 - marginEachCell;
				},
			}],
		},
		options: {
			aspectRatio: wide ? 6 : narrow ? 1.8 : 3.2,
			layout: {
				padding: {
					left: 8,
					right: 0,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					type: 'time',
					offset: true,
					position: 'bottom',
					time: {
						unit: 'week',
						round: 'week',
						isoWeekday: 0,
						displayFormats: {
							day: 'M/d',
							month: 'Y/M',
							week: 'M/d',
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
					offset: true,
					reverse: true,
					position: 'right',
					grid: {
						display: false,
					},
					ticks: {
						maxRotation: 0,
						autoSkip: true,
						padding: 1,
						font: {
							size: 9,
						},
						callback: (value, index, values) => ['', 'Mon', '', 'Wed', '', 'Fri', ''][value],
					},
				},
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					callbacks: {
						title(context) {
							const v = context[0].dataset.data[context[0].dataIndex];
							return v.d;
						},
						label(context) {
							const v = context.dataset.data[context.dataIndex];
							return ['Active: ' + v.v];
						},
					},
					//mode: 'index',
					animation: {
						duration: 0,
					},
					external: externalTooltipHandler,
				},
			},
		},
	});
}

watch(() => props.src, () => {
	fetching = true;
	renderChart();
});

onMounted(async () => {
	renderChart();
});
</script>
