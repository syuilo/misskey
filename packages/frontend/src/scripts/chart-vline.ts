/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Plugin } from 'chart.js';

export const chartVLine = (vLineColor: string) => ({
	id: 'vLine',
	beforeDraw(chart, args, options) {
		if (chart.tooltip?._active?.length) {
			const ctx = chart.ctx;
			const xs = chart.tooltip._active.map(a => a.element.x);
			const x = xs.reduce((a, b) => a + b, 0) / xs.length;
			const topY = chart.scales.y.top;
			const bottomY = chart.scales.y.bottom;

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(x, bottomY);
			ctx.lineTo(x, topY);
			ctx.lineWidth = 1;
			ctx.strokeStyle = vLineColor;
			ctx.stroke();
			ctx.restore();
		}
	},
}) as Plugin;
