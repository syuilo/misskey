/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import isChromatic from 'chromatic/isChromatic';
import MkAnalogClock from './MkAnalogClock.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAnalogClock,
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
			template: '<MkAnalogClock v-bind="props" />',
		};
	},
	args: {
		now: isChromatic() ? () => new Date('2023-01-01T10:10:30') : undefined,
	},
	decorators: [
		() => ({
			template: '<div style="container-type:inline-size;height:100%"><div style="height:100cqmin;margin:auto;width:100cqmin"><story/></div></div>',
		}),
	],
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof MkAnalogClock>;
