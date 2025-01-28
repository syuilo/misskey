/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import { action } from '@storybook/addon-actions';
import { expect, userEvent, within } from '@storybook/test';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkClickerGame from './MkClickerGame.vue';

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export const Default = {
	render(args) {
		return {
			components: {
				MkClickerGame,
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
			template: '<MkClickerGame v-bind="props" />',
		};
	},
	async play({ canvasElement }) {
		await sleep(1000);
		const canvas = within(canvasElement);
		const count = canvas.getByTestId('count');
		await expect(count).toHaveTextContent('0');
		const buttonElement = canvas.getByRole<HTMLButtonElement>('button');
		await userEvent.click(buttonElement);
		await expect(count).toHaveTextContent('1');
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/i/registry/get', async ({ request }) => {
					action('POST /api/i/registry/get')(await request.json());
					return HttpResponse.json({
						error: {
							message: 'No such key.',
							code: 'NO_SUCH_KEY',
							id: 'ac3ed68a-62f0-422b-a7bc-d5e09e8f6a6a',
						},
					}, {
						status: 400,
					});
				}),
				http.post('/api/i/registry/set', async ({ request }) => {
					action('POST /api/i/registry/set')(await request.json());
					return HttpResponse.json(undefined, { status: 204 });
				}),
				http.post('/api/i/claim-achievement', async ({ request }) => {
					action('POST /api/i/claim-achievement')(await request.json());
					return HttpResponse.json(undefined, { status: 204 });
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkClickerGame>;
