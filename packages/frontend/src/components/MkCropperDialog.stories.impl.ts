/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import { action } from '@storybook/addon-actions';
import { file } from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkCropperDialog from './MkCropperDialog.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkCropperDialog,
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
						'ok': action('ok'),
						'cancel': action('cancel'),
						'closed': action('closed'),
					};
				},
			},
			template: '<MkCropperDialog v-bind="props" v-on="events" />',
		};
	},
	args: {
		file: file(),
		aspectRatio: NaN,
	},
	parameters: {
		chromatic: {
			// NOTE: ロードが終わるまで待つ
			delay: 3000,
		},
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.get('/proxy/image.webp', async ({ request }) => {
					const url = new URL(request.url).searchParams.get('url');
					if (url === 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true') {
						const image = await (await fetch('client-assets/fedi.jpg')).blob();
						return new HttpResponse(image, {
							headers: {
								'Content-Type': 'image/jpeg',
							},
						});
					} else {
						return new HttpResponse(null, { status: 404 });
					}
				}),
				http.post('/api/drive/files/create', async ({ request }) => {
					action('POST /api/drive/files/create')(await request.formData());
					return HttpResponse.json(file());
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkCropperDialog>;
