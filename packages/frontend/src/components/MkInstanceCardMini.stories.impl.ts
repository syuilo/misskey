/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import { federationInstance } from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
import { getChartResolver } from '../../.storybook/charts.js';
import MkInstanceCardMini from './MkInstanceCardMini.vue';

export const Default = {
	render(args) {
		return {
			components: {
				MkInstanceCardMini,
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
			template: '<MkInstanceCardMini v-bind="props" />',
		};
	},
	args: {
		instance: federationInstance(),
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.get('/undefined/preview.webp', async ({ request }) => {
					const urlStr = new URL(request.url).searchParams.get('url');
					if (urlStr == null) {
						return new HttpResponse(null, { status: 404 });
					}
					const url = new URL(urlStr);

					if (url.href.startsWith('https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/')) {
						const image = await (await fetch(`client-assets/${url.pathname.split('/').pop()}`)).blob();
						return new HttpResponse(image, {
							headers: {
								'Content-Type': 'image/jpeg',
							},
						});
					} else {
						return new HttpResponse(null, { status: 404 });
					}
				}),
				http.get('/api/charts/instance', getChartResolver(['requests.received'])),
			],
		},
	},
} satisfies StoryObj<typeof MkInstanceCardMini>;
