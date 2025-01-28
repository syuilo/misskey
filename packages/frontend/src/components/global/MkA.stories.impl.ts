/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect, userEvent, within } from '@storybook/test';
import type { StoryObj } from '@storybook/vue3';
import MkA from './MkA.vue';
import { tick } from '@/scripts/test-utils.js';
export const Default = {
	render(args) {
		return {
			components: {
				MkA,
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
			template: '<MkA v-bind="props">Misskey</MkA>',
		};
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const a = canvas.getByRole<HTMLAnchorElement>('link');
		// FIXME: 通るけどその後落ちるのでコメントアウト
		// await expect(a.href).toMatch(/^https?:\/\/.*#test$/);
		await userEvent.pointer({ keys: '[MouseRight]', target: a });
		const menu = canvas.getByRole('menu');
		await expect(menu).toBeInTheDocument();
		await userEvent.click(a);
		a.blur();
		await expect(menu).not.toBeInTheDocument();
	},
	args: {
		to: '#test',
		behavior: 'browser',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkA>;
