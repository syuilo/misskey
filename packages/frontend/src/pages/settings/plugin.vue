<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormLink to="/settings/plugin/install"><template #icon><i class="ti ti-download"></i></template>{{ i18n.ts._plugin.install }}</FormLink>

	<FormSection>
		<template #label>{{ i18n.ts.manage }}</template>
		<div class="_gaps_s">
			<div v-for="plugin in plugins" :key="plugin.id" class="_panel _gaps_s" style="padding: 20px;">
				<span style="display: flex;"><b>{{ plugin.name }}</b><span style="margin-left: auto;">v{{ plugin.version }}</span></span>

				<MkSwitch :modelValue="plugin.active" @update:modelValue="changeActive(plugin, $event)">{{ i18n.ts.makeActive }}</MkSwitch>

				<MkKeyValue>
					<template #key>{{ i18n.ts.author }}</template>
					<template #value>{{ plugin.author }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.description }}</template>
					<template #value>{{ plugin.description }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.permission }}</template>
					<template #value>{{ plugin.permission }}</template>
				</MkKeyValue>

				<div class="_buttons">
					<MkButton v-if="plugin.config" inline @click="config(plugin)"><i class="ti ti-settings"></i> {{ i18n.ts.settings }}</MkButton>
					<MkButton inline danger @click="uninstall(plugin)"><i class="ti ti-trash"></i> {{ i18n.ts.uninstall }}</MkButton>
				</div>
			</div>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { nextTick, ref } from 'vue';
import FormLink from '@/components/form/link.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const plugins = ref(ColdDeviceStorage.get('plugins'));

function uninstall(plugin) {
	ColdDeviceStorage.set('plugins', plugins.value.filter(x => x.id !== plugin.id));
	os.success();
	nextTick(() => {
		unisonReload();
	});
}

// TODO: この処理をstore側にactionとして移動し、設定画面を開くAiScriptAPIを実装できるようにする
async function config(plugin) {
	const config = plugin.config;
	for (const key in plugin.configData) {
		config[key].default = plugin.configData[key];
	}

	const { canceled, result } = await os.form(plugin.name, config);
	if (canceled) return;

	const coldPlugins = ColdDeviceStorage.get('plugins');
	coldPlugins.find(p => p.id === plugin.id)!.configData = result;
	ColdDeviceStorage.set('plugins', coldPlugins);

	nextTick(() => {
		location.reload();
	});
}

function changeActive(plugin, active) {
	const coldPlugins = ColdDeviceStorage.get('plugins');
	coldPlugins.find(p => p.id === plugin.id)!.active = active;
	ColdDeviceStorage.set('plugins', coldPlugins);

	nextTick(() => {
		location.reload();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.plugins,
	icon: 'ti ti-plug',
});
</script>
