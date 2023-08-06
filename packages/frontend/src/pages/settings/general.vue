<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="lang">
		<template #label>{{ i18n.ts.uiLanguage }}</template>
		<option v-for="x in langs" :key="x[0]" :value="x[0]">{{ x[1] }}</option>
		<template #caption>
			<I18n :src="i18n.ts.i18nInfo" tag="span">
				<template #link>
					<MkLink url="https://crowdin.com/project/misskey">Crowdin</MkLink>
				</template>
			</I18n>
		</template>
	</MkSelect>

	<MkRadios v-model="overridedDeviceKind">
		<template #label>{{ i18n.ts.overridedDeviceKind }}</template>
		<option :value="null">{{ i18n.ts.auto }}</option>
		<option value="smartphone"><i class="ti ti-device-mobile"/> {{ i18n.ts.smartphone }}</option>
		<option value="tablet"><i class="ti ti-device-tablet"/> {{ i18n.ts.tablet }}</option>
		<option value="desktop"><i class="ti ti-device-desktop"/> {{ i18n.ts.desktop }}</option>
	</MkRadios>

	<FormSection>
		<div class="_gaps_s">
			<MkSwitch v-model="showFixedPostForm">{{ i18n.ts.showFixedPostForm }}</MkSwitch>
			<MkSwitch v-model="showFixedPostFormInChannel">{{ i18n.ts.showFixedPostFormInChannel }}</MkSwitch>
			<MkSwitch v-model="showTimelineReplies">{{ i18n.ts.flagShowTimelineReplies }}<template #caption>{{ i18n.ts.flagShowTimelineRepliesDescription }} {{ i18n.ts.reflectMayTakeTime }}</template></MkSwitch>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.displayOfNote }}</template>

		<div class="_gaps_m">
			<div class="_gaps_s">
				<MkSwitch v-model="showNoteActionsOnlyHover">{{ i18n.ts.showNoteActionsOnlyHover }}</MkSwitch>
				<MkSwitch v-model="showClipButtonInNoteFooter">{{ i18n.ts.showClipButtonInNoteFooter }}</MkSwitch>
				<MkSwitch v-model="largeNoteReactions">{{ i18n.ts.largeNoteReactions }}</MkSwitch>
				<MkSwitch v-model="collapseRenotes">{{ i18n.ts.collapseRenotes }}</MkSwitch>
				<MkSwitch v-model="advancedMfm">{{ i18n.ts.enableAdvancedMfm }}</MkSwitch>
				<MkSwitch v-if="advancedMfm" v-model="animatedMfm">{{ i18n.ts.enableAnimatedMfm }}</MkSwitch>
				<MkSwitch v-model="showGapBetweenNotesInTimeline">{{ i18n.ts.showGapBetweenNotesInTimeline }}</MkSwitch>
				<MkSwitch v-model="loadRawImages">{{ i18n.ts.loadRawImages }}</MkSwitch>
				<MkSwitch v-model="useReactionPickerForContextMenu">{{ i18n.ts.useReactionPickerForContextMenu }}</MkSwitch>
			</div>

			<MkSelect v-model="instanceTicker">
				<template #label>{{ i18n.ts.instanceTicker }}</template>
				<option value="none">{{ i18n.ts._instanceTicker.none }}</option>
				<option value="remote">{{ i18n.ts._instanceTicker.remote }}</option>
				<option value="always">{{ i18n.ts._instanceTicker.always }}</option>
			</MkSelect>

			<MkSelect v-model="nsfw">
				<template #label>{{ i18n.ts.displayOfSensitiveMedia }}</template>
				<option value="respect">{{ i18n.ts._displayOfSensitiveMedia.respect }}</option>
				<option value="ignore">{{ i18n.ts._displayOfSensitiveMedia.ignore }}</option>
				<option value="force">{{ i18n.ts._displayOfSensitiveMedia.force }}</option>
			</MkSelect>

			<MkRadios v-model="mediaListWithOneImageAppearance">
				<template #label>{{ i18n.ts.mediaListWithOneImageAppearance }}</template>
				<option value="expand">{{ i18n.ts.default }}</option>
				<option value="16_9">{{ i18n.t('limitTo', { x: '16:9' }) }}</option>
				<option value="1_1">{{ i18n.t('limitTo', { x: '1:1' }) }}</option>
				<option value="2_3">{{ i18n.t('limitTo', { x: '2:3' }) }}</option>
			</MkRadios>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.notificationDisplay }}</template>

		<div class="_gaps_m">
			<MkRadios v-model="notificationPosition">
				<template #label>{{ i18n.ts.position }}</template>
				<option value="leftTop"><i class="ti ti-align-box-left-top"></i> {{ i18n.ts.leftTop }}</option>
				<option value="rightTop"><i class="ti ti-align-box-right-top"></i> {{ i18n.ts.rightTop }}</option>
				<option value="leftBottom"><i class="ti ti-align-box-left-bottom"></i> {{ i18n.ts.leftBottom }}</option>
				<option value="rightBottom"><i class="ti ti-align-box-right-bottom"></i> {{ i18n.ts.rightBottom }}</option>
			</MkRadios>

			<MkRadios v-model="notificationStackAxis">
				<template #label>{{ i18n.ts.stackAxis }}</template>
				<option value="vertical"><i class="ti ti-carousel-vertical"></i> {{ i18n.ts.vertical }}</option>
				<option value="horizontal"><i class="ti ti-carousel-horizontal"></i> {{ i18n.ts.horizontal }}</option>
			</MkRadios>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.appearance }}</template>

		<div class="_gaps_m">
			<div class="_gaps_s">
				<MkSwitch v-model="reduceAnimation">{{ i18n.ts.reduceUiAnimation }}</MkSwitch>
				<MkSwitch v-model="useBlurEffect">{{ i18n.ts.useBlurEffect }}</MkSwitch>
				<MkSwitch v-model="useBlurEffectForModal">{{ i18n.ts.useBlurEffectForModal }}</MkSwitch>
				<MkSwitch v-model="disableShowingAnimatedImages">{{ i18n.ts.disableShowingAnimatedImages }}</MkSwitch>
				<MkSwitch v-model="squareAvatars">{{ i18n.ts.squareAvatars }}</MkSwitch>
				<MkSwitch v-model="useSystemFont">{{ i18n.ts.useSystemFont }}</MkSwitch>
				<MkSwitch v-model="disableDrawer">{{ i18n.ts.disableDrawer }}</MkSwitch>
				<MkSwitch v-model="forceShowAds">{{ i18n.ts.forceShowAds }}</MkSwitch>
				<MkSwitch v-model="enableDataSaverMode">{{ i18n.ts.dataSaver }}</MkSwitch>
			</div>
			<div>
				<MkRadios v-model="emojiStyle">
					<template #label>{{ i18n.ts.emojiStyle }}</template>
					<option value="native">{{ i18n.ts.native }}</option>
					<option value="fluentEmoji">Fluent Emoji</option>
					<option value="twemoji">Twemoji</option>
				</MkRadios>
				<div style="margin: 8px 0 0 0; font-size: 1.5em;"><Mfm :key="emojiStyle" text="🍮🍦🍭🍩🍰🍫🍬🥞🍪"/></div>
			</div>

			<MkRadios v-model="fontSize">
				<template #label>{{ i18n.ts.fontSize }}</template>
				<option :value="null"><span style="font-size: 14px;">Aa</span></option>
				<option value="1"><span style="font-size: 15px;">Aa</span></option>
				<option value="2"><span style="font-size: 16px;">Aa</span></option>
				<option value="3"><span style="font-size: 17px;">Aa</span></option>
			</MkRadios>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.behavior }}</template>

		<div class="_gaps_m">
			<div class="_gaps_s">
				<MkSwitch v-model="imageNewTab">{{ i18n.ts.openImageInNewTab }}</MkSwitch>
				<MkSwitch v-model="enableInfiniteScroll">{{ i18n.ts.enableInfiniteScroll }}</MkSwitch>
			</div>
			<MkSelect v-model="serverDisconnectedBehavior">
				<template #label>{{ i18n.ts.whenServerDisconnected }}</template>
				<option value="reload">{{ i18n.ts._serverDisconnectedBehavior.reload }}</option>
				<option value="dialog">{{ i18n.ts._serverDisconnectedBehavior.dialog }}</option>
				<option value="quiet">{{ i18n.ts._serverDisconnectedBehavior.quiet }}</option>
			</MkSelect>
			<MkRange v-model="numberOfPageCache" :min="1" :max="10" :step="1" easing>
				<template #label>{{ i18n.ts.numberOfPageCache }}</template>
				<template #caption>{{ i18n.ts.numberOfPageCacheDescription }}</template>
			</MkRange>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.other }}</template>

		<div class="_gaps">
			<MkFolder>
				<template #label>{{ i18n.ts.additionalEmojiDictionary }}</template>
				<div v-for="lang in emojiIndexLangs" class="_buttons">
					<MkButton @click="downloadEmojiIndex(lang)"><i class="ti ti-download"></i> {{ lang }}{{ defaultStore.reactiveState.additionalUnicodeEmojiIndexes.value[lang] ? ` (${ i18n.ts.installed })` : '' }}</MkButton>
					<MkButton v-if="defaultStore.reactiveState.additionalUnicodeEmojiIndexes.value[lang]" danger @click="removeEmojiIndex(lang)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
				</div>
			</MkFolder>
			<FormLink to="/settings/deck">{{ i18n.ts.deck }}</FormLink>
			<FormLink to="/settings/custom-css"><template #icon><i class="ti ti-code"></i></template>{{ i18n.ts.customCss }}</FormLink>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, ref, watch } from 'vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkRange from '@/components/MkRange.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import MkLink from '@/components/MkLink.vue';
import { langs } from '@/config';
import { defaultStore } from '@/store';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { miLocalStorage } from '@/local-storage';

const lang = ref(miLocalStorage.getItem('lang'));
const fontSize = ref(miLocalStorage.getItem('fontSize'));
const useSystemFont = ref(miLocalStorage.getItem('useSystemFont') != null);

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

const overridedDeviceKind = computed(defaultStore.makeGetterSetter('overridedDeviceKind'));
const serverDisconnectedBehavior = computed(defaultStore.makeGetterSetter('serverDisconnectedBehavior'));
const showNoteActionsOnlyHover = computed(defaultStore.makeGetterSetter('showNoteActionsOnlyHover'));
const showClipButtonInNoteFooter = computed(defaultStore.makeGetterSetter('showClipButtonInNoteFooter'));
const largeNoteReactions = computed(defaultStore.makeGetterSetter('largeNoteReactions'));
const collapseRenotes = computed(defaultStore.makeGetterSetter('collapseRenotes'));
const reduceAnimation = computed(defaultStore.makeGetterSetter('animation', v => !v, v => !v));
const useBlurEffectForModal = computed(defaultStore.makeGetterSetter('useBlurEffectForModal'));
const useBlurEffect = computed(defaultStore.makeGetterSetter('useBlurEffect'));
const showGapBetweenNotesInTimeline = computed(defaultStore.makeGetterSetter('showGapBetweenNotesInTimeline'));
const animatedMfm = computed(defaultStore.makeGetterSetter('animatedMfm'));
const advancedMfm = computed(defaultStore.makeGetterSetter('advancedMfm'));
const emojiStyle = computed(defaultStore.makeGetterSetter('emojiStyle'));
const disableDrawer = computed(defaultStore.makeGetterSetter('disableDrawer'));
const disableShowingAnimatedImages = computed(defaultStore.makeGetterSetter('disableShowingAnimatedImages'));
const forceShowAds = computed(defaultStore.makeGetterSetter('forceShowAds'));
const loadRawImages = computed(defaultStore.makeGetterSetter('loadRawImages'));
const enableDataSaverMode = computed(defaultStore.makeGetterSetter('enableDataSaverMode'));
const imageNewTab = computed(defaultStore.makeGetterSetter('imageNewTab'));
const nsfw = computed(defaultStore.makeGetterSetter('nsfw'));
const showFixedPostForm = computed(defaultStore.makeGetterSetter('showFixedPostForm'));
const showFixedPostFormInChannel = computed(defaultStore.makeGetterSetter('showFixedPostFormInChannel'));
const numberOfPageCache = computed(defaultStore.makeGetterSetter('numberOfPageCache'));
const instanceTicker = computed(defaultStore.makeGetterSetter('instanceTicker'));
const enableInfiniteScroll = computed(defaultStore.makeGetterSetter('enableInfiniteScroll'));
const useReactionPickerForContextMenu = computed(defaultStore.makeGetterSetter('useReactionPickerForContextMenu'));
const squareAvatars = computed(defaultStore.makeGetterSetter('squareAvatars'));
const mediaListWithOneImageAppearance = computed(defaultStore.makeGetterSetter('mediaListWithOneImageAppearance'));
const notificationPosition = computed(defaultStore.makeGetterSetter('notificationPosition'));
const notificationStackAxis = computed(defaultStore.makeGetterSetter('notificationStackAxis'));
const showTimelineReplies = computed(defaultStore.makeGetterSetter('showTimelineReplies'));

watch(lang, () => {
	miLocalStorage.setItem('lang', lang.value as string);
	miLocalStorage.removeItem('locale');
});

watch(fontSize, () => {
	if (fontSize.value == null) {
		miLocalStorage.removeItem('fontSize');
	} else {
		miLocalStorage.setItem('fontSize', fontSize.value);
	}
});

watch(useSystemFont, () => {
	if (useSystemFont.value) {
		miLocalStorage.setItem('useSystemFont', 't');
	} else {
		miLocalStorage.removeItem('useSystemFont');
	}
});

watch([
	lang,
	fontSize,
	useSystemFont,
	enableInfiniteScroll,
	squareAvatars,
	showNoteActionsOnlyHover,
	showGapBetweenNotesInTimeline,
	instanceTicker,
	overridedDeviceKind,
	mediaListWithOneImageAppearance,
], async () => {
	await reloadAsk();
});

const emojiIndexLangs = ['en-US'];

function downloadEmojiIndex(lang: string) {
	async function main() {
		const currentIndexes = defaultStore.state.additionalUnicodeEmojiIndexes;
		function download() {
			switch (lang) {
				case 'en-US': return import('../../unicode-emoji-indexes/en-US.json').then(x => x.default);
				default: throw new Error('unrecognized lang: ' + lang);
			}
		}
		currentIndexes[lang] = await download();
		await defaultStore.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

function removeEmojiIndex(lang: string) {
	async function main() {
		const currentIndexes = defaultStore.state.additionalUnicodeEmojiIndexes;
		delete currentIndexes[lang];
		await defaultStore.set('additionalUnicodeEmojiIndexes', currentIndexes);
	}

	os.promiseDialog(main());
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.general,
	icon: 'ti ti-adjustments',
});
</script>
