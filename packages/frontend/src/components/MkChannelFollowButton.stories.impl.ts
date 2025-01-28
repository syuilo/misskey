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
import { channel } from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkChannelFollowButton from './MkChannelFollowButton.vue';
import { i18n } from '@/i18n.js';

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export const Default = {
	render(args) {
		return {
			components: {
				MkChannelFollowButton,
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
			template: '<MkChannelFollowButton v-bind="props" />',
		};
	},
	args: {
		channel: channel(),
		full: true,
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const buttonElement = canvas.getByRole<HTMLButtonElement>('button');
		await expect(buttonElement).toHaveTextContent(i18n.ts.follow);
		await userEvent.click(buttonElement);
		await sleep(1000);
		await expect(buttonElement).toHaveTextContent(i18n.ts.unfollow);
		await userEvent.click(buttonElement);
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/channels/follow', async ({ request }) => {
					action('POST /api/channels/follow')(await request.json());
					return HttpResponse.json({});
				}),
				http.post('/api/channels/unfollow', async ({ request }) => {
					action('POST /api/channels/unfollow')(await request.json());
					return HttpResponse.json({});
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkChannelFollowButton>;
