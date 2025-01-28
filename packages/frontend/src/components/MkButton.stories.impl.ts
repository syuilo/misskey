/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { action } from '@storybook/addon-actions';
import type { StoryObj } from '@storybook/vue3';
import MkButton from './MkButton.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkButton,
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
				events() {
					return {
						click: action('click'),
					};
				},
			},
			template: '<MkButton v-bind="props" v-on="events">Text</MkButton>',
		};
	},
	args: {
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkButton>;
export const Primary = {
	...Default,
	args: {
		...Default.args,
		primary: true,
	},
} satisfies StoryObj<typeof MkButton>;
export const Gradate = {
	...Default,
	args: {
		...Default.args,
		gradate: true,
	},
} satisfies StoryObj<typeof MkButton>;
export const Rounded = {
	...Default,
	args: {
		...Default.args,
		rounded: true,
	},
} satisfies StoryObj<typeof MkButton>;
export const Danger = {
	...Default,
	args: {
		...Default.args,
		danger: true,
	},
} satisfies StoryObj<typeof MkButton>;
export const Small = {
	...Default,
	args: {
		...Default.args,
		small: true,
	},
} satisfies StoryObj<typeof MkButton>;
export const Large = {
	...Default,
	args: {
		...Default.args,
		large: true,
	},
} satisfies StoryObj<typeof MkButton>;
