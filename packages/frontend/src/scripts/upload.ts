/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import { readAndCompressImage } from '@misskey-dev/browser-image-resizer';
import { getCompressionConfig } from './upload/compress-config.js';
import { defaultStore } from '@/store.js';
import { apiUrl } from '@@/js/config.js';
import { $i } from '@/account.js';
import { alert } from '@/os.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { canApplyWatermark, getWatermarkAppliedImage } from '@/scripts/watermark.js';

type Uploading = {
	id: string;
	name: string;
	progressMax: number | undefined;
	progressValue: number | undefined;
	img: string;
};
export const uploads = ref<Uploading[]>([]);

const mimeTypeMap = {
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/png': 'png',
} as const;

export function uploadFile(
	file: File,
	folder?: string | null | Misskey.entities.DriveFolder,
	name?: string,
	keepOriginal: boolean = defaultStore.state.keepOriginalUploading,
	watermark: boolean = defaultStore.state.useWatermark,
): Promise<Misskey.entities.DriveFile> {
	if ($i == null) throw new Error('Not logged in');

	const _folder = typeof folder === 'string' ? folder : folder?.id;

	if (file.size > instance.maxFileSize) {
		alert({
			type: 'error',
			title: i18n.ts.failedToUpload,
			text: i18n.ts.cannotUploadBecauseExceedsFileSizeLimit,
		});
		return Promise.reject();
	}

	return new Promise((resolve, reject) => {
		const id = uuid();

		const reader = new FileReader();
		reader.onload = async (): Promise<void> => {
			const filename = name ?? file.name ?? 'untitled';
			const extension = filename.split('.').length > 1 ? '.' + filename.split('.').pop() : '';

			const ctx = reactive<Uploading>({
				id,
				name: defaultStore.state.keepOriginalFilename ? filename : id + extension,
				progressMax: undefined,
				progressValue: undefined,
				img: window.URL.createObjectURL(file),
			});

			uploads.value.push(ctx);

			let _file: Blob = file;

			if (_file.type.startsWith('image/') && watermark && canApplyWatermark(defaultStore.state.watermarkConfig)) {
				_file = await getWatermarkAppliedImage(_file, defaultStore.state.watermarkConfig);
			}

			const config = !keepOriginal ? await getCompressionConfig(_file) : undefined;
			if (config) {
				try {
					const resized = await readAndCompressImage(_file, config);
					if (resized.size < _file.size || _file.type === 'image/webp') {
						// The compression may not always reduce the file size
						// (and WebP is not browser safe yet)
						_file = resized;
					}
					if (_DEV_) {
						const saved = ((1 - resized.size / _file.size) * 100).toFixed(2);
						console.log(`Image compression: before ${_file.size} bytes, after ${resized.size} bytes, saved ${saved}%`);
					}

					ctx.name = _file.type !== config.mimeType ? `${ctx.name}.${mimeTypeMap[config.mimeType]}` : ctx.name;
				} catch (err) {
					console.error('Failed to resize image', err);
				}
			}

			const formData = new FormData();
			formData.append('i', $i!.token);
			formData.append('force', 'true');
			formData.append('file', _file);
			formData.append('name', ctx.name);
			if (_folder) formData.append('folderId', _folder);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', apiUrl + '/drive/files/create', true);
			xhr.onload = ((ev: ProgressEvent<XMLHttpRequest>) => {
				if (xhr.status !== 200 || ev.target == null || ev.target.response == null) {
					// TODO: 消すのではなくて(ネットワーク的なエラーなら)再送できるようにしたい
					uploads.value = uploads.value.filter(x => x.id !== id);

					if (xhr.status === 413) {
						alert({
							type: 'error',
							title: i18n.ts.failedToUpload,
							text: i18n.ts.cannotUploadBecauseExceedsFileSizeLimit,
						});
					} else if (ev.target?.response) {
						const res = JSON.parse(ev.target.response);
						if (res.error?.id === 'bec5bd69-fba3-43c9-b4fb-2894b66ad5d2') {
							alert({
								type: 'error',
								title: i18n.ts.failedToUpload,
								text: i18n.ts.cannotUploadBecauseInappropriate,
							});
						} else if (res.error?.id === 'd08dbc37-a6a9-463a-8c47-96c32ab5f064') {
							alert({
								type: 'error',
								title: i18n.ts.failedToUpload,
								text: i18n.ts.cannotUploadBecauseNoFreeSpace,
							});
						} else {
							alert({
								type: 'error',
								title: i18n.ts.failedToUpload,
								text: `${res.error?.message}\n${res.error?.code}\n${res.error?.id}`,
							});
						}
					} else {
						alert({
							type: 'error',
							title: 'Failed to upload',
							text: `${JSON.stringify(ev.target?.response)}, ${JSON.stringify(xhr.response)}`,
						});
					}

					reject();
					return;
				}

				const driveFile = JSON.parse(ev.target.response);

				resolve(driveFile);

				uploads.value = uploads.value.filter(x => x.id !== id);
			}) as (ev: ProgressEvent<EventTarget>) => any;

			xhr.upload.onprogress = ev => {
				if (ev.lengthComputable) {
					ctx.progressMax = ev.total;
					ctx.progressValue = ev.loaded;
				}
			};

			xhr.send(formData);
		};
		reader.readAsArrayBuffer(file);
	});
}
