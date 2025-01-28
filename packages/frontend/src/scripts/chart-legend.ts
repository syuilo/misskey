/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Plugin } from 'chart.js';
import MkChartLegend from '@/components/MkChartLegend.vue';

export const chartLegend = (legend: InstanceType<typeof MkChartLegend>) => ({
	id: 'htmlLegend',
	afterUpdate(chart, args, options) {
		// Reuse the built-in legendItems generator
		const items = chart.options.plugins.legend.labels.generateLabels(chart);

		legend.update(chart, items);
	},
}) as Plugin;
