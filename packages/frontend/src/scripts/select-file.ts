/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import { defaultStore } from '@/store.js';
import { uploadFile } from '@/scripts/upload.js';
import { canApplyWatermark } from '@/scripts/watermark.js';
import type { MenuItem } from '@/types/menu.js';

export function chooseFileFromPc(opts?: {
	multiple?: boolean;
	keepOriginal?: boolean;
	useWatermark?: boolean;
}): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((res, rej) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = opts?.multiple ?? false;
		input.onchange = () => {
			if (!input.files) return res([]);
			const promises = Array.from(input.files, file => uploadFile(file, defaultStore.state.uploadFolder, undefined, opts?.keepOriginal, opts?.useWatermark));

			Promise.all(promises).then(driveFiles => {
				res(driveFiles);
			}).catch(err => {
				// アップロードのエラーは uploadFile 内でハンドリングされているためアラートダイアログを出したりはしてはいけない
			});

			// 一応廃棄
			(window as any).__misskey_input_ref__ = null;
		};

		// https://qiita.com/fukasawah/items/b9dc732d95d99551013d
		// iOS Safari で正常に動かす為のおまじない
		(window as any).__misskey_input_ref__ = input;

		input.click();
	});
}

export function chooseFileFromDrive(opts?: {
	multiple?: boolean;
}): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((res, rej) => {
		os.selectDriveFile(opts?.multiple ?? false).then(files => {
			res(files);
		});
	});
}

export function chooseFileFromUrl(): Promise<Misskey.entities.DriveFile> {
	return new Promise((res, rej) => {
		os.inputText({
			title: i18n.ts.uploadFromUrl,
			type: 'url',
			placeholder: i18n.ts.uploadFromUrlDescription,
		}).then(({ canceled, result: url }) => {
			if (canceled) return;

			const marker = Math.random().toString(); // TODO: UUIDとか使う

			const connection = useStream().useChannel('main');
			connection.on('urlUploadFinished', urlResponse => {
				if (urlResponse.marker === marker) {
					res(urlResponse.file);
					connection.dispose();
				}
			});

			misskeyApi('drive/files/upload-from-url', {
				url: url,
				folderId: defaultStore.state.uploadFolder,
				marker,
			});

			os.alert({
				title: i18n.ts.uploadFromUrlRequested,
				text: i18n.ts.uploadFromUrlMayTakeTime,
			});
		});
	});
}

function select(src: HTMLElement | EventTarget | null, opts?: {
	label?: string;
	multiple?: boolean;
	dontUseWatermark?: boolean;
}): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((res, rej) => {
		const keepOriginal = ref(defaultStore.state.keepOriginalUploading);

		const watermarkCanApply = canApplyWatermark(defaultStore.state.watermarkConfig);
		const useWatermark = ref(opts?.dontUseWatermark || !watermarkCanApply ? false : defaultStore.state.useWatermark);

		const menu: MenuItem[] = [];

		if (opts?.label) {
			menu.push({
				text: opts.label,
				type: 'label',
			});
		}

		menu.push({
			type: 'switch',
			text: i18n.ts.keepOriginalUploading,
			ref: keepOriginal,
		});

		if (!opts?.dontUseWatermark) {
			menu.push({
				type: 'switch',
				text: i18n.ts.useWatermark,
				disabled: !watermarkCanApply,
				ref: useWatermark,
			});
		}

		menu.push({
			text: i18n.ts.upload,
			icon: 'ti ti-upload',
			action: () => chooseFileFromPc({
				multiple: opts?.multiple,
				keepOriginal: keepOriginal.value,
				useWatermark: useWatermark.value,
			}).then(files => res(files)),
		}, {
			text: i18n.ts.fromDrive,
			icon: 'ti ti-cloud',
			action: () => chooseFileFromDrive({ multiple: opts?.multiple }).then(files => res(files)),
		}, {
			text: i18n.ts.fromUrl,
			icon: 'ti ti-link',
			action: () => chooseFileFromUrl().then(file => res([file])),
		});

		os.popupMenu(menu, src);
	});
}

export function selectFile(src: HTMLElement | EventTarget | null, opts: {
	label?: string;
	multiple: true;
	dontUseWatermark?: boolean;
}): Promise<Misskey.entities.DriveFile[]>;
export function selectFile(src: HTMLElement | EventTarget | null, opts?: {
	label?: string;
	multiple?: false;
	dontUseWatermark?: boolean;
}): Promise<Misskey.entities.DriveFile>;
export function selectFile(src: HTMLElement | EventTarget | null, opts?: {
	label?: string;
	multiple?: boolean;
	dontUseWatermark?: boolean;
}): Promise<Misskey.entities.DriveFile | Misskey.entities.DriveFile[]> {
	return select(src, opts).then(files => {
		return opts?.multiple ? files : files[0];
	});
}
