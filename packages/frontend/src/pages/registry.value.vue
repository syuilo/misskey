<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="600" :marginMin="16">
		<div class="_gaps_m">
			<FormInfo warn>{{ i18n.ts.editTheseSettingsMayBreakAccount }}</FormInfo>

			<template v-if="value">
				<FormSplit>
					<MkKeyValue>
						<template #key>{{ i18n.ts._registry.domain }}</template>
						<template #value>{{ i18n.ts.system }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ i18n.ts._registry.scope }}</template>
						<template #value>{{ scope.join('/') }}</template>
					</MkKeyValue>
					<MkKeyValue>
						<template #key>{{ i18n.ts._registry.key }}</template>
						<template #value>{{ key }}</template>
					</MkKeyValue>
				</FormSplit>

				<MkTextarea v-model="valueForEditor" tall class="_monospace">
					<template #label>{{ i18n.ts.value }} (JSON)</template>
				</MkTextarea>

				<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>

				<MkKeyValue>
					<template #key>{{ i18n.ts.updatedAt }}</template>
					<template #value><MkTime :time="value.updatedAt" mode="detail"/></template>
				</MkKeyValue>

				<MkButton danger @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</template>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { watch } from 'vue';
import JSON5 from 'json5';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkButton from '@/components/MkButton.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSplit from '@/components/form/split.vue';
import FormInfo from '@/components/MkInfo.vue';

const props = defineProps<{
	path: string;
}>();

const scope = $computed(() => props.path.split('/').slice(0, -1));
const key = $computed(() => props.path.split('/').at(-1));

let value = $ref(null);
let valueForEditor = $ref(null);

function fetchValue() {
	os.api('i/registry/get-detail', {
		scope,
		key,
	}).then(res => {
		value = res;
		valueForEditor = JSON5.stringify(res.value, null, '\t');
	});
}

async function save() {
	try {
		JSON5.parse(valueForEditor);
	} catch (err) {
		os.alert({
			type: 'error',
			text: i18n.ts.invalidValue,
		});
		return;
	}
	os.confirm({
		type: 'warning',
		text: i18n.ts.saveConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;
		os.apiWithDialog('i/registry/set', {
			scope,
			key,
			value: JSON5.parse(valueForEditor),
		});
	});
}

function del() {
	os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;
		os.apiWithDialog('i/registry/remove', {
			scope,
			key,
		});
	});
}

watch(() => props.path, fetchValue, { immediate: true });

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.registry,
	icon: 'ti ti-adjustments',
});
</script>
