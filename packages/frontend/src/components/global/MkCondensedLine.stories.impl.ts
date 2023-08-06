// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import MkCondensedLine from './MkCondensedLine.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkCondensedLine,
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
			template: '<MkCondensedLine>{{ props.text }}</MkCondensedLine>',
		};
	},
	args: {
		text: 'This is a condensed line.',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCondensedLine>;
export const ContainerIs100px = {
	...Default,
	decorators: [
		() => ({
			template: '<div style="width: 100px;"><story/></div>',
		}),
	],
} satisfies StoryObj<typeof MkCondensedLine>;
