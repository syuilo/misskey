<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<div class="jqqmcavi">
			<MkButton v-if="pageId" class="button" inline link :to="`/@${ author.username }/pages/${ currentName }`"><i class="ti ti-external-link"></i> {{ i18n.ts._pages.viewPage }}</MkButton>
			<MkButton v-if="!readonly" inline primary class="button" @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
			<MkButton v-if="pageId" inline class="button" @click="duplicate"><i class="ti ti-copy"></i> {{ i18n.ts.duplicate }}</MkButton>
			<MkButton v-if="pageId && !readonly" inline class="button" danger @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
		</div>

		<div v-if="tab === 'settings'">
			<div class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ i18n.ts._pages.title }}</template>
				</MkInput>

				<MkInput v-model="summary">
					<template #label>{{ i18n.ts._pages.summary }}</template>
				</MkInput>

				<MkInput v-model="name">
					<template #prefix>{{ url }}/@{{ author.username }}/pages/</template>
					<template #label>{{ i18n.ts._pages.url }}</template>
				</MkInput>

				<MkSwitch v-model="alignCenter">{{ i18n.ts._pages.alignCenter }}</MkSwitch>

				<MkSelect v-model="font">
					<template #label>{{ i18n.ts._pages.font }}</template>
					<option value="serif">{{ i18n.ts._pages.fontSerif }}</option>
					<option value="sans-serif">{{ i18n.ts._pages.fontSansSerif }}</option>
				</MkSelect>

				<MkSwitch v-model="hideTitleWhenPinned">{{ i18n.ts._pages.hideTitleWhenPinned }}</MkSwitch>

				<div class="eyeCatch">
					<MkButton v-if="eyeCatchingImageId == null && !readonly" @click="setEyeCatchingImage"><i class="ti ti-plus"></i> {{ i18n.ts._pages.eyeCatchingImageSet }}</MkButton>
					<div v-else-if="eyeCatchingImage">
						<img :src="eyeCatchingImage.url" :alt="eyeCatchingImage.name" style="max-width: 100%;"/>
						<MkButton v-if="!readonly" @click="removeEyeCatchingImage()"><i class="ti ti-trash"></i> {{ i18n.ts._pages.eyeCatchingImageRemove }}</MkButton>
					</div>
				</div>
			</div>
		</div>

		<div v-else-if="tab === 'contents'">
			<div :class="$style.contents">
				<XBlocks v-model="content" class="content"/>

				<MkButton v-if="!readonly" rounded class="add" @click="add()"><i class="ti ti-plus"></i></MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, provide, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import XBlocks from './page-editor.blocks.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import { url } from '@/config';
import * as os from '@/os';
import { selectFile } from '@/scripts/select-file';
import { mainRouter } from '@/router';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';

const props = defineProps<{
	initPageId?: string;
	initPageName?: string;
	initUser?: string;
}>();

let tab = $ref('settings');
let author = $ref($i);
let readonly = $ref(false);
let page = $ref(null);
let pageId = $ref(null);
let currentName = $ref(null);
let title = $ref('');
let summary = $ref(null);
let name = $ref(Date.now().toString());
let eyeCatchingImage = $ref(null);
let eyeCatchingImageId = $ref(null);
let font = $ref('sans-serif');
let content = $ref([]);
let alignCenter = $ref(false);
let hideTitleWhenPinned = $ref(false);

provide('readonly', readonly);
provide('getPageBlockList', getPageBlockList);

watch($$(eyeCatchingImageId), async () => {
	if (eyeCatchingImageId == null) {
		eyeCatchingImage = null;
	} else {
		eyeCatchingImage = await os.api('drive/files/show', {
			fileId: eyeCatchingImageId,
		});
	}
});

function getSaveOptions() {
	return {
		title: title.trim(),
		name: name.trim(),
		summary: summary,
		font: font,
		script: '',
		hideTitleWhenPinned: hideTitleWhenPinned,
		alignCenter: alignCenter,
		content: content,
		variables: [],
		eyeCatchingImageId: eyeCatchingImageId,
	};
}

function save() {
	const options = getSaveOptions();

	const onError = err => {
		if (err.id === '3d81ceae-475f-4600-b2a8-2bc116157532') {
			if (err.info.param === 'name') {
				os.alert({
					type: 'error',
					title: i18n.ts._pages.invalidNameTitle,
					text: i18n.ts._pages.invalidNameText,
				});
			}
		} else if (err.code === 'NAME_ALREADY_EXISTS') {
			os.alert({
				type: 'error',
				text: i18n.ts._pages.nameAlreadyExists,
			});
		}
	};

	if (pageId) {
		options.pageId = pageId;
		os.api('pages/update', options)
			.then(page => {
				currentName = name.trim();
				os.alert({
					type: 'success',
					text: i18n.ts._pages.updated,
				});
			}).catch(onError);
	} else {
		os.api('pages/create', options)
			.then(created => {
				pageId = created.id;
				currentName = name.trim();
				os.alert({
					type: 'success',
					text: i18n.ts._pages.created,
				});
				mainRouter.push(`/pages/edit/${pageId}`);
			}).catch(onError);
	}
}

function del() {
	os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: title.trim() }),
	}).then(({ canceled }) => {
		if (canceled) return;
		os.api('pages/delete', {
			pageId: pageId,
		}).then(() => {
			os.alert({
				type: 'success',
				text: i18n.ts._pages.deleted,
			});
			mainRouter.push('/pages');
		});
	});
}

function duplicate() {
	title = title + ' - copy';
	name = name + '-copy';
	os.api('pages/create', getSaveOptions()).then(created => {
		pageId = created.id;
		currentName = name.trim();
		os.alert({
			type: 'success',
			text: i18n.ts._pages.created,
		});
		mainRouter.push(`/pages/edit/${pageId}`);
	});
}

async function add() {
	const { canceled, result: type } = await os.select({
		type: null,
		title: i18n.ts._pages.chooseBlock,
		items: getPageBlockList(),
	});
	if (canceled) return;

	const id = uuid();
	content.push({ id, type });
}

function getPageBlockList() {
	return [
		{ value: 'section', text: i18n.ts._pages.blocks.section },
		{ value: 'text', text: i18n.ts._pages.blocks.text },
		{ value: 'image', text: i18n.ts._pages.blocks.image },
		{ value: 'note', text: i18n.ts._pages.blocks.note },
	];
}

function setEyeCatchingImage(img) {
	selectFile(img.currentTarget ?? img.target, null).then(file => {
		eyeCatchingImageId = file.id;
	});
}

function removeEyeCatchingImage() {
	eyeCatchingImageId = null;
}

async function init() {
	if (props.initPageId) {
		page = await os.api('pages/show', {
			pageId: props.initPageId,
		});
	} else if (props.initPageName && props.initUser) {
		page = await os.api('pages/show', {
			name: props.initPageName,
			username: props.initUser,
		});
		readonly = true;
	}

	if (page) {
		author = page.user;
		pageId = page.id;
		title = page.title;
		name = page.name;
		currentName = page.name;
		summary = page.summary;
		font = page.font;
		hideTitleWhenPinned = page.hideTitleWhenPinned;
		alignCenter = page.alignCenter;
		content = page.content;
		eyeCatchingImageId = page.eyeCatchingImageId;
	} else {
		const id = uuid();
		content = [{
			id,
			type: 'text',
			text: 'Hello World!',
		}];
	}
}

init();

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	key: 'settings',
	title: i18n.ts._pages.pageSetting,
	icon: 'ti ti-settings',
}, {
	key: 'contents',
	title: i18n.ts._pages.contents,
	icon: 'ti ti-note',
}]);

definePageMetadata(computed(() => {
	let title = i18n.ts._pages.newPage;
	if (props.initPageId) {
		title = i18n.ts._pages.editPage;
	}
	else if (props.initPageName && props.initUser) {
		title = i18n.ts._pages.readPage;
	}
	return {
		title: title,
		icon: 'ti ti-pencil',
	};
}));
</script>

<style lang="scss" module>
.contents {
	&:global {
		> .add {
			margin: 16px auto 0 auto;
		}
	}
}
</style>

<style lang="scss" scoped>
.jqqmcavi {
	margin-bottom: 16px;

	> .button {
		& + .button {
			margin-left: 8px;
		}
	}
}

.gwbmwxkm {
	position: relative;

	> header {
		> .title {
			z-index: 1;
			margin: 0;
			padding: 0 16px;
			line-height: 42px;
			font-size: 0.9em;
			font-weight: bold;
			box-shadow: 0 1px rgba(#000, 0.07);

			> i {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .buttons {
			position: absolute;
			z-index: 2;
			top: 0;
			right: 0;

			> button {
				padding: 0;
				width: 42px;
				font-size: 0.9em;
				line-height: 42px;
			}
		}
	}

	> section {
		padding: 0 32px 32px 32px;

		@media (max-width: 500px) {
			padding: 0 16px 16px 16px;
		}

		> .view {
			display: inline-block;
			margin: 16px 0 0 0;
			font-size: 14px;
		}

		> .content {
			margin-bottom: 16px;
		}

		> .eyeCatch {
			margin-bottom: 16px;

			> div {
				> img {
					max-width: 100%;
				}
			}
		}
	}
}

.qmuvgica {
	padding: 16px;

	> .variables {
		margin-bottom: 16px;
	}

	> .add {
		margin-bottom: 16px;
	}
}
</style>
