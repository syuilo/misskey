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
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { initChart } from '@/scripts/init-chart';

initChart();

const props = defineProps<{
	data: { name: string; value: number; color: string; onClick?: () => void }[];
}>();

const chartEl = shallowRef<HTMLCanvasElement>(null);

const { handler: externalTooltipHandler } = useChartTooltip({
	position: 'middle',
});

let chartInstance: Chart;

onMounted(() => {
	chartInstance = new Chart(chartEl.value, {
		type: 'doughnut',
		data: {
			labels: props.data.map(x => x.name),
			datasets: [{
				backgroundColor: props.data.map(x => x.color),
				borderColor: getComputedStyle(document.documentElement).getPropertyValue('--panel'),
				borderWidth: 2,
				hoverOffset: 0,
				data: props.data.map(x => x.value),
			}],
		},
		options: {
			layout: {
				padding: {
					left: 16,
					right: 16,
					top: 16,
					bottom: 16,
				},
			},
			onClick: (ev) => {
				const hit = chartInstance.getElementsAtEventForMode(ev, 'nearest', { intersect: true }, false)[0];
				if (hit && props.data[hit.index].onClick) {
					props.data[hit.index].onClick();
				}
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
	});
});
</script>
