<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkTextarea v-model="installThemeCode">
		<template #label>{{ i18n.ts._theme.code }}</template>
	</MkTextarea>

	<div class="_buttons">
		<MkButton :disabled="installThemeCode == null" inline @click="() => preview(installThemeCode)"><i class="ti ti-eye"></i> {{ i18n.ts.preview }}</MkButton>
		<MkButton :disabled="installThemeCode == null" primary inline @click="() => install(installThemeCode)"><i class="ti ti-check"></i> {{ i18n.ts.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import JSON5 from 'json5';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import { applyTheme, validateTheme } from '@/scripts/theme';
import * as os from '@/os';
import { addTheme, getThemes } from '@/theme-store';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let installThemeCode = $ref(null);

function parseThemeCode(code: string) {
	let theme;

	try {
		theme = JSON5.parse(code);
	} catch (err) {
		os.alert({
			type: 'error',
			text: i18n.ts._theme.invalid,
		});
		return false;
	}
	if (!validateTheme(theme)) {
		os.alert({
			type: 'error',
			text: i18n.ts._theme.invalid,
		});
		return false;
	}
	if (getThemes().some(t => t.id === theme.id)) {
		os.alert({
			type: 'info',
			text: i18n.ts._theme.alreadyInstalled,
		});
		return false;
	}

	return theme;
}

function preview(code: string): void {
	const theme = parseThemeCode(code);
	if (theme) applyTheme(theme, false);
}

async function install(code: string): Promise<void> {
	const theme = parseThemeCode(code);
	if (!theme) return;
	await addTheme(theme);
	os.alert({
		type: 'success',
		text: i18n.t('_theme.installed', { name: theme.name }),
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts._theme.install,
	icon: 'ti ti-download',
});
</script>
