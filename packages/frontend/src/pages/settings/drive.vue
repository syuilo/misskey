<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection v-if="!fetching" first>
		<template #label>{{ i18n.ts.usageAmount }}</template>

		<div class="_gaps_m">
			<div>
				<div :class="$style.meter"><div :class="$style.meterValue" :style="meterStyle"></div></div>
			</div>
			<FormSplit>
				<MkKeyValue>
					<template #key>{{ i18n.ts.capacity }}</template>
					<template #value>{{ bytes(capacity, 1) }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.inUse }}</template>
					<template #value>{{ bytes(usage, 1) }}</template>
				</MkKeyValue>
			</FormSplit>
		</div>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.statistics }}</template>
		<MkChart src="per-user-drive" :args="{ user: $i }" span="day" :limit="7 * 5" :bar="true" :stacked="true" :detailed="false" :aspectRatio="6"/>
	</FormSection>

	<FormSection>
		<div class="_gaps_m">
			<FormLink @click="chooseUploadFolder()">
				<template #icon><i class="ti ti-folder"></i></template>
				{{ i18n.ts.uploadFolder }}
				<template #suffix>{{ uploadFolder ? uploadFolder.name : '-' }}</template>
			</FormLink>
			<FormLink to="/settings/drive/cleaner">
				<template #icon><i class="ti ti-file-shredder"></i></template>
				{{ i18n.ts.drivecleaner }}
			</FormLink>
			<MkFolder>
				<template #icon><i class="ti ti-ripple"></i></template>
				<template #label>{{ i18n.ts.watermark }}</template>

				<div>
					<div class="_gaps">
						<MkInfo>{{ i18n.ts.useWatermarkInfo }}</MkInfo>

						<MkSwitch v-model="useWatermark">
							<template #label>{{ i18n.ts.useWatermark }}</template>
							<template #caption>{{ i18n.ts.useWatermarkDescription }}</template>
						</MkSwitch>

						<MkSelect v-model="clipboardWatermarkBehavior">
							<template #label>{{ i18n.ts._watermarkEditor.clipboardUploadBehavior }}</template>
							<option value="confirm">{{ i18n.ts.alwaysConfirm }}</option>
							<option value="default">{{ i18n.ts.useDefaultSettings }}</option>
						</MkSelect>
					</div>

					<hr/>

					<FormLink @click="openWatermarkEditor">
						<template #icon><i class="ti ti-pencil"></i></template>
						{{ i18n.ts._watermarkEditor.title }}
					</FormLink>
				</div>
			</MkFolder>
			<MkSwitch v-model="keepOriginalUploading">
				<template #label>{{ i18n.ts.keepOriginalUploading }}</template>
				<template #caption>{{ i18n.ts.keepOriginalUploadingDescription }}</template>
			</MkSwitch>
			<MkSwitch v-model="keepOriginalFilename">
				<template #label>{{ i18n.ts.keepOriginalFilename }}</template>
				<template #caption>{{ i18n.ts.keepOriginalFilenameDescription }}</template>
			</MkSwitch>
			<MkSwitch v-model="alwaysMarkNsfw" @update:modelValue="saveProfile()">
				<template #label>{{ i18n.ts.alwaysMarkSensitive }}</template>
			</MkSwitch>
			<MkSwitch v-model="autoSensitive" @update:modelValue="saveProfile()">
				<template #label>{{ i18n.ts.enableAutoSensitive }}<span class="_beta">{{ i18n.ts.beta }}</span></template>
				<template #caption>{{ i18n.ts.enableAutoSensitiveDescription }}</template>
			</MkSwitch>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import * as Misskey from 'misskey-js';
import tinycolor from 'tinycolor2';
import FormLink from '@/components/form/link.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import bytes from '@/filters/bytes.js';
import { defaultStore } from '@/store.js';
import MkChart from '@/components/MkChart.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { signinRequired } from '@/account.js';
import { reloadAsk } from '@/scripts/reload-ask';

const $i = signinRequired();

const fetching = ref(true);
const usage = ref<number | null>(null);
const capacity = ref<number | null>(null);
const uploadFolder = ref<Misskey.entities.DriveFolder | null>(null);
const alwaysMarkNsfw = ref($i.alwaysMarkNsfw);
const autoSensitive = ref($i.autoSensitive);

const meterStyle = computed(() => {
	if (!capacity.value || !usage.value) return {};
	return {
		width: `${usage.value / capacity.value * 100}%`,
		background: tinycolor({
			h: 180 - (usage.value / capacity.value * 180),
			s: 0.7,
			l: 0.5,
		}).toHslString(),
	};
});

const useWatermark = computed(defaultStore.makeGetterSetter('useWatermark'));
const clipboardWatermarkBehavior = computed(defaultStore.makeGetterSetter('clipboardWatermarkBehavior'));

const keepOriginalUploading = computed(defaultStore.makeGetterSetter('keepOriginalUploading'));
const keepOriginalFilename = computed(defaultStore.makeGetterSetter('keepOriginalFilename'));

watch([
	useWatermark,
	clipboardWatermarkBehavior,
], () => {
	reloadAsk({ unison: true, reason: i18n.ts.reloadRequiredToApplySettings });
});

misskeyApi('drive').then(info => {
	capacity.value = info.capacity;
	usage.value = info.usage;
	fetching.value = false;
});

if (defaultStore.state.uploadFolder) {
	misskeyApi('drive/folders/show', {
		folderId: defaultStore.state.uploadFolder,
	}).then(response => {
		uploadFolder.value = response;
	});
}

function chooseUploadFolder() {
	os.selectDriveFolder(false).then(async folder => {
		defaultStore.set('uploadFolder', folder[0] ? folder[0].id : null);
		os.success();
		if (defaultStore.state.uploadFolder) {
			uploadFolder.value = await misskeyApi('drive/folders/show', {
				folderId: defaultStore.state.uploadFolder,
			});
		} else {
			uploadFolder.value = null;
		}
	});
}

function openWatermarkEditor() {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkWatermarkEditorDialog.vue')), {}, {
		closed: () => dispose(),
	});
}

function saveProfile() {
	misskeyApi('i/update', {
		alwaysMarkNsfw: !!alwaysMarkNsfw.value,
		autoSensitive: !!autoSensitive.value,
	}).catch(err => {
		os.alert({
			type: 'error',
			title: i18n.ts.error,
			text: err.message,
		});
		alwaysMarkNsfw.value = true;
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.drive,
	icon: 'ti ti-cloud',
}));
</script>

<style lang="scss" module>
.meter {
	height: 10px;
	background: rgba(0, 0, 0, 0.1);
	border-radius: 999px;
	overflow: clip;
}

.meterValue {
	height: 100%;
	border-radius: 999px;
}
</style>
