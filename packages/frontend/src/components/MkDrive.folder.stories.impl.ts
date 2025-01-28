/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { action } from '@storybook/addon-actions';
import type { StoryObj } from '@storybook/vue3';
import { http, HttpResponse } from 'msw';
import * as Misskey from 'misskey-js';
import MkDrive_folder from './MkDrive.folder.vue';
import { folder } from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
export const Default = {
	render(args) {
		return {
			components: {
				MkDrive_folder,
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
						chosen: action('chosen'),
						move: action('move'),
						upload: action('upload'),
						removeFile: action('removeFile'),
						removeFolder: action('removeFolder'),
						dragstart: action('dragstart'),
						dragend: action('dragend'),
					};
				},
			},
			template: '<MkDrive_folder v-bind="props" v-on="events" />',
		};
	},
	args: {
		folder: folder(),
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/drive/folders/delete', async ({ request }) => {
					action('POST /api/drive/folders/delete')(await request.json());
					return HttpResponse.json(undefined, { status: 204 });
				}),
				http.post('/api/drive/folders/update', async ({ request }) => {
					const req = await request.json() as Misskey.entities.DriveFoldersUpdateRequest;
					action('POST /api/drive/folders/update')(req);
					return HttpResponse.json({
						...folder(),
						id: req.folderId,
						name: req.name ?? folder().name,
						parentId: req.parentId ?? folder().parentId,
					});
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkDrive_folder>;
