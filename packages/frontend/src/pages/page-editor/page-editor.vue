<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer ref="containerEl">
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div v-if="fetchStatus === 'loading'">
			<MkLoading/>
		</div>
		<div v-else-if="fetchStatus === 'done' && page != null" class="_gaps" :class="$style.pageMain">
			<div :class="$style.pageBanner">
				<div v-if="page?.eyeCatchingImageId" :class="$style.pageBannerImage">
					<MkMediaImage
						:image="page.eyeCatchingImage!"
						:cover="true"
						:disableImageLink="true"
						:class="$style.thumbnail"
					/>
				</div>
			</div>
			<div :class="$style.pageBannerTitle" class="_gaps_s">
				<input v-model="title" :class="$style.titleForm" :placeholder="i18n.ts._pages.inputTitleHere"/>
				<div :class="$style.pageBannerTitleSub">
					<div v-if="page?.user" :class="$style.pageBannerTitleUser">
						<MkAvatar :user="page.user" :class="$style.avatar" indicator/> <MkUserName :user="page.user" :nowrap="false"/>
					</div>
					<div :class="$style.pageBannerTitleSubActions">
					</div>
				</div>
			</div>
			<div>
				<XPage v-if="enableGlobalPreview" key="preview" :page="page" />
				<XBlocks v-else key="editor" v-model="content" :scrollContainer="containerEl?.rootEl"/>
			</div>
		</div>
		<div v-else-if="fetchStatus === 'notMe'" class="_fullInfo">
			This page is not yours
		</div>
	</MkSpacer>
	<template #footer>
		<div :class="$style.footer">
			<div :class="$style.footerInner">
				<div :class="$style.footerActionSwitchWrapper">
					<MkSwitch v-model="enableGlobalPreview">{{ i18n.ts.preview }}</MkSwitch>
				</div>
				<div :class="$style.footerActionButtons" class="_buttons">
					<MkButton primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				</div>
			</div>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import XBlocks from './page-editor.blocks.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkMediaImage from '@/components/MkMediaImage.vue';
import XPage from '@/components/page/page.vue';
import { url } from '@@/js/config.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { selectFile } from '@/scripts/select-file.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { signinRequired } from '@/account.js';
import { mainRouter } from '@/router/main.js';
import { getPageBlockList } from '@/pages/page-editor/common.js';
import type { SlimPage } from '@/types/page.js';

const props = defineProps<{
	initPageId?: string;
}>();

const $i = signinRequired();

const fetchStatus = ref<'loading' | 'done' | 'notMe'>('loading');
const page = ref<Partial<SlimPage> | null>(null);
const title = computed({
	get: () => page.value?.title ?? '',
	set: (value) => {
		if (page.value) {
			page.value.title = value;
		} else {
			page.value = {
				title: value,
			};
		}
	},
});
const content = computed<Misskey.entities.Page['content']>({
	get: () => page.value?.content ?? [],
	set: (value) => {
		if (page.value) {
			page.value.content = value;
		} else {
			page.value = {
				content: value,
			};
		}
	},
});

const enableGlobalPreview = ref(false);

const containerEl = useTemplateRef('containerEl');

function onTitleUpdated(ev: Event) {
	title.value = (ev.target as HTMLDivElement).innerText;
}

async function save() {

}

async function show() {

}

async function del() {

}

async function init() {
	if (props.initPageId) {
		const _page = await misskeyApi('pages/show', {
			pageId: props.initPageId,
		});
		if (_page.user.id !== $i.id) {
			fetchStatus.value = 'notMe';
			return;
		}
		page.value = _page;
	}

	if (page.value === null) {
		const id = uuid();
		content.value = [{
			id,
			type: 'text',
			text: 'Hello World!',
		}];
	}

	fetchStatus.value = 'done';
}

init();

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: props.initPageId ? i18n.ts._pages.editPage : i18n.ts._pages.newPage,
	icon: 'ti ti-pencil',
}));
</script>

<style lang="scss" module>
.pageMain {
	border-radius: var(--MI-radius);
	padding: 2rem;
	background: var(--MI_THEME-panel);
	box-sizing: border-box;
}

.pageBanner {
	width: calc(100% + 4rem);
	margin: -2rem -2rem 0.5rem;
	border-radius: var(--MI-radius) var(--MI-radius) 0 0;
	overflow: hidden;
	position: relative;
}

.pageBannerImage {
	position: relative;
	padding-top: 56.25%;

	> .thumbnail {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
}

.pageBannerTitle {
	position: relative;

	.titleForm {
		appearance: none;
		-webkit-appearance: none;
		box-sizing: border-box;
		display: block;
		padding: 6px 12px;
		font: inherit;
		font-size: 2rem;
		font-weight: 700;
		color: var(--MI_THEME-fg);
		margin: 0;
		border: none;
		border-bottom: 2px solid var(--MI_THEME-divider);
		transition: border-color 0.1s ease-out;
		background-color: var(--MI_THEME-bg);
		border-radius: var(--MI-radius) var(--MI-radius) 0 0;

		&:hover {
			border-color: var(--MI_THEME-inputBorderHover);
		}

		&:focus {
			outline: none;
			border-color: var(--MI_THEME-accent);
		}

		&:focus-visible {
			outline: 2px solid var(--MI_THEME-focus);
			outline-offset: -2px;
		}
	}

	.pageBannerTitleSub {
		display: flex;
		align-items: center;
		width: 100%;
	}

	.pageBannerTitleUser {
		--height: 32px;
		flex-shrink: 0;
		line-height: var(--height);

		.avatar {
			height: var(--height);
			width: var(--height);
		}
	}

	.pageBannerTitleSubActions {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: var(--MI-marginHalf);
		margin-left: auto;
	}
}

.editorMenu {
	position: sticky;
	top: var(--MI-stickyTop, 0px);
	left: 0;
	width: calc(100% + 4rem);
	margin: 0 -2rem 0;
	backdrop-filter: var(--MI-blur, blur(15px));
	background: var(--MI_THEME-acrylicBg);
	border-bottom: solid .5px var(--MI_THEME-divider);
	z-index: 2;
}

.editorMenuInner {
	padding: 16px;
	margin: 0 auto;
	padding: 2rem;
}

.footer {
	backdrop-filter: var(--MI-blur, blur(15px));
	background: var(--MI_THEME-acrylicBg);
	border-top: solid .5px var(--MI_THEME-divider);
}

.footerInner {
	padding: 16px;
	margin: 0 auto;
	max-width: 800px;

	display: flex;
	gap: 8px;
	align-items: center;
}

.footerActionSwitchWrapper {
	flex-shrink: 0;
}

.footerActionButtons {
	margin-left: auto;
	flex-shrink: 0;
}
</style>
