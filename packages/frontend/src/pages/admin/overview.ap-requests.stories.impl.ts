/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import { http, HttpResponse } from 'msw';
import { action } from '@storybook/addon-actions';
import { commonHandlers } from '../../../.storybook/mocks.js';
import overview_ap_requests from './overview.ap-requests.vue';
export const Default = {
	render(args) {
		return {
			components: {
				overview_ap_requests,
			},
			setup() {
				return {
					args,
				};
			},
			template: '<overview_ap_requests />',
		};
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/charts/ap-request', async ({ request }) => {
					action('POST /api/charts/ap-request')(await request.json());
					return HttpResponse.json({
						deliverFailed: [0, 0, 0, 2, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 1, 0, 0, 0, 3, 1, 1, 2, 0, 0],
						deliverSucceeded: [0, 1, 51, 34, 136, 189, 51, 17, 17, 34, 1, 17, 18, 51, 34, 68, 287, 0, 17, 33, 32, 96, 96, 0, 49, 64, 0, 32, 0, 32, 81, 48, 65, 1, 16, 50, 90, 148, 33, 43, 72, 127, 17, 138, 78, 91, 78, 91, 13, 52],
						inboxReceived: [507, 1173, 1096, 871, 958, 937, 908, 1026, 956, 909, 807, 1002, 832, 995, 1039, 1047, 1109, 930, 711, 835, 764, 679, 835, 958, 634, 654, 691, 895, 811, 676, 1044, 1389, 1318, 863, 887, 952, 1011, 1061, 592, 900, 611, 595, 604, 562, 607, 621, 854, 666, 1197, 644],
					});
				}),
			],
		},
	},
} satisfies StoryObj<typeof overview_ap_requests>;
