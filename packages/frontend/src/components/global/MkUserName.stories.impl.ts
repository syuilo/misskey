/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from '@storybook/test';
import type { StoryObj } from '@storybook/vue3';
import { userDetailed } from '../../../.storybook/fakes.js';
import MkUserName from './MkUserName.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkUserName,
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
			template: '<MkUserName v-bind="props"/>',
		};
	},
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(userDetailed().name as string);
	},
	args: {
		user: userDetailed(),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserName>;
export const Anonymous = {
	...Default,
	async play({ canvasElement }) {
		await expect(canvasElement).toHaveTextContent(userDetailed().username);
	},
	args: {
		...Default.args,
		user: {
			...userDetailed(),
			name: null,
		},
	},
} satisfies StoryObj<typeof MkUserName>;
export const Wrap = {
	...Default,
	args: {
		...Default.args,
		nowrap: false,
	},
} satisfies StoryObj<typeof MkUserName>;
