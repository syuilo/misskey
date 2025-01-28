/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from '@storybook/test';
import type { StoryObj } from '@storybook/vue3';
import MkTime from './MkTime.vue';
import { i18n } from '@/i18n.js';
import { dateTimeFormat } from '@@/js/intl-const.js';
const now = new Date('2023-04-01T00:00:00.000Z');
const future = new Date('2024-04-01T00:00:00.000Z');
const oneHourAgo = new Date(now.getTime() - 3600000);
const oneDayAgo = new Date(now.getTime() - 86400000);
const oneWeekAgo = new Date(now.getTime() - 604800000);
const oneMonthAgo = new Date(now.getTime() - 2592000000);
const oneYearAgo = new Date(now.getTime() - 31536000000);
export const Empty = {
	render(args) {
		return {
			components: {
				MkTime,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkTime v-bind="props" />',
		};
	},
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(i18n.ts._ago.invalid);
	},
	args: {
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTime>;
export const RelativeFuture = {
	...Empty,
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(i18n.tsx._timeIn.years({ n: 1 })); // n (1) = future (2024) - now (2023)
	},
	args: {
		...Empty.args,
		time: future,
		origin: now,
	},
} satisfies StoryObj<typeof MkTime>;
export const AbsoluteFuture = {
	...Empty,
	async play({ canvasElement, args }) {
		await expect(canvasElement).toHaveTextContent(dateTimeFormat.format(typeof args.time === 'string' ? new Date(args.time) : args.time ?? undefined));
	},
	args: {
		...Empty.args,
		time: future,
		mode: 'absolute',
	},
} satisfies StoryObj<typeof MkTime>;
export const DetailFuture = {
	...Empty,
	async play(context) {
		await AbsoluteFuture.play(context);
		await expect(context.canvasElement).toHaveTextContent(' (');
		await RelativeFuture.play(context);
		await expect(context.canvasElement).toHaveTextContent(')');
	},
	args: {
		...Empty.args,
		time: future,
		mode: 'detail',
	},
} satisfies StoryObj<typeof MkTime>;
export const RelativeNow = {
	...Empty,
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(i18n.ts._ago.justNow);
	},
	args: {
		...Empty.args,
		time: now,
		origin: now,
		mode: 'relative',
	},
} satisfies StoryObj<typeof MkTime>;
export const AbsoluteNow = {
	...Empty,
	async play({ canvasElement, args }) {
		await expect(canvasElement).toHaveTextContent(dateTimeFormat.format(typeof args.time === 'string' ? new Date(args.time) : args.time ?? undefined));
	},
	args: {
		...Empty.args,
		time: now,
		origin: now,
		mode: 'absolute',
	},
} satisfies StoryObj<typeof MkTime>;
export const DetailNow = {
	...Empty,
	async play(context) {
		await AbsoluteNow.play(context);
		await expect(context.canvasElement).toHaveTextContent(' (');
		await RelativeNow.play(context);
		await expect(context.canvasElement).toHaveTextContent(')');
	},
	args: {
		...Empty.args,
		time: now,
		origin: now,
		mode: 'detail',
	},
} satisfies StoryObj<typeof MkTime>;
export const RelativeOneHourAgo = {
	...Empty,
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(i18n.tsx._ago.hoursAgo({ n: 1 }));
	},
	args: {
		...Empty.args,
		time: oneHourAgo,
		origin: now,
		mode: 'relative',
	},
} satisfies StoryObj<typeof MkTime>;
export const AbsoluteOneHourAgo = {
	...Empty,
	async play({ canvasElement, args }) {
		await expect(canvasElement).toHaveTextContent(dateTimeFormat.format(typeof args.time === 'string' ? new Date(args.time) : args.time ?? undefined));
	},
	args: {
		...Empty.args,
		time: oneHourAgo,
		origin: now,
		mode: 'absolute',
	},
} satisfies StoryObj<typeof MkTime>;
export const DetailOneHourAgo = {
	...Empty,
	async play(context) {
		await AbsoluteOneHourAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(' (');
		await RelativeOneHourAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(')');
	},
	args: {
		...Empty.args,
		time: oneHourAgo,
		origin: now,
		mode: 'detail',
	},
} satisfies StoryObj<typeof MkTime>;
export const RelativeOneDayAgo = {
	...Empty,
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(i18n.tsx._ago.daysAgo({ n: 1 }));
	},
	args: {
		...Empty.args,
		time: oneDayAgo,
		origin: now,
		mode: 'relative',
	},
} satisfies StoryObj<typeof MkTime>;
export const AbsoluteOneDayAgo = {
	...Empty,
	async play({ canvasElement, args }) {
		await expect(canvasElement).toHaveTextContent(dateTimeFormat.format(typeof args.time === 'string' ? new Date(args.time) : args.time ?? undefined));
	},
	args: {
		...Empty.args,
		time: oneDayAgo,
		origin: now,
		mode: 'absolute',
	},
} satisfies StoryObj<typeof MkTime>;
export const DetailOneDayAgo = {
	...Empty,
	async play(context) {
		await AbsoluteOneDayAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(' (');
		await RelativeOneDayAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(')');
	},
	args: {
		...Empty.args,
		time: oneDayAgo,
		origin: now,
		mode: 'detail',
	},
} satisfies StoryObj<typeof MkTime>;
export const RelativeOneWeekAgo = {
	...Empty,
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(i18n.tsx._ago.weeksAgo({ n: 1 }));
	},
	args: {
		...Empty.args,
		time: oneWeekAgo,
		origin: now,
		mode: 'relative',
	},
} satisfies StoryObj<typeof MkTime>;
export const AbsoluteOneWeekAgo = {
	...Empty,
	async play({ canvasElement, args }) {
		await expect(canvasElement).toHaveTextContent(dateTimeFormat.format(typeof args.time === 'string' ? new Date(args.time) : args.time ?? undefined));
	},
	args: {
		...Empty.args,
		time: oneWeekAgo,
		origin: now,
		mode: 'absolute',
	},
} satisfies StoryObj<typeof MkTime>;
export const DetailOneWeekAgo = {
	...Empty,
	async play(context) {
		await AbsoluteOneWeekAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(' (');
		await RelativeOneWeekAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(')');
	},
	args: {
		...Empty.args,
		time: oneWeekAgo,
		origin: now,
		mode: 'detail',
	},
} satisfies StoryObj<typeof MkTime>;
export const RelativeOneMonthAgo = {
	...Empty,
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(i18n.tsx._ago.monthsAgo({ n: 1 }));
	},
	args: {
		...Empty.args,
		time: oneMonthAgo,
		origin: now,
		mode: 'relative',
	},
} satisfies StoryObj<typeof MkTime>;
export const AbsoluteOneMonthAgo = {
	...Empty,
	async play({ canvasElement, args }) {
		await expect(canvasElement).toHaveTextContent(dateTimeFormat.format(typeof args.time === 'string' ? new Date(args.time) : args.time ?? undefined));
	},
	args: {
		...Empty.args,
		time: oneMonthAgo,
		origin: now,
		mode: 'absolute',
	},
} satisfies StoryObj<typeof MkTime>;
export const DetailOneMonthAgo = {
	...Empty,
	async play(context) {
		await AbsoluteOneMonthAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(' (');
		await RelativeOneMonthAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(')');
	},
	args: {
		...Empty.args,
		time: oneMonthAgo,
		origin: now,
		mode: 'detail',
	},
} satisfies StoryObj<typeof MkTime>;
export const RelativeOneYearAgo = {
	...Empty,
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(i18n.tsx._ago.yearsAgo({ n: 1 }));
	},
	args: {
		...Empty.args,
		time: oneYearAgo,
		origin: now,
		mode: 'relative',
	},
} satisfies StoryObj<typeof MkTime>;
export const AbsoluteOneYearAgo = {
	...Empty,
	async play({ canvasElement, args }) {
		await expect(canvasElement).toHaveTextContent(dateTimeFormat.format(typeof args.time === 'string' ? new Date(args.time) : args.time ?? undefined));
	},
	args: {
		...Empty.args,
		time: oneYearAgo,
		origin: now,
		mode: 'absolute',
	},
} satisfies StoryObj<typeof MkTime>;
export const DetailOneYearAgo = {
	...Empty,
	async play(context) {
		await AbsoluteOneYearAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(' (');
		await RelativeOneYearAgo.play(context);
		await expect(context.canvasElement).toHaveTextContent(')');
	},
	args: {
		...Empty.args,
		time: oneYearAgo,
		origin: now,
		mode: 'detail',
	},
} satisfies StoryObj<typeof MkTime>;
