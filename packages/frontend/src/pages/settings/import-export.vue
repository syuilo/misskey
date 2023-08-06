<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label><i class="ti ti-pencil"></i> {{ i18n.ts._exportOrImport.allNotes }}</template>
		<MkFolder>
			<template #label>{{ i18n.ts.export }}</template>
			<template #icon><i class="ti ti-download"></i></template>
			<MkButton primary :class="$style.button" inline @click="exportNotes()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
		</MkFolder>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-star"></i> {{ i18n.ts._exportOrImport.favoritedNotes }}</template>
		<MkFolder>
			<template #label>{{ i18n.ts.export }}</template>
			<template #icon><i class="ti ti-download"></i></template>
			<MkButton primary :class="$style.button" inline @click="exportFavorites()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
		</MkFolder>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-users"></i> {{ i18n.ts._exportOrImport.followingList }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<div class="_gaps_s">
					<MkSwitch v-model="excludeMutingUsers">
						{{ i18n.ts._exportOrImport.excludeMutingUsers }}
					</MkSwitch>
					<MkSwitch v-model="excludeInactiveUsers">
						{{ i18n.ts._exportOrImport.excludeInactiveUsers }}
					</MkSwitch>
					<MkButton primary :class="$style.button" inline @click="exportFollowing()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
				</div>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importFollowing($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-users"></i> {{ i18n.ts._exportOrImport.userLists }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<MkButton primary :class="$style.button" inline @click="exportUserLists()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importUserLists($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-user-off"></i> {{ i18n.ts._exportOrImport.muteList }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<MkButton primary :class="$style.button" inline @click="exportMuting()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importMuting($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-user-off"></i> {{ i18n.ts._exportOrImport.blockingList }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<MkButton primary :class="$style.button" inline @click="exportBlocking()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importBlocking($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
	<FormSection>
		<template #label><i class="ti ti-antenna"></i> {{ i18n.ts.antennas }}</template>
		<div class="_gaps_s">
			<MkFolder>
				<template #label>{{ i18n.ts.export }}</template>
				<template #icon><i class="ti ti-download"></i></template>
				<MkButton primary :class="$style.button" inline @click="exportAntennas()"><i class="ti ti-download"></i> {{ i18n.ts.export }}</MkButton>
			</MkFolder>
			<MkFolder v-if="$i && !$i.movedTo">
				<template #label>{{ i18n.ts.import }}</template>
				<template #icon><i class="ti ti-upload"></i></template>
				<MkButton primary :class="$style.button" inline @click="importAntennas($event)"><i class="ti ti-upload"></i> {{ i18n.ts.import }}</MkButton>
			</MkFolder>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os';
import { selectFile } from '@/scripts/select-file';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';

const excludeMutingUsers = ref(false);
const excludeInactiveUsers = ref(false);

const onExportSuccess = () => {
	os.alert({
		type: 'info',
		text: i18n.ts.exportRequested,
	});
};

const onImportSuccess = () => {
	os.alert({
		type: 'info',
		text: i18n.ts.importRequested,
	});
};

const onError = (ev) => {
	os.alert({
		type: 'error',
		text: ev.message,
	});
};

const exportNotes = () => {
	os.api('i/export-notes', {}).then(onExportSuccess).catch(onError);
};

const exportFavorites = () => {
	os.api('i/export-favorites', {}).then(onExportSuccess).catch(onError);
};

const exportFollowing = () => {
	os.api('i/export-following', {
		excludeMuting: excludeMutingUsers.value,
		excludeInactive: excludeInactiveUsers.value,
	})
		.then(onExportSuccess).catch(onError);
};

const exportBlocking = () => {
	os.api('i/export-blocking', {}).then(onExportSuccess).catch(onError);
};

const exportUserLists = () => {
	os.api('i/export-user-lists', {}).then(onExportSuccess).catch(onError);
};

const exportMuting = () => {
	os.api('i/export-mute', {}).then(onExportSuccess).catch(onError);
};

const exportAntennas = () => {
	os.api('i/export-antennas', {}).then(onExportSuccess).catch(onError);
};

const importFollowing = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-following', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importUserLists = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-user-lists', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importMuting = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-muting', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importBlocking = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-blocking', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const importAntennas = async (ev) => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	os.api('i/import-antennas', { fileId: file.id }).then(onImportSuccess).catch(onError);
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.importAndExport,
	icon: 'ti ti-package',
});
</script>

<style module>
.button {
	margin-right: 16px;
}
</style>
