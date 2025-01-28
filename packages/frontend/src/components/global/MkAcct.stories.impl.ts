/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { userDetailed } from '../../../.storybook/fakes.js';
import MkAcct from './MkAcct.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAcct,
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
			template: '<MkAcct v-bind="props" />',
		};
	},
	args: {
		user: {
			...userDetailed(),
			host: null,
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAcct>;
export const Detail = {
	...Default,
	args: {
		...Default.args,
		user: userDetailed(),
		detail: true,
	},
} satisfies StoryObj<typeof MkAcct>;
export const Long = {
	...Default,
	args: {
		...Default.args,
		user: {
			...userDetailed(),
			username: 'the_quick_brown_fox_jumped_over_the_lazy_dog',
			host: 'misskey.example',
		},
	},
	decorators: [
		() => ({
			template: '<div style="width: 360px;"><story/></div>',
		}),
	],
} satisfies StoryObj<typeof MkAcct>;
export const VeryLong = {
	...Default,
	args: {
		...Default.args,
		user: {
			...userDetailed(),
			username: '2c7cc62a697ea3a7826521f3fd34f0cb273693cbe5e9310f35449f43622a5cdc',
			host: 'the.quick.brown.fox.jumped.over.the.lazy.dog.very.long.hostname.nostr.example',
		},
	},
	decorators: [
		() => ({
			template: '<div style="width: 360px;"><story/></div>',
		}),
	],
} satisfies StoryObj<typeof MkAcct>;
