/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { delay, http, HttpResponse } from 'msw';
import { StoryObj } from '@storybook/vue3';
import { entities } from 'misskey-js';
import { commonHandlers } from '../../../.storybook/mocks.js';
import { emoji } from '../../../.storybook/fakes.js';
import { fakeId } from '../../../.storybook/fake-utils.js';
import custom_emojis_manager2 from './custom-emojis-manager2.vue';

function createRender(params: {
	emojis: entities.EmojiDetailedAdmin[];
}) {
	const storedEmojis: entities.EmojiDetailedAdmin[] = [...params.emojis];
	const storedDriveFiles: entities.DriveFile[] = [];

	return {
		render(args) {
			return {
				components: {
					custom_emojis_manager2,
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
				template: '<custom_emojis_manager2 v-bind="props" />',
			};
		},
		args: {

		},
		parameters: {
			layout: 'fullscreen',
			msw: {
				handlers: [
					...commonHandlers,
					http.post('/api/v2/admin/emoji/list', async ({ request }) => {
						await delay(100);

						const bodyStream = request.body as ReadableStream;
						const body = await new Response(bodyStream).json() as entities.V2AdminEmojiListRequest;

						const emojis = storedEmojis;
						const limit = body.limit ?? 10;
						const page = body.page ?? 1;
						const result = emojis.slice((page - 1) * limit, page * limit);

						return HttpResponse.json({
							emojis: result,
							count: Math.min(emojis.length, limit),
							allCount: emojis.length,
							allPages: Math.ceil(emojis.length / limit),
						});
					}),
					http.post('/api/drive/folders', () => {
						return HttpResponse.json([]);
					}),
					http.post('/api/drive/files', () => {
						return HttpResponse.json(storedDriveFiles);
					}),
					http.post('/api/drive/files/create', async ({ request }) => {
						const data = await request.formData();
						const file = data.get('file');
						if (!file || !(file instanceof File)) {
							return HttpResponse.json({ error: 'file is required' }, {
								status: 400,
							});
						}

						// FIXME: ファイルのバイナリに0xEF 0xBF 0xBDが混入してしまい、うまく画像ファイルとして表示できない問題がある
						const base64 = await new Promise<string>((resolve) => {
							const reader = new FileReader();
							reader.onload = () => {
								resolve(reader.result as string);
							};
							reader.readAsDataURL(new Blob([file], { type: 'image/webp' }));
						});

						const driveFile: entities.DriveFile = {
							id: fakeId(file.name),
							createdAt: new Date().toISOString(),
							name: file.name,
							type: file.type,
							md5: '',
							size: file.size,
							isSensitive: false,
							blurhash: null,
							properties: {},
							url: base64,
							thumbnailUrl: null,
							comment: null,
							folderId: null,
							folder: null,
							userId: null,
							user: null,
						};

						storedDriveFiles.push(driveFile);

						return HttpResponse.json(driveFile);
					}),
					http.post('api/admin/emoji/add', async ({ request }) => {
						await delay(100);

						const bodyStream = request.body as ReadableStream;
						const body = await new Response(bodyStream).json() as entities.AdminEmojiAddRequest;

						const fileId = body.fileId;
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const file = storedDriveFiles.find(f => f.id === fileId)!;

						const em = emoji({
							id: fakeId(file.name),
							name: body.name,
							publicUrl: file.url,
							originalUrl: file.url,
							type: file.type,
							aliases: body.aliases,
							category: body.category ?? undefined,
							license: body.license ?? undefined,
							localOnly: body.localOnly,
							isSensitive: body.isSensitive,
						});
						storedEmojis.push(em);

						return HttpResponse.json(null);
					}),
				],
			},
		},
	} satisfies StoryObj<typeof custom_emojis_manager2>;
}

export const Default = createRender({
	emojis: [],
});

export const List10 = createRender({
	emojis: Array.from({ length: 10 }, (_, i) => emoji({ name: `emoji_${i}` }, i.toString())),
});

export const List100 = createRender({
	emojis: Array.from({ length: 100 }, (_, i) => emoji({ name: `emoji_${i}` }, i.toString())),
});

export const List1000 = createRender({
	emojis: Array.from({ length: 1000 }, (_, i) => emoji({ name: `emoji_${i}` }, i.toString())),
});
