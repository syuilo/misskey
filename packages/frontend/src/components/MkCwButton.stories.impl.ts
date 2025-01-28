/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import type { StoryObj } from '@storybook/vue3';
import { action } from '@storybook/addon-actions';
import { expect, userEvent, within } from '@storybook/test';
import { file } from '../../.storybook/fakes.js';
import MkCwButton from './MkCwButton.vue';
import { i18n } from '@/i18n.js';

export const Default = {
	render(args) {
		return {
			components: {
				MkCwButton,
			},
			data() {
				return {
					showContent: false,
				};
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
						'update:modelValue': action('update:modelValue'),
					};
				},
			},
			template: '<MkCwButton v-model="showContent" v-bind="props" v-on="events" />',
		};
	},
	args: {
		text: 'Some CW content',
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const buttonElement = canvas.getByRole<HTMLButtonElement>('button');
		await expect(buttonElement).toHaveTextContent(i18n.ts._cw.show);
		await expect(buttonElement).toHaveTextContent(i18n.tsx._cw.chars({ count: 15 }));
		await userEvent.click(buttonElement);
		await expect(buttonElement).toHaveTextContent(i18n.ts._cw.hide);
		await userEvent.click(buttonElement);
	},
	parameters: {
		chromatic: {
			// NOTE: テストが終わるまで待つ
			delay: 5000,
		},
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCwButton>;
export const IncludesTextAndDriveFile = {
	...Default,
	args: {
		text: 'Some CW content',
		files: [file()],
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const buttonElement = canvas.getByRole<HTMLButtonElement>('button');
		await expect(buttonElement).toHaveTextContent(i18n.tsx._cw.chars({ count: 15 }));
		await expect(buttonElement).toHaveTextContent(' / ');
		await expect(buttonElement).toHaveTextContent(i18n.tsx._cw.files({ count: 1 }));
	},
} satisfies StoryObj<typeof MkCwButton>;
