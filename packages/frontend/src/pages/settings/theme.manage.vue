<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="selectedThemeId">
		<template #label>{{ i18n.ts.theme }}</template>
		<optgroup :label="i18n.ts._theme.installedThemes">
			<option v-for="x in installedThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
		</optgroup>
		<optgroup :label="i18n.ts._theme.builtinThemes">
			<option v-for="x in builtinThemes" :key="x.id" :value="x.id">{{ x.name }}</option>
		</optgroup>
	</MkSelect>
	<template v-if="selectedTheme">
		<MkInput readonly :modelValue="selectedTheme.author">
			<template #label>{{ i18n.ts.author }}</template>
		</MkInput>
		<MkTextarea v-if="selectedTheme.desc" readonly :modelValue="selectedTheme.desc">
			<template #label>{{ i18n.ts._theme.description }}</template>
		</MkTextarea>
		<MkTextarea readonly tall :modelValue="selectedThemeCode">
			<template #label>{{ i18n.ts._theme.code }}</template>
			<template #caption><button class="_textButton" @click="copyThemeCode()">{{ i18n.ts.copy }}</button></template>
		</MkTextarea>
		<MkButton v-if="!builtinThemes.some(t => t.id == selectedTheme.id)" danger @click="uninstall()"><i class="ti ti-trash"></i> {{ i18n.ts.uninstall }}</MkButton>
	</template>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import JSON5 from 'json5';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { getBuiltinThemesRef } from '@/scripts/theme.js';
import type { Theme } from '@/scripts/theme.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import * as os from '@/os.js';
import { getThemes, removeTheme } from '@/theme-store.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const installedThemes = ref(getThemes());
const builtinThemes = getBuiltinThemesRef();
const selectedThemeId = ref<string | null>(null);

const themes = computed(() => [...installedThemes.value, ...builtinThemes.value]);

const selectedTheme = computed(() => {
	if (selectedThemeId.value == null) return null;
	return themes.value.find(x => x.id === selectedThemeId.value);
});

const selectedThemeCode = computed(() => {
	if (selectedTheme.value == null) return null;
	return JSON5.stringify(selectedTheme.value, null, '\t');
});

function copyThemeCode() {
	copyToClipboard(selectedThemeCode.value);
	os.success();
}

function uninstall() {
	removeTheme(selectedTheme.value as Theme);
	installedThemes.value = installedThemes.value.filter(t => t.id !== selectedThemeId.value);
	selectedThemeId.value = null;
	os.success();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts._theme.manage,
	icon: 'ti ti-tool',
}));
</script>
