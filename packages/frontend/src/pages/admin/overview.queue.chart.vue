<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<canvas ref="chartEl"></canvas>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, shallowRef } from 'vue';
import { Chart } from 'chart.js';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { chartVLine } from '@/scripts/chart-vline';
import { alpha } from '@/scripts/color';
import { initChart } from '@/scripts/init-chart';

initChart();

const props = defineProps<{
	type: string;
}>();

const chartEl = shallowRef<HTMLCanvasElement>(null);

const { handler: externalTooltipHandler } = useChartTooltip();

let chartInstance: Chart;

function setData(values) {
	if (chartInstance == null) return;
	for (const value of values) {
		chartInstance.data.labels.push('');
		chartInstance.data.datasets[0].data.push(value);
		if (chartInstance.data.datasets[0].data.length > 100) {
			chartInstance.data.labels.shift();
			chartInstance.data.datasets[0].data.shift();
		}
	}
	chartInstance.update();
}

function pushData(value) {
	if (chartInstance == null) return;
	chartInstance.data.labels.push('');
	chartInstance.data.datasets[0].data.push(value);
	if (chartInstance.data.datasets[0].data.length > 100) {
		chartInstance.data.labels.shift();
		chartInstance.data.datasets[0].data.shift();
	}
	chartInstance.update();
}

const label =
	props.type === 'process' ? 'Process' :
	props.type === 'active' ? 'Active' :
	props.type === 'delayed' ? 'Delayed' :
	props.type === 'waiting' ? 'Waiting' :
	'?' as never;

const color =
	props.type === 'process' ? '#00E396' :
	props.type === 'active' ? '#00BCD4' :
	props.type === 'delayed' ? '#E53935' :
	props.type === 'waiting' ? '#FFB300' :
	'?' as never;

onMounted(() => {
	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	chartInstance = new Chart(chartEl.value, {
		type: 'line',
		data: {
			labels: [],
			datasets: [{
				label: label,
				pointRadius: 0,
				tension: 0.3,
				borderWidth: 2,
				borderJoinStyle: 'round',
				borderColor: color,
				backgroundColor: alpha(color, 0.2),
				fill: true,
				data: [],
			}],
		},
		options: {
			aspectRatio: 2.5,
			layout: {
				padding: {
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					grid: {
						display: false,
					},
					ticks: {
						display: false,
						maxTicksLimit: 10,
					},
				},
				y: {
					min: 0,
					grid: {
					},
				},
			},
			interaction: {
				intersect: false,
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
			},
		},
		plugins: [chartVLine(vLineColor)],
	});
});

defineExpose({
	setData,
	pushData,
});
</script>
