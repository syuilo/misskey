/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from '@storybook/addon-actions';
import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkAnnouncementDialog from './MkAnnouncementDialog.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAnnouncementDialog,
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
						closed: action('closed'),
					};
				},
			},
			template: '<MkAnnouncementDialog v-bind="props" v-on="events" />',
		};
	},
	args: {
		announcement: {
			id: '1',
			title: 'Title',
			text: 'Text',
			createdAt: new Date().toISOString(),
			updatedAt: null,
			icon: 'info',
			imageUrl: null,
			display: 'dialog',
			needConfirmationToRead: false,
			silence: false,
			forYou: true,
		},
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/i/read-announcement', async ({ request }) => {
					action('POST /api/i/read-announcement')(await request.json());
					return HttpResponse.json();
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkAnnouncementDialog>;
