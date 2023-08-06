// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect } from '@storybook/jest';
import { userEvent, waitFor, within } from '@storybook/testing-library';
import { StoryObj } from '@storybook/vue3';
import { onBeforeUnmount } from 'vue';
import MkSignupServerRules from './MkSignupDialog.rules.vue';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
export const Empty = {
	render(args) {
		return {
			components: {
				MkSignupServerRules,
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
			template: '<MkSignupServerRules v-bind="props" />',
		};
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const groups = await canvas.findAllByRole('group');
		const buttons = await canvas.findAllByRole('button');
		for (const group of groups) {
			if (group.ariaExpanded === 'true') {
				continue;
			}
			const button = await within(group).findByRole('button');
			userEvent.click(button);
			await waitFor(() => expect(group).toHaveAttribute('aria-expanded', 'true'));
		}
		const labels = await canvas.findAllByText(i18n.ts.agree);
		for (const label of labels) {
			expect(buttons.at(-1)).toBeDisabled();
			await waitFor(() => userEvent.click(label));
		}
		expect(buttons.at(-1)).toBeEnabled();
	},
	args: {
		serverRules: [],
		tosUrl: null,
	},
	decorators: [
		(_, context) => ({
			setup() {
				instance.serverRules = context.args.serverRules;
				instance.tosUrl = context.args.tosUrl;
				onBeforeUnmount(() => {
					// FIXME: 呼び出されない
					instance.serverRules = [];
					instance.tosUrl = null;
				});
			},
			template: '<story/>',
		}),
	],
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSignupServerRules>;
export const ServerRulesOnly = {
	...Empty,
	args: {
		...Empty.args,
		serverRules: [
			'ルール',
		],
	},
} satisfies StoryObj<typeof MkSignupServerRules>;
export const TOSOnly = {
	...Empty,
	args: {
		...Empty.args,
		tosUrl: 'https://example.com/tos',
	},
} satisfies StoryObj<typeof MkSignupServerRules>;
export const ServerRulesAndTOS = {
	...Empty,
	args: {
		...Empty.args,
		serverRules: ServerRulesOnly.args.serverRules,
		tosUrl: TOSOnly.args.tosUrl,
	},
} satisfies StoryObj<typeof MkSignupServerRules>;
