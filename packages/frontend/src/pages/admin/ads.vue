<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div>
			<div v-for="ad in ads" class="_panel _gaps_m" :class="$style.ad">
				<MkAd v-if="ad.url" :specify="ad"/>
				<MkInput v-model="ad.url" type="url">
					<template #label>URL</template>
				</MkInput>
				<MkInput v-model="ad.imageUrl">
					<template #label>{{ i18n.ts.imageUrl }}</template>
				</MkInput>
				<MkRadios v-model="ad.place">
					<template #label>Form</template>
					<option value="square">square</option>
					<option value="horizontal">horizontal</option>
					<option value="horizontal-big">horizontal-big</option>
				</MkRadios>
				<!--
			<div style="margin: 32px 0;">
				{{ i18n.ts.priority }}
				<MkRadio v-model="ad.priority" value="high">{{ i18n.ts.high }}</MkRadio>
				<MkRadio v-model="ad.priority" value="middle">{{ i18n.ts.middle }}</MkRadio>
				<MkRadio v-model="ad.priority" value="low">{{ i18n.ts.low }}</MkRadio>
			</div>
			-->
				<FormSplit>
					<MkInput v-model="ad.ratio" type="number">
						<template #label>{{ i18n.ts.ratio }}</template>
					</MkInput>
					<MkInput v-model="ad.startsAt" type="datetime-local">
						<template #label>{{ i18n.ts.startingperiod }}</template>
					</MkInput>
					<MkInput v-model="ad.expiresAt" type="datetime-local">
						<template #label>{{ i18n.ts.expiration }}</template>
					</MkInput>
				</FormSplit>
				<MkFolder>
					<template #label>{{ i18n.ts.advancedSettings }}</template>
					<span>
						{{ i18n.ts._ad.timezoneinfo }}
						<div v-for="(day, index) in daysOfWeek" :key="index">
							<input :id="`ad${ad.id}-${index}`" type="checkbox" :checked="(ad.dayOfWeek & (1 << index)) !== 0" @change="toggleDayOfWeek(ad, index)">
							<label :for="`ad${ad.id}-${index}`">{{ day }}</label>
						</div>
					</span>
				</MkFolder>
				<MkTextarea v-model="ad.memo">
					<template #label>{{ i18n.ts.memo }}</template>
				</MkTextarea>
				<div class="buttons">
					<MkButton class="button" inline primary style="margin-right: 12px;" @click="save(ad)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
					<MkButton class="button" inline danger @click="remove(ad)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
				</div>
			</div>
			<MkButton class="button" @click="more()">
				<i class="ti ti-reload"></i>{{ i18n.ts.more }}
			</MkButton>
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
import MkRadios from '@/components/MkRadios.vue';
import MkFolder from '@/components/MkFolder.vue';
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let ads: any[] = $ref([]);

// ISO形式はTZがUTCになってしまうので、TZ分ずらして時間を初期化
const localTime = new Date();
const localTimeDiff = localTime.getTimezoneOffset() * 60 * 1000;
const daysOfWeek: string[] = [i18n.ts._weekday.sunday, i18n.ts._weekday.monday, i18n.ts._weekday.tuesday, i18n.ts._weekday.wednesday, i18n.ts._weekday.thursday, i18n.ts._weekday.friday, i18n.ts._weekday.saturday];

os.api('admin/ad/list').then(adsResponse => {
	ads = adsResponse.map(r => {
		const exdate = new Date(r.expiresAt);
		const stdate = new Date(r.startsAt);
		exdate.setMilliseconds(exdate.getMilliseconds() - localTimeDiff);
		stdate.setMilliseconds(stdate.getMilliseconds() - localTimeDiff);
		return {
			...r,
			expiresAt: exdate.toISOString().slice(0, 16),
			startsAt: stdate.toISOString().slice(0, 16),
		};
	});
});

// 選択された曜日(index)のビットフラグを操作する
function toggleDayOfWeek(ad, index) {
	ad.dayOfWeek ^= 1 << index;
}

function add() {
	ads.unshift({
		id: null,
		memo: '',
		place: 'square',
		priority: 'middle',
		ratio: 1,
		url: '',
		imageUrl: null,
		expiresAt: null,
		startsAt: null,
		dayOfWeek: 0,
	});
}

function remove(ad) {
	os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: ad.url }),
	}).then(({ canceled }) => {
		if (canceled) return;
		ads = ads.filter(x => x !== ad);
		if (ad.id == null) return;
		os.apiWithDialog('admin/ad/delete', {
			id: ad.id,
		});
	});
}

function save(ad) {
	if (ad.id == null) {
		os.api('admin/ad/create', {
			...ad,
			expiresAt: new Date(ad.expiresAt).getTime(),
			startsAt: new Date(ad.startsAt).getTime(),
		}).then(() => {
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
		os.api('admin/ad/update', {
			...ad,
			expiresAt: new Date(ad.expiresAt).getTime(),
			startsAt: new Date(ad.startsAt).getTime(),
		}).then(() => {
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
function more() {
	os.api('admin/ad/list', { untilId: ads.reduce((acc, ad) => ad.id != null ? ad : acc).id }).then(adsResponse => {
		ads = ads.concat(adsResponse.map(r => {
			const exdate = new Date(r.expiresAt);
			const stdate = new Date(r.startsAt);
			exdate.setMilliseconds(exdate.getMilliseconds() - localTimeDiff);
			stdate.setMilliseconds(stdate.getMilliseconds() - localTimeDiff);
			return {
				...r,
				expiresAt: exdate.toISOString().slice(0, 16),
				startsAt: stdate.toISOString().slice(0, 16),
			};
		}));
	});
}

function refresh() {
	os.api('admin/ad/list').then(adsResponse => {
		ads = adsResponse.map(r => {
			const exdate = new Date(r.expiresAt);
			const stdate = new Date(r.startsAt);
			exdate.setMilliseconds(exdate.getMilliseconds() - localTimeDiff);
			stdate.setMilliseconds(stdate.getMilliseconds() - localTimeDiff);
			return {
				...r,
				expiresAt: exdate.toISOString().slice(0, 16),
				startsAt: stdate.toISOString().slice(0, 16),
			};
		});
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
	title: i18n.ts.ads,
	icon: 'ti ti-ad',
});
</script>

<style lang="scss" module>
.ad {
	padding: 32px;

	&:not(:last-child) {
		margin-bottom: var(--margin);
	}
}
</style>
