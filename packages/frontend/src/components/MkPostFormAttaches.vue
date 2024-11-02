<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-show="props.modelValue.length != 0" :class="$style.root">
	<Sortable :modelValue="props.modelValue" :class="$style.files" itemKey="id" :animation="150" :delay="100" :delayOnTouchOnly="true" @update:modelValue="v => emit('update:modelValue', v)">
		<template #item="{ element }">
			<div
				:class="$style.file"
				role="button"
				tabindex="0"
				@click="showFileMenu(element, $event)"
				@keydown.space.enter="showFileMenu(element, $event)"
				@contextmenu.prevent="showFileMenu(element, $event)"
			>
				<MkDriveFileThumbnail :data-id="element.id" :class="$style.thumbnail" :file="element" fit="cover"/>
				<div v-if="element.isSensitive" :class="$style.sensitive">
					<i class="ti ti-eye-exclamation" style="margin: auto;"></i>
				</div>
			</div>
		</template>
	</Sortable>
	<p :class="$style.remain">{{ 16 - props.modelValue.length }}/16</p>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, inject } from 'vue';
import * as Misskey from 'misskey-js';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import type { MenuItem } from '@/types/menu.js';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const props = defineProps<{
	modelValue: Misskey.entities.DriveFile[];
	detachMediaFn?: (id: string) => void;
}>();

const mock = inject<boolean>('mock', false);

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.DriveFile[]): void;
	(ev: 'detach', id: string): void;
	(ev: 'changeSensitive', file: Misskey.entities.DriveFile, isSensitive: boolean): void;
	(ev: 'changeName', file: Misskey.entities.DriveFile, newName: string): void;
	(ev: 'replaceFile', file: Misskey.entities.DriveFile, newFile: Misskey.entities.DriveFile): void;
}>();

let menuShowing = false;

function detachMedia(id: string) {
	if (mock) return;

	if (props.detachMediaFn) {
		props.detachMediaFn(id);
	} else {
		emit('detach', id);
	}
}

async function detachAndDeleteMedia(file: Misskey.entities.DriveFile) {
	if (mock) return;

	detachMedia(file.id);

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.driveFileDeleteConfirm({ name: file.name }),
	});

	if (canceled) return;

	os.apiWithDialog('drive/files/delete', {
		fileId: file.id,
	});
}

function toggleSensitive(file) {
	if (mock) {
		emit('changeSensitive', file, !file.isSensitive);
		return;
	}

	misskeyApi('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	}).then(() => {
		emit('changeSensitive', file, !file.isSensitive);
	});
}

async function rename(file) {
	if (mock) return;

	const { canceled, result } = await os.inputText({
		title: i18n.ts.enterFileName,
		default: file.name,
		minLength: 1,
	});
	if (canceled) return;
	misskeyApi('drive/files/update', {
		fileId: file.id,
		name: result,
	}).then(() => {
		emit('changeName', file, result);
		file.name = result;
	});
}

async function describe(file: Misskey.entities.DriveFile) {
	if (mock) return;

	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkFileCaptionEditWindow.vue')), {
		default: file.comment !== null ? file.comment : '',
		file: file,
	}, {
		done: caption => {
			let comment = caption.length === 0 ? null : caption;
			misskeyApi('drive/files/update', {
				fileId: file.id,
				comment: comment,
			}).then(() => {
				file.comment = comment;
			});
		},
		closed: () => dispose(),
	});
}

async function crop(file: Misskey.entities.DriveFile): Promise<void> {
	if (mock) return;

	const newFile = await os.cropImage(file, { aspectRatio: NaN });
	emit('replaceFile', file, newFile);
}

function showFileMenu(file: Misskey.entities.DriveFile, ev: MouseEvent | KeyboardEvent): void {
	if (menuShowing) return;

	const isImage = file.type.startsWith('image/');

	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: i18n.ts.renameFile,
		icon: 'ti ti-forms',
		action: () => { rename(file); },
	}, {
		text: file.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
		icon: file.isSensitive ? 'ti ti-eye-exclamation' : 'ti ti-eye',
		action: () => { toggleSensitive(file); },
	}, {
		text: i18n.ts.describeFile,
		icon: 'ti ti-text-caption',
		action: () => { describe(file); },
	});

	if (isImage) {
		menuItems.push({
			text: i18n.ts.cropImage,
			icon: 'ti ti-crop',
			action: () : void => { crop(file); },
		});
	}

	menuItems.push({
		type: 'divider',
	}, {
		text: i18n.ts.attachCancel,
		icon: 'ti ti-circle-x',
		action: () => { detachMedia(file.id); },
	}, {
		text: i18n.ts.deleteFile,
		icon: 'ti ti-trash',
		danger: true,
		action: () => { detachAndDeleteMedia(file); },
	});

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target).then(() => menuShowing = false);
	menuShowing = true;
}
</script>

<style lang="scss" module>
.root {
	padding: 8px 16px;
	position: relative;
}

.files {
	display: flex;
	flex-wrap: wrap;
}

.file {
	position: relative;
	width: 64px;
	height: 64px;
	margin-right: 4px;
	border-radius: 4px;
	overflow: hidden;
	cursor: move;

	&:focus-visible {
		outline-offset: 4px;
	}
}

.thumbnail {
	width: 100%;
	height: 100%;
	z-index: 1;
	color: var(--MI_THEME-fg);
}

.sensitive {
	display: flex;
	position: absolute;
	width: 64px;
	height: 64px;
	top: 0;
	left: 0;
	z-index: 2;
	background: rgba(17, 17, 17, .7);
	color: #fff;
}

.remain {
	display: block;
	position: absolute;
	top: 8px;
	right: 8px;
	margin: 0;
	padding: 0;
	font-size: 90%;
}
</style>
