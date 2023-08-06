<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.draghover]: draghover }]"
	@click="onClick"
	@dragover.prevent.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<i v-if="folder == null" class="ti ti-cloud" style="margin-right: 4px;"></i>
	<span>{{ folder == null ? i18n.ts.drive : folder.name }}</span>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	folder?: Misskey.entities.DriveFolder;
	parentFolder: Misskey.entities.DriveFolder | null;
}>();

const emit = defineEmits<{
	(ev: 'move', v?: Misskey.entities.DriveFolder): void;
	(ev: 'upload', file: File, folder?: Misskey.entities.DriveFolder | null): void;
	(ev: 'removeFile', v: Misskey.entities.DriveFile['id']): void;
	(ev: 'removeFolder', v: Misskey.entities.DriveFolder['id']): void;
}>();

const hover = ref(false);
const draghover = ref(false);

function onClick() {
	emit('move', props.folder);
}

function onMouseover() {
	hover.value = true;
}

function onMouseout() {
	hover.value = false;
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	// このフォルダがルートかつカレントディレクトリならドロップ禁止
	if (props.folder == null && props.parentFolder == null) {
		ev.dataTransfer.dropEffect = 'none';
	}

	const isFile = ev.dataTransfer.items[0].kind === 'file';
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;
	const isDriveFolder = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FOLDER_;

	if (isFile || isDriveFile || isDriveFolder) {
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	} else {
		ev.dataTransfer.dropEffect = 'none';
	}

	return false;
}

function onDragenter() {
	if (props.folder || props.parentFolder) draghover.value = true;
}

function onDragleave() {
	if (props.folder || props.parentFolder) draghover.value = false;
}

function onDrop(ev: DragEvent) {
	draghover.value = false;

	if (!ev.dataTransfer) return;

	// ファイルだったら
	if (ev.dataTransfer.files.length > 0) {
		for (const file of Array.from(ev.dataTransfer.files)) {
			emit('upload', file, props.folder);
		}
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== '') {
		const file = JSON.parse(driveFile);
		emit('removeFile', file.id);
		os.api('drive/files/update', {
			fileId: file.id,
			folderId: props.folder ? props.folder.id : null,
		});
	}
	//#endregion

	//#region ドライブのフォルダ
	const driveFolder = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FOLDER_);
	if (driveFolder != null && driveFolder !== '') {
		const folder = JSON.parse(driveFolder);
		// 移動先が自分自身ならreject
		if (props.folder && folder.id === props.folder.id) return;
		emit('removeFolder', folder.id);
		os.api('drive/folders/update', {
			folderId: folder.id,
			parentId: props.folder ? props.folder.id : null,
		});
	}
	//#endregion
}
</script>

<style lang="scss" module>
.root {
	&.draghover {
		background: #eee;
	}
}
</style>
