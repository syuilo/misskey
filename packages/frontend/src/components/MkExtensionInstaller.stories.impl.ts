/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import MkExtensionInstaller from './MkExtensionInstaller.vue';
import lightTheme from '@@/themes/_light.json5';

export const Plugin = {
	render(args) {
		return {
			components: {
				MkExtensionInstaller,
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
			template: '<MkExtensionInstaller v-bind="props" />',
		};
	},
	args: {
		extension: {
			type: 'plugin',
			raw: '"do nothing"',
			meta: {
				name: 'do nothing plugin',
				version: '1.0',
				author: 'syuilo and misskey-project',
				description: 'a plugin that does nothing',
				permissions: ['read:account'],
				config: {
					'doNothing': true,
				},
			},
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkExtensionInstaller>;

export const Theme = {
	render(args) {
		return {
			components: {
				MkExtensionInstaller,
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
			template: '<MkExtensionInstaller v-bind="props" />',
		};
	},
	args: {
		extension: {
			type: 'theme',
			raw: JSON.stringify(lightTheme),
			meta: lightTheme,
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkExtensionInstaller>;
