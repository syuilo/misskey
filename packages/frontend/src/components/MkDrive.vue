<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<nav :class="$style.nav">
		<div :class="$style.navPath" @contextmenu.prevent.stop="() => {}">
			<XNavFolder
				:class="[$style.navPathItem, { [$style.navCurrent]: folder == null }]"
				:parentFolder="folder"
				@move="move"
				@upload="upload"
				@removeFile="removeFile"
				@removeFolder="removeFolder"
			/>
			<template v-for="f in hierarchyFolders">
				<span :class="[$style.navPathItem, $style.navSeparator]"><i class="ti ti-chevron-right"></i></span>
				<XNavFolder
					:folder="f"
					:parentFolder="folder"
					:class="[$style.navPathItem]"
					@move="move"
					@upload="upload"
					@removeFile="removeFile"
					@removeFolder="removeFolder"
				/>
			</template>
			<span v-if="folder != null" :class="[$style.navPathItem, $style.navSeparator]"><i class="ti ti-chevron-right"></i></span>
			<span v-if="folder != null" :class="[$style.navPathItem, $style.navCurrent]">{{ folder.name }}</span>
		</div>
		<button class="_button" :class="$style.navMenu" @click="showMenu"><i class="ti ti-dots"></i></button>
	</nav>
	<div
		ref="main"
		:class="[$style.main, { [$style.uploading]: uploadings.length > 0, [$style.fetching]: fetching }]"
		@dragover.prevent.stop="onDragover"
		@dragenter="onDragenter"
		@dragleave="onDragleave"
		@drop.prevent.stop="onDrop"
		@contextmenu.stop="onContextmenu"
	>
		<div ref="contents">
			<div v-show="folders.length > 0" ref="foldersContainer" :class="$style.folders">
				<XFolder
					v-for="(f, i) in folders"
					:key="f.id"
					v-anim="i"
					:class="$style.folder"
					:folder="f"
					:selectMode="select === 'folder'"
					:isSelected="selectedFolders.some(x => x.id === f.id)"
					@chosen="chooseFolder"
					@unchose="unchoseFolder"
					@move="move"
					@upload="upload"
					@removeFile="removeFile"
					@removeFolder="removeFolder"
					@dragstart="isDragSource = true"
					@dragend="isDragSource = false"
				/>
				<!-- SEE: https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid -->
				<div v-for="(n, i) in 16" :key="i" :class="$style.padding"></div>
				<MkButton v-if="moreFolders" ref="moreFolders" @click="fetchMoreFolders">{{ i18n.ts.loadMore }}</MkButton>
			</div>
			<div v-show="files.length > 0" ref="filesContainer" :class="$style.files">
				<XFile
					v-for="(file, i) in files"
					:key="file.id"
					v-anim="i"
					:class="$style.file"
					:file="file"
					:folder="folder"
					:selectMode="select === 'file'"
					:isSelected="selectedFiles.some(x => x.id === file.id)"
					@chosen="chooseFile"
					@dragstart="isDragSource = true"
					@dragend="isDragSource = false"
				/>
				<!-- SEE: https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid -->
				<div v-for="(n, i) in 16" :key="i" :class="$style.padding"></div>
				<MkButton v-show="moreFiles" ref="loadMoreFiles" @click="fetchMoreFiles">{{ i18n.ts.loadMore }}</MkButton>
			</div>
			<div v-if="files.length == 0 && folders.length == 0 && !fetching" :class="$style.empty">
				<div v-if="draghover">{{ i18n.ts['empty-draghover'] }}</div>
				<div v-if="!draghover && folder == null"><strong>{{ i18n.ts.emptyDrive }}</strong><br/>{{ i18n.ts['empty-drive-description'] }}</div>
				<div v-if="!draghover && folder != null">{{ i18n.ts.emptyFolder }}</div>
			</div>
		</div>
		<MkLoading v-if="fetching"/>
	</div>
	<div v-if="draghover" :class="$style.dropzone"></div>
	<input ref="fileInput" style="display: none;" type="file" accept="*/*" multiple tabindex="-1" @change="onChangeFileInput"/>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onActivated, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from './MkButton.vue';
import type { MenuItem } from '@/types/menu.js';
import XNavFolder from '@/components/MkDrive.navFolder.vue';
import XFolder from '@/components/MkDrive.folder.vue';
import XFile from '@/components/MkDrive.file.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useStream } from '@/stream.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { uploadFile, uploads } from '@/scripts/upload.js';
import { claimAchievement } from '@/scripts/achievements.js';

const props = withDefaults(defineProps<{
	initialFolder?: Misskey.entities.DriveFolder;
	type?: string;
	multiple?: boolean;
	select?: 'file' | 'folder' | null;
}>(), {
	multiple: false,
	select: null,
});

const emit = defineEmits<{
	(ev: 'selected', v: Misskey.entities.DriveFile | Misskey.entities.DriveFolder): void;
	(ev: 'change-selection', v: Misskey.entities.DriveFile[] | Misskey.entities.DriveFolder[]): void;
	(ev: 'move-root'): void;
	(ev: 'cd', v: Misskey.entities.DriveFolder | null): void;
	(ev: 'open-folder', v: Misskey.entities.DriveFolder): void;
}>();

const loadMoreFiles = shallowRef<InstanceType<typeof MkButton>>();
const fileInput = shallowRef<HTMLInputElement>();

const folder = ref<Misskey.entities.DriveFolder | null>(null);
const files = ref<Misskey.entities.DriveFile[]>([]);
const folders = ref<Misskey.entities.DriveFolder[]>([]);
const moreFiles = ref(false);
const moreFolders = ref(false);
const hierarchyFolders = ref<Misskey.entities.DriveFolder[]>([]);
const selectedFiles = ref<Misskey.entities.DriveFile[]>([]);
const selectedFolders = ref<Misskey.entities.DriveFolder[]>([]);
const uploadings = uploads;
const connection = useStream().useChannel('drive');
const keepOriginal = ref<boolean>(defaultStore.state.keepOriginalUploading); // 外部渡しが多いので$refは使わないほうがよい

// ドロップされようとしているか
const draghover = ref(false);

// 自身の所有するアイテムがドラッグをスタートさせたか
// (自分自身の階層にドロップできないようにするためのフラグ)
const isDragSource = ref(false);

const fetching = ref(true);

const ilFilesObserver = new IntersectionObserver(
	(entries) => entries.some((entry) => entry.isIntersecting) && !fetching.value && moreFiles.value && fetchMoreFiles(),
);

const sortModeSelect = ref<NonNullable<Misskey.entities.DriveFilesRequest['sort']>>('+createdAt');

watch(folder, () => emit('cd', folder.value));
watch(sortModeSelect, () => {
	fetch();
});

function onStreamDriveFileCreated(file: Misskey.entities.DriveFile) {
	addFile(file, true);
}

function onStreamDriveFileUpdated(file: Misskey.entities.DriveFile) {
	const current = folder.value ? folder.value.id : null;
	if (current !== file.folderId) {
		removeFile(file);
	} else {
		addFile(file, true);
	}
}

function onStreamDriveFileDeleted(fileId: string) {
	removeFile(fileId);
}

function onStreamDriveFolderCreated(createdFolder: Misskey.entities.DriveFolder) {
	addFolder(createdFolder, true);
}

function onStreamDriveFolderUpdated(updatedFolder: Misskey.entities.DriveFolder) {
	const current = folder.value ? folder.value.id : null;
	if (current !== updatedFolder.parentId) {
		removeFolder(updatedFolder);
	} else {
		addFolder(updatedFolder, true);
	}
}

function onStreamDriveFolderDeleted(folderId: string) {
	removeFolder(folderId);
}

function onDragover(ev: DragEvent) {
	if (!ev.dataTransfer) return;

	// ドラッグ元が自分自身の所有するアイテムだったら
	if (isDragSource.value) {
		// 自分自身にはドロップさせない
		ev.dataTransfer.dropEffect = 'none';
		return;
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
	if (!isDragSource.value) draghover.value = true;
}

function onDragleave() {
	draghover.value = false;
}

function onDrop(ev: DragEvent) {
	draghover.value = false;

	if (!ev.dataTransfer) return;

	// ドロップされてきたものがファイルだったら
	if (ev.dataTransfer.files.length > 0) {
		for (const file of Array.from(ev.dataTransfer.files)) {
			upload(file, folder.value);
		}
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== '') {
		const file = JSON.parse(driveFile);
		if (files.value.some(f => f.id === file.id)) return;
		removeFile(file.id);
		misskeyApi('drive/files/update', {
			fileId: file.id,
			folderId: folder.value ? folder.value.id : null,
		});
	}
	//#endregion

	//#region ドライブのフォルダ
	const driveFolder = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FOLDER_);
	if (driveFolder != null && driveFolder !== '') {
		const droppedFolder = JSON.parse(driveFolder);

		// 移動先が自分自身ならreject
		if (folder.value && droppedFolder.id === folder.value.id) return false;
		if (folders.value.some(f => f.id === droppedFolder.id)) return false;
		removeFolder(droppedFolder.id);
		misskeyApi('drive/folders/update', {
			folderId: droppedFolder.id,
			parentId: folder.value ? folder.value.id : null,
		}).then(() => {
			// noop
		}).catch(err => {
			switch (err.code) {
				case 'RECURSIVE_NESTING':
					claimAchievement('driveFolderCircularReference');
					os.alert({
						type: 'error',
						title: i18n.ts.unableToProcess,
						text: i18n.ts.circularReferenceFolder,
					});
					break;
				default:
					os.alert({
						type: 'error',
						text: i18n.ts.somethingHappened,
					});
			}
		});
	}
	//#endregion
}

function selectLocalFile() {
	fileInput.value?.click();
}

function urlUpload() {
	os.inputText({
		title: i18n.ts.uploadFromUrl,
		type: 'url',
		placeholder: i18n.ts.uploadFromUrlDescription,
	}).then(({ canceled, result: url }) => {
		if (canceled || !url) return;
		misskeyApi('drive/files/upload-from-url', {
			url: url,
			folderId: folder.value ? folder.value.id : undefined,
		});

		os.alert({
			title: i18n.ts.uploadFromUrlRequested,
			text: i18n.ts.uploadFromUrlMayTakeTime,
		});
	});
}

function createFolder() {
	os.inputText({
		title: i18n.ts.createFolder,
		placeholder: i18n.ts.folderName,
	}).then(({ canceled, result: name }) => {
		if (canceled || name == null) return;
		misskeyApi('drive/folders/create', {
			name: name,
			parentId: folder.value ? folder.value.id : undefined,
		}).then(createdFolder => {
			addFolder(createdFolder, true);
		});
	});
}

function renameFolder(folderToRename: Misskey.entities.DriveFolder) {
	os.inputText({
		title: i18n.ts.renameFolder,
		placeholder: i18n.ts.inputNewFolderName,
		default: folderToRename.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		misskeyApi('drive/folders/update', {
			folderId: folderToRename.id,
			name: name,
		}).then(updatedFolder => {
			// FIXME: 画面を更新するために自分自身に移動
			move(updatedFolder);
		});
	});
}

function deleteFolder(folderToDelete: Misskey.entities.DriveFolder) {
	misskeyApi('drive/folders/delete', {
		folderId: folderToDelete.id,
	}).then(() => {
		// 削除時に親フォルダに移動
		move(folderToDelete.parentId);
	}).catch(err => {
		switch (err.id) {
			case 'b0fc8a17-963c-405d-bfbc-859a487295e1':
				os.alert({
					type: 'error',
					title: i18n.ts.unableToDelete,
					text: i18n.ts.hasChildFilesOrFolders,
				});
				break;
			default:
				os.alert({
					type: 'error',
					text: i18n.ts.unableToDelete,
				});
		}
	});
}

function onChangeFileInput() {
	if (!fileInput.value?.files) return;
	for (const file of Array.from(fileInput.value.files)) {
		upload(file, folder.value);
	}
}

function upload(file: File, folderToUpload?: Misskey.entities.DriveFolder | null) {
	uploadFile(file, (folderToUpload && typeof folderToUpload === 'object') ? folderToUpload.id : null, undefined, keepOriginal.value).then(res => {
		addFile(res, true);
	});
}

function chooseFile(file: Misskey.entities.DriveFile) {
	const isAlreadySelected = selectedFiles.value.some(f => f.id === file.id);
	if (props.multiple) {
		if (isAlreadySelected) {
			selectedFiles.value = selectedFiles.value.filter(f => f.id !== file.id);
		} else {
			selectedFiles.value.push(file);
		}
		emit('change-selection', selectedFiles.value);
	} else {
		if (isAlreadySelected) {
			emit('selected', file);
		} else {
			selectedFiles.value = [file];
			emit('change-selection', [file]);
		}
	}
}

function chooseFolder(folderToChoose: Misskey.entities.DriveFolder) {
	const isAlreadySelected = selectedFolders.value.some(f => f.id === folderToChoose.id);
	if (props.multiple) {
		if (isAlreadySelected) {
			selectedFolders.value = selectedFolders.value.filter(f => f.id !== folderToChoose.id);
		} else {
			selectedFolders.value.push(folderToChoose);
		}
		emit('change-selection', selectedFolders.value);
	} else {
		if (isAlreadySelected) {
			emit('selected', folderToChoose);
		} else {
			selectedFolders.value = [folderToChoose];
			emit('change-selection', [folderToChoose]);
		}
	}
}

function unchoseFolder(folderToUnchose: Misskey.entities.DriveFolder) {
	selectedFolders.value = selectedFolders.value.filter(f => f.id !== folderToUnchose.id);
	emit('change-selection', selectedFolders.value);
}

function move(target?: Misskey.entities.DriveFolder | Misskey.entities.DriveFolder['id' | 'parentId']) {
	if (!target) {
		goRoot();
		return;
	} else if (typeof target === 'object') {
		target = target.id;
	}

	fetching.value = true;

	misskeyApi('drive/folders/show', {
		folderId: target,
	}).then(folderToMove => {
		folder.value = folderToMove;
		hierarchyFolders.value = [];

		const dive = folderToDive => {
			hierarchyFolders.value.unshift(folderToDive);
			if (folderToDive.parent) dive(folderToDive.parent);
		};

		if (folderToMove.parent) dive(folderToMove.parent);

		emit('open-folder', folderToMove);
		fetch();
	});
}

function addFolder(folderToAdd: Misskey.entities.DriveFolder, unshift = false) {
	const current = folder.value ? folder.value.id : null;
	if (current !== folderToAdd.parentId) return;

	if (folders.value.some(f => f.id === folderToAdd.id)) {
		const exist = folders.value.map(f => f.id).indexOf(folderToAdd.id);
		folders.value[exist] = folderToAdd;
		return;
	}

	if (unshift) {
		folders.value.unshift(folderToAdd);
	} else {
		folders.value.push(folderToAdd);
	}
}

function addFile(fileToAdd: Misskey.entities.DriveFile, unshift = false) {
	const current = folder.value ? folder.value.id : null;
	if (current !== fileToAdd.folderId) return;

	if (files.value.some(f => f.id === fileToAdd.id)) {
		const exist = files.value.map(f => f.id).indexOf(fileToAdd.id);
		files.value[exist] = fileToAdd;
		return;
	}

	if (unshift) {
		files.value.unshift(fileToAdd);
	} else {
		files.value.push(fileToAdd);
	}
}

function removeFolder(folderToRemove: Misskey.entities.DriveFolder | string) {
	const folderIdToRemove = typeof folderToRemove === 'object' ? folderToRemove.id : folderToRemove;
	folders.value = folders.value.filter(f => f.id !== folderIdToRemove);
}

function removeFile(file: Misskey.entities.DriveFile | string) {
	const fileId = typeof file === 'object' ? file.id : file;
	files.value = files.value.filter(f => f.id !== fileId);
}

function appendFile(file: Misskey.entities.DriveFile) {
	addFile(file);
}

function appendFolder(folderToAppend: Misskey.entities.DriveFolder) {
	addFolder(folderToAppend);
}

/*
function prependFile(file: Misskey.entities.DriveFile) {
	addFile(file, true);
}

function prependFolder(folderToPrepend: Misskey.entities.DriveFolder) {
	addFolder(folderToPrepend, true);
}
*/
function goRoot() {
	// 既にrootにいるなら何もしない
	if (folder.value == null) return;

	folder.value = null;
	hierarchyFolders.value = [];
	emit('move-root');
	fetch();
}

async function fetch() {
	folders.value = [];
	files.value = [];
	moreFolders.value = false;
	moreFiles.value = false;
	fetching.value = true;

	const foldersMax = 30;
	const filesMax = 30;

	const foldersPromise = misskeyApi('drive/folders', {
		folderId: folder.value ? folder.value.id : null,
		limit: foldersMax + 1,
	}).then(fetchedFolders => {
		if (fetchedFolders.length === foldersMax + 1) {
			moreFolders.value = true;
			fetchedFolders.pop();
		}
		return fetchedFolders;
	});

	const filesPromise = misskeyApi('drive/files', {
		folderId: folder.value ? folder.value.id : null,
		type: props.type,
		limit: filesMax + 1,
		sort: sortModeSelect.value,
	}).then(fetchedFiles => {
		if (fetchedFiles.length === filesMax + 1) {
			moreFiles.value = true;
			fetchedFiles.pop();
		}
		return fetchedFiles;
	});

	const [fetchedFolders, fetchedFiles] = await Promise.all([foldersPromise, filesPromise]);

	for (const x of fetchedFolders) appendFolder(x);
	for (const x of fetchedFiles) appendFile(x);

	fetching.value = false;
}

function fetchMoreFolders() {
	fetching.value = true;

	const max = 30;

	misskeyApi('drive/folders', {
		folderId: folder.value ? folder.value.id : null,
		type: props.type,
		untilId: folders.value.at(-1)?.id,
		limit: max + 1,
	}).then(folders => {
		if (folders.length === max + 1) {
			moreFolders.value = true;
			folders.pop();
		} else {
			moreFolders.value = false;
		}
		for (const x of folders) appendFolder(x);
		fetching.value = false;
	});
}

function fetchMoreFiles() {
	fetching.value = true;

	const max = 30;

	// ファイル一覧取得
	misskeyApi('drive/files', {
		folderId: folder.value ? folder.value.id : null,
		type: props.type,
		untilId: files.value.at(-1)?.id,
		limit: max + 1,
		sort: sortModeSelect.value,
	}).then(files => {
		if (files.length === max + 1) {
			moreFiles.value = true;
			files.pop();
		} else {
			moreFiles.value = false;
		}
		for (const x of files) appendFile(x);
		fetching.value = false;
	});
}

function getMenu() {
	const menu: MenuItem[] = [];

	menu.push({
		type: 'switch',
		text: i18n.ts.keepOriginalUploading,
		ref: keepOriginal,
	}, { type: 'divider' }, {
		text: i18n.ts.addFile,
		type: 'label',
	}, {
		text: i18n.ts.upload,
		icon: 'ti ti-upload',
		action: () => { selectLocalFile(); },
	}, {
		text: i18n.ts.fromUrl,
		icon: 'ti ti-link',
		action: () => { urlUpload(); },
	}, { type: 'divider' }, {
		text: folder.value ? folder.value.name : i18n.ts.drive,
		type: 'label',
	});

	menu.push({
		type: 'parent',
		text: i18n.ts.sort,
		icon: 'ti ti-arrows-sort',
		children: [{
			text: `${i18n.ts.registeredDate} (${i18n.ts.descendingOrder})`,
			icon: 'ti ti-sort-descending-letters',
			action: () => { sortModeSelect.value = '+createdAt'; },
			active: sortModeSelect.value === '+createdAt',
		}, {
			text: `${i18n.ts.registeredDate} (${i18n.ts.ascendingOrder})`,
			icon: 'ti ti-sort-ascending-letters',
			action: () => { sortModeSelect.value = '-createdAt'; },
			active: sortModeSelect.value === '-createdAt',
		}, {
			text: `${i18n.ts.size} (${i18n.ts.descendingOrder})`,
			icon: 'ti ti-sort-descending-letters',
			action: () => { sortModeSelect.value = '+size'; },
			active: sortModeSelect.value === '+size',
		}, {
			text: `${i18n.ts.size} (${i18n.ts.ascendingOrder})`,
			icon: 'ti ti-sort-ascending-letters',
			action: () => { sortModeSelect.value = '-size'; },
			active: sortModeSelect.value === '-size',
		}, {
			text: `${i18n.ts.name} (${i18n.ts.descendingOrder})`,
			icon: 'ti ti-sort-descending-letters',
			action: () => { sortModeSelect.value = '+name'; },
			active: sortModeSelect.value === '+name',
		}, {
			text: `${i18n.ts.name} (${i18n.ts.ascendingOrder})`,
			icon: 'ti ti-sort-ascending-letters',
			action: () => { sortModeSelect.value = '-name'; },
			active: sortModeSelect.value === '-name',
		}],
	});

	if (folder.value) {
		menu.push({
			text: i18n.ts.renameFolder,
			icon: 'ti ti-forms',
			action: () => { if (folder.value) renameFolder(folder.value); },
		}, {
			text: i18n.ts.deleteFolder,
			icon: 'ti ti-trash',
			action: () => { deleteFolder(folder.value as Misskey.entities.DriveFolder); },
		});
	}

	menu.push({
		text: i18n.ts.createFolder,
		icon: 'ti ti-folder-plus',
		action: () => { createFolder(); },
	});

	return menu;
}

function showMenu(ev: MouseEvent) {
	os.popupMenu(getMenu(), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextmenu(ev: MouseEvent) {
	os.contextMenu(getMenu(), ev);
}

onMounted(() => {
	if (defaultStore.state.enableInfiniteScroll && loadMoreFiles.value) {
		nextTick(() => {
			ilFilesObserver.observe(loadMoreFiles.value?.$el);
		});
	}

	connection.on('fileCreated', onStreamDriveFileCreated);
	connection.on('fileUpdated', onStreamDriveFileUpdated);
	connection.on('fileDeleted', onStreamDriveFileDeleted);
	connection.on('folderCreated', onStreamDriveFolderCreated);
	connection.on('folderUpdated', onStreamDriveFolderUpdated);
	connection.on('folderDeleted', onStreamDriveFolderDeleted);

	if (props.initialFolder) {
		move(props.initialFolder);
	} else {
		fetch();
	}
});

onActivated(() => {
	if (defaultStore.state.enableInfiniteScroll) {
		nextTick(() => {
			ilFilesObserver.observe(loadMoreFiles.value?.$el);
		});
	}
});

onBeforeUnmount(() => {
	connection.dispose();
	ilFilesObserver.disconnect();
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.nav {
	display: flex;
	z-index: 2;
	width: 100%;
	padding: 0 8px;
	box-sizing: border-box;
	overflow: auto;
	font-size: 0.9em;
	box-shadow: 0 1px 0 var(--MI_THEME-divider);
	user-select: none;
}

.navPath {
	display: inline-block;
	vertical-align: bottom;
	line-height: 42px;
	white-space: nowrap;
}

.navPathItem {
	display: inline-block;
	margin: 0;
	padding: 0 8px;
	line-height: 42px;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
	}

	&.navCurrent {
		font-weight: bold;
		cursor: default;

		&:hover {
			text-decoration: none;
		}
	}

	&.navSeparator {
		margin: 0;
		padding: 0;
		opacity: 0.5;
		cursor: default;
	}
}

.navMenu {
	margin-left: auto;
	padding: 0 12px;
}

.main {
	flex: 1;
	overflow: auto;
	padding: var(--MI-margin);
	user-select: none;

	&.fetching {
		cursor: wait !important;
		opacity: 0.5;
		pointer-events: none;
	}

	&.uploading {
		height: calc(100% - 38px - 100px);
	}
}

.folders,
.files {
	display: flex;
	flex-wrap: wrap;
}

.folder,
.file {
	flex-grow: 1;
	width: 128px;
	margin: 4px;
	box-sizing: border-box;
}

.padding {
	flex-grow: 1;
	pointer-events: none;
	width: 128px + 8px;
}

.empty {
	padding: 16px;
	text-align: center;
	pointer-events: none;
	opacity: 0.5;
}

.dropzone {
	position: absolute;
	left: 0;
	top: 38px;
	width: 100%;
	height: calc(100% - 38px);
	border: dashed 2px var(--MI_THEME-focus);
	pointer-events: none;
}
</style>
