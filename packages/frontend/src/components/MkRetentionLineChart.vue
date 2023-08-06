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
import tinycolor from 'tinycolor2';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { chartVLine } from '@/scripts/chart-vline';
import { alpha } from '@/scripts/color';
import { initChart } from '@/scripts/init-chart';
import * as os from '@/os';

initChart();

const chartEl = shallowRef<HTMLCanvasElement>(null);

const { handler: externalTooltipHandler } = useChartTooltip();

let chartInstance: Chart;

const getYYYYMMDD = (date: Date) => {
	const y = date.getFullYear().toString().padStart(2, '0');
	const m = (date.getMonth() + 1).toString().padStart(2, '0');
	const d = date.getDate().toString().padStart(2, '0');
	return `${y}/${m}/${d}`;
};

const getDate = (ymd: string) => {
	const [y, m, d] = ymd.split('-').map(x => parseInt(x, 10));
	const date = new Date(y, m + 1, d, 0, 0, 0, 0);
	return date;
};

onMounted(async () => {
	let raw = await os.api('retention', { });

	const vLineColor = defaultStore.state.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

	const accent = tinycolor(getComputedStyle(document.documentElement).getPropertyValue('--accent'));
	const color = accent.toHex();

	chartInstance = new Chart(chartEl.value, {
		type: 'line',
		data: {
			labels: [],
			datasets: raw.map((record, i) => ({
				label: getYYYYMMDD(new Date(record.createdAt)),
				pointRadius: 0,
				borderWidth: 2,
				borderJoinStyle: 'round',
				borderColor: alpha(color, Math.min(1, (raw.length - (i - 1)) / raw.length)),
				fill: false,
				tension: 0.4,
				data: [{
					x: '0',
					y: 100,
					d: getYYYYMMDD(new Date(record.createdAt)),
				}, ...Object.entries(record.data).sort((a, b) => getDate(a[0]) > getDate(b[0]) ? 1 : -1).map(([k, v], i) => ({
					x: (i + 1).toString(),
					y: (v / record.users) * 100,
					d: getYYYYMMDD(new Date(record.createdAt)),
				}))],
			})),
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
					title: {
						display: true,
						text: 'Days later',
					},
				},
				y: {
					title: {
						display: true,
						text: 'Rate (%)',
					},
					ticks: {
						callback: (value, index, values) => value + '%',
					},
					min: 0,
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
					callbacks: {
						title(context) {
							const v = context[0].dataset.data[context[0].dataIndex];
							return `${v.x} days later`;
						},
						label(context) {
							const v = context.dataset.data[context.dataIndex];
							const p = Math.round(v.y) + '%';
							return `${v.d} ${p}`;
						},
					},
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
</script>
