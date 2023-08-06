<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps_m">
			<section v-for="announcement in announcements" class="">
				<div class="_panel _gaps_m" style="padding: 24px;">
					<MkInput v-model="announcement.title">
						<template #label>{{ i18n.ts.title }}</template>
					</MkInput>
					<MkTextarea v-model="announcement.text">
						<template #label>{{ i18n.ts.text }}</template>
					</MkTextarea>
					<MkInput v-model="announcement.imageUrl">
						<template #label>{{ i18n.ts.imageUrl }}</template>
					</MkInput>
					<p v-if="announcement.reads">{{ i18n.t('nUsersRead', { n: announcement.reads }) }}</p>
					<div class="buttons _buttons">
						<MkButton class="button" inline primary @click="save(announcement)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
						<MkButton class="button" inline danger @click="remove(announcement)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
					</div>
				</div>
			</section>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import XHeader from './_header_.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let announcements: any[] = $ref([]);

os.api('admin/announcements/list').then(announcementResponse => {
	announcements = announcementResponse;
});

function add() {
	announcements.unshift({
		id: null,
		title: '',
		text: '',
		imageUrl: null,
	});
}

function remove(announcement) {
	os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: announcement.title }),
	}).then(({ canceled }) => {
		if (canceled) return;
		announcements = announcements.filter(x => x !== announcement);
		os.api('admin/announcements/delete', announcement);
	});
}

function save(announcement) {
	if (announcement.id == null) {
		os.api('admin/announcements/create', announcement).then(() => {
			os.alert({
				type: 'success',
				text: i18n.ts.saved,
			});
			refresh();
		}).catch(err => {
			os.alert({
				type: 'error',
				text: err,
			});
		});
	} else {
		os.api('admin/announcements/update', announcement).then(() => {
			os.alert({
				type: 'success',
				text: i18n.ts.saved,
			});
		}).catch(err => {
			os.alert({
				type: 'error',
				text: err,
			});
		});
	}
}

function refresh() {
	os.api('admin/announcements/list').then(announcementResponse => {
		announcements = announcementResponse;
	});
}

refresh();

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.announcements,
	icon: 'ti ti-speakerphone',
});
</script>
