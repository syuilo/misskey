/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import MkFlashPreview from './MkFlashPreview.vue';
import { flash } from './../../.storybook/fakes.js';
export const Public = {
	render(args) {
		return {
			components: {
				MkFlashPreview,
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
			template: '<MkFlashPreview v-bind="props" />',
		};
	},
	args: {
		flash: {
			...flash(),
			visibility: 'public',
		},
	},
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		() => ({
			template: '<div style="display: flex; align-items: center; justify-content: center; height: 100vh"><div style="max-width: 700px; width: 100%; margin: 3rem"><story/></div></div>',
		}),
	],
} satisfies StoryObj<typeof MkFlashPreview>;
export const Private = {
	...Public,
	args: {
		flash: {
			...flash(),
			visibility: 'private',
		},
	},
} satisfies StoryObj<typeof MkFlashPreview>;
