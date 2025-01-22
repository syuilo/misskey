/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/no-default-export */

import { Meta } from '@storybook/vue3';
const meta = {
	title: 'components/MkNote',
	component: MkNote,
} satisfies Meta<typeof MkNote>;
export default meta;
import { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import {
	note,
	channelNote,
	quotedNote,
	renotedNote,
	remoteNote,
	renotedFromChannelnote, renotedToChannel, renotedToChannelFromChannel,
} from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkNote from '@/components/MkNote.vue';

export const Default = {
	render(args) {
		return {
			components: {
				MkNote,
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
			template: '<MkNote v-bind="props" />',
		};
	},
	args: {
		note: note(),
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

					if (
						url.href.startsWith('https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/')
					) {
						const image = await(await fetch(`client-assets/${url.pathname.split('/').pop()}`)).blob();
						return new HttpResponse(image, {
							headers: {
								'Content-Type': 'image/jpeg',
							},
						});
					} else {
						return new HttpResponse(null, { status: 404 });
					}
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkNote>;

export const Channel = {
	...Default,
	args: {
		note: channelNote(),
	},
};

export const Quoted = {
	...Default,
	args: {
		note: quotedNote(),
	},
};

export const Renoted = {
	...Default,
	args: {
		note: renotedNote(),
	},
};

export const RemoteNote = {
	...Default,
	args: {
		note: remoteNote(),
	},
};

export const Renote_RemoteNote = {
	...Default,
	args: {
		note: {
			...note(),
			renote: remoteNote(),
			text: null,
		},
	},
};

export const RemoteuserRenoteNote = {
	...Default,
	args: {
		note: {
			...remoteNote(),
			renote: note(),
			text: null,
		},
	},
};

export const RenotedFromChannel = {
	...Default,
	args: {
		note: renotedFromChannelnote(),
	},
};

export const RenotedToChannel = {
	...Default,
	args: {
		note: renotedToChannel(),
	},
};

export const RenotedToChannelFromChannel = {
	...Default,
	args: {
		note: renotedToChannelFromChannel(),
	},
};

