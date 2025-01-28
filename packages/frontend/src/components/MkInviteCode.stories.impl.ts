/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import { userDetailed, inviteCode } from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkInviteCode from './MkInviteCode.vue';

export const Default = {
	render(args) {
		return {
			components: {
				MkInviteCode,
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
			template: '<MkInviteCode v-bind="props" />',
		};
	},
	args: {
		invite: inviteCode() as any,
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/users/show', ({ params }) => {
					return HttpResponse.json(userDetailed(params.userId as string));
				}),
			],
		},
	},
	decorators: [() => ({
		template: '<div style="width:100cqmin"><story/></div>',
	})],
} satisfies StoryObj<typeof MkInviteCode>;

export const Used = {
	...Default,
	args: {
		invite: inviteCode(true) as any,
	},
} satisfies StoryObj<typeof MkInviteCode>;

export const Expired = {
	...Default,
	args: {
		invite: inviteCode(false, true, true) as any,
	},
} satisfies StoryObj<typeof MkInviteCode>;
