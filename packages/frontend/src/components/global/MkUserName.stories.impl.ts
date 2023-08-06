// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from '@storybook/jest';
import { userEvent, within } from '@storybook/testing-library';
import { StoryObj } from '@storybook/vue3';
import { userDetailed } from '../../../.storybook/fakes';
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
		await expect(canvasElement).toHaveTextContent(userDetailed().name);
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
