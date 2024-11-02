<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m" :class="$style.extInstallerRoot">
	<div :class="$style.extInstallerIconWrapper">
		<i v-if="isPlugin" class="ti ti-plug"></i>
		<i v-else-if="isTheme" class="ti ti-palette"></i>
		<!-- 拡張用？ -->
		<i v-else class="ti ti-download"></i>
	</div>
	<h2 :class="$style.extInstallerTitle">{{ i18n.ts._externalResourceInstaller[`_${extension.type}`].title }}</h2>
	<div :class="$style.extInstallerNormDesc">{{ i18n.ts._externalResourceInstaller.checkVendorBeforeInstall }}</div>
	<MkInfo v-if="isPlugin" :warn="true">{{ i18n.ts._plugin.installWarn }}</MkInfo>
	<FormSection>
		<template #label>{{ i18n.ts._externalResourceInstaller[`_${extension.type}`].metaTitle }}</template>
		<div class="_gaps_s">
			<FormSplit>
				<MkKeyValue>
					<template #key>{{ i18n.ts.name }}</template>
					<template #value>{{ extension.meta.name }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.author }}</template>
					<template #value>{{ extension.meta.author }}</template>
				</MkKeyValue>
			</FormSplit>
			<MkKeyValue v-if="isPlugin">
				<template #key>{{ i18n.ts.description }}</template>
				<template #value>{{ extension.meta.description ?? i18n.ts.none }}</template>
			</MkKeyValue>
			<MkKeyValue v-if="isPlugin">
				<template #key>{{ i18n.ts.version }}</template>
				<template #value>{{ extension.meta.version }}</template>
			</MkKeyValue>
			<MkKeyValue v-if="isPlugin">
				<template #key>{{ i18n.ts.permission }}</template>
				<template #value>
					<ul v-if="extension.meta.permissions && extension.meta.permissions.length > 0" :class="$style.extInstallerKVList">
						<li v-for="permission in extension.meta.permissions" :key="permission">{{ i18n.ts._permissions[permission] }}</li>
					</ul>
					<template v-else>{{ i18n.ts.none }}</template>
				</template>
			</MkKeyValue>
			<MkKeyValue v-if="isTheme">
				<template #key>{{ i18n.ts._externalResourceInstaller._meta.base }}</template>
				<template #value>{{ i18n.ts[extension.meta.base ?? 'none'] }}</template>
			</MkKeyValue>
			<MkFolder>
				<template #icon><i class="ti ti-code"></i></template>
				<template #label>{{ i18n.ts._plugin.viewSource }}</template>

				<MkCode :code="extension.raw"/>
			</MkFolder>
		</div>
	</FormSection>
	<slot name="additionalInfo"/>
	<div class="_buttonsCenter">
		<MkButton primary @click="emits('confirm')"><i class="ti ti-check"></i> {{ i18n.ts.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts">
export type Extension = {
	type: 'plugin';
	raw: string;
	meta: {
		name: string;
		version: string;
		author: string;
		description?: string;
		permissions?: string[];
		config?: Record<string, unknown>;
	};
} | {
	type: 'theme';
	raw: string;
	meta: {
		name: string;
		author: string;
		base?: 'light' | 'dark';
	};
};
</script>
<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import MkCode from '@/components/MkCode.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import { i18n } from '@/i18n.js';

const isPlugin = computed(() => props.extension.type === 'plugin');
const isTheme = computed(() => props.extension.type === 'theme');

const props = defineProps<{
	extension: Extension;
}>();

const emits = defineEmits<{
	(ev: 'confirm'): void;
}>();
</script>

<style lang="scss" module>
.extInstallerRoot {
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	padding: 1.5rem;
}

.extInstallerIconWrapper {
	width: 48px;
	height: 48px;
	font-size: 24px;
	line-height: 48px;
	text-align: center;
	border-radius: 50%;
	margin-left: auto;
	margin-right: auto;

	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.extInstallerTitle {
	font-size: 1.2rem;
	text-align: center;
	margin: 0;
}

.extInstallerNormDesc {
	text-align: center;
}

.extInstallerKVList {
	margin-top: 0;
	margin-bottom: 0;
}
</style>
