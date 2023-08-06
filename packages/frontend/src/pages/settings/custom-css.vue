<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormInfo warn>{{ i18n.ts.customCssWarn }}</FormInfo>

	<MkTextarea v-model="localCustomCss" manualSave tall class="_monospace" style="tab-size: 2;">
		<template #label>CSS</template>
	</MkTextarea>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref, watch } from 'vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { miLocalStorage } from '@/local-storage';

const localCustomCss = ref(miLocalStorage.getItem('customCss') ?? '');

async function apply() {
	miLocalStorage.setItem('customCss', localCustomCss.value);

	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

watch(localCustomCss, async () => {
	await apply();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.customCss,
	icon: 'ti ti-code',
});
</script>
