/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { waitFor } from '@storybook/test';
import type { StoryObj } from '@storybook/vue3';
import MkPageHeader from './MkPageHeader.vue';
export const Empty = {
	render(args) {
		return {
			components: {
				MkPageHeader,
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
			template: '<MkPageHeader v-bind="props" />',
		};
	},
	async play() {
		const wait = new Promise((resolve) => setTimeout(resolve, 800));
		await waitFor(async () => await wait);
	},
	args: {
		tabs: [],
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const OneTab = {
	...Empty,
	args: {
		...Empty.args,
		tab: 'sometabkey',
		tabs: [
			{
				key: 'sometabkey',
				title: 'Some Tab Title',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const Icon = {
	...OneTab,
	args: {
		...OneTab.args,
		tabs: [
			{
				...OneTab.args.tabs[0],
				icon: 'ti ti-home',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const IconOnly = {
	...Icon,
	args: {
		...Icon.args,
		tabs: [
			{
				key: Icon.args.tabs[0].key,
				icon: Icon.args.tabs[0].icon,
				iconOnly: true,
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const SomeTabs = {
	...Empty,
	args: {
		...Empty.args,
		tab: 'princess',
		tabs: [
			{
				key: 'princess',
				title: 'Princess',
				icon: 'ti ti-crown',
			},
			{
				key: 'fairy',
				title: 'Fairy',
				icon: 'ti ti-snowflake',
			},
			{
				key: 'angel',
				title: 'Angel',
				icon: 'ti ti-feather',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
