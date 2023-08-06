<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<FormSuspense :p="init">
				<div class="_gaps_m">
					<MkInput v-model="iconUrl">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.iconUrl }}</template>
					</MkInput>

					<MkInput v-model="bannerUrl">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.bannerUrl }}</template>
					</MkInput>

					<MkInput v-model="backgroundImageUrl">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.backgroundImageUrl }}</template>
					</MkInput>

					<MkInput v-model="notFoundImageUrl">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.notFoundDescription }}</template>
					</MkInput>

					<MkInput v-model="infoImageUrl">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.nothing }}</template>
					</MkInput>

					<MkInput v-model="serverErrorImageUrl">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.somethingHappened }}</template>
					</MkInput>

					<MkColorInput v-model="themeColor">
						<template #label>{{ i18n.ts.themeColor }}</template>
					</MkColorInput>

					<MkTextarea v-model="defaultLightTheme">
						<template #label>{{ i18n.ts.instanceDefaultLightTheme }}</template>
						<template #caption>{{ i18n.ts.instanceDefaultThemeDescription }}</template>
					</MkTextarea>

					<MkTextarea v-model="defaultDarkTheme">
						<template #label>{{ i18n.ts.instanceDefaultDarkTheme }}</template>
						<template #caption>{{ i18n.ts.instanceDefaultThemeDescription }}</template>
					</MkTextarea>
				</div>
			</FormSuspense>
		</MkSpacer>
		<template #footer>
			<div :class="$style.footer">
				<MkSpacer :contentMax="700" :marginMin="16" :marginMax="16">
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				</MkSpacer>
			</div>
		</template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkButton from '@/components/MkButton.vue';
import MkColorInput from '@/components/MkColorInput.vue';

let iconUrl: string | null = $ref(null);
let bannerUrl: string | null = $ref(null);
let backgroundImageUrl: string | null = $ref(null);
let themeColor: any = $ref(null);
let defaultLightTheme: any = $ref(null);
let defaultDarkTheme: any = $ref(null);
let serverErrorImageUrl: string | null = $ref(null);
let infoImageUrl: string | null = $ref(null);
let notFoundImageUrl: string | null = $ref(null);

async function init() {
	const meta = await os.api('admin/meta');
	iconUrl = meta.iconUrl;
	bannerUrl = meta.bannerUrl;
	backgroundImageUrl = meta.backgroundImageUrl;
	themeColor = meta.themeColor;
	defaultLightTheme = meta.defaultLightTheme;
	defaultDarkTheme = meta.defaultDarkTheme;
	serverErrorImageUrl = meta.serverErrorImageUrl;
	infoImageUrl = meta.infoImageUrl;
	notFoundImageUrl = meta.notFoundImageUrl;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		iconUrl,
		bannerUrl,
		backgroundImageUrl,
		themeColor: themeColor === '' ? null : themeColor,
		defaultLightTheme: defaultLightTheme === '' ? null : defaultLightTheme,
		defaultDarkTheme: defaultDarkTheme === '' ? null : defaultDarkTheme,
		infoImageUrl,
		notFoundImageUrl,
		serverErrorImageUrl,
	}).then(() => {
		fetchInstance();
	});
}

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.branding,
	icon: 'ti ti-paint',
});
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
