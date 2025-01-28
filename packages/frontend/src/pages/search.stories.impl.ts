/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import search_ from './search.vue';
import { userDetailed } from '@/../.storybook/fakes.js';
import { commonHandlers } from '@/../.storybook/mocks.js';

const localUser = userDetailed('someuserid', 'miskist', null, 'Local Misskey User');

export const Default = {
	render(args) {
		return {
			components: {
				search_,
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
			template: '<search_ v-bind="props" />',
		};
	},
	args: {
		ignoreNotesSearchAvailable: true,
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/users/show', () => {
					return HttpResponse.json(userDetailed());
				}),
				http.post('/api/users/search', () => {
					return HttpResponse.json([userDetailed(), localUser]);
				}),
			],
		},
	},
} satisfies StoryObj<typeof search_>;

export const NoteSearchDisabled = {
	...Default,
	args: {},
} satisfies StoryObj<typeof search_>;

export const WithUsernameLocal = {
	...Default,

	args: {
		...Default.args,
		username: localUser.username,
		host: localUser.host,
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/users/show', () => {
					return HttpResponse.json(localUser);
				}),
				http.post('/api/users/search', () => {
					return HttpResponse.json([userDetailed(), localUser]);
				}),
			],
		},
	},
} satisfies StoryObj<typeof search_>;

export const WithUserType = {
	...Default,
	args: {
		type: 'user',
	},
} satisfies StoryObj<typeof search_>;
