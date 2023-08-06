// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { userDetailed } from '../../.storybook/fakes';
import MkAccountMoved from './MkAccountMoved.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAccountMoved,
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
			template: '<MkAccountMoved v-bind="props" />',
		};
	},
	args: {
		username: userDetailed().username,
		host: userDetailed().host,
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAccountMoved>;
