/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import { userDetailed } from '../../../.storybook/fakes.js';
import { commonHandlers } from '../../../.storybook/mocks.js';
import home_ from './home.vue';
export const Default = {
	render(args) {
		return {
			components: {
				home_,
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
			template: '<home_ v-bind="props" />',
		};
	},
	args: {
		user: userDetailed(),
		disableNotes: false,
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/users/notes', () => {
					return HttpResponse.json([]);
				}),
				http.get('/api/charts/user/notes', ({ request }) => {
					const url = new URL(request.url);
					const length = Math.max(Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10), 1), 300);
					return HttpResponse.json({
						total: Array.from({ length }, () => 0),
						inc: Array.from({ length }, () => 0),
						dec: Array.from({ length }, () => 0),
						diffs: {
							normal: Array.from({ length }, () => 0),
							reply: Array.from({ length }, () => 0),
							renote: Array.from({ length }, () => 0),
							withFile: Array.from({ length }, () => 0),
						},
					});
				}),
				http.get('/api/charts/user/pv', ({ request }) => {
					const url = new URL(request.url);
					const length = Math.max(Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10), 1), 300);
					return HttpResponse.json({
						upv: {
							user: Array.from({ length }, () => 0),
							visitor: Array.from({ length }, () => 0),
						},
						pv: {
							user: Array.from({ length }, () => 0),
							visitor: Array.from({ length }, () => 0),
						},
					});
				}),
			],
		},
		chromatic: {
			// `XActivity` is not compatible with Chromatic for now
			disableSnapshot: true,
		},
	},
} satisfies StoryObj<typeof home_>;
