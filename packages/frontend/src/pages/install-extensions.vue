<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="500">
		<MkLoading v-if="uiPhase === 'fetching'"/>
		<MkExtensionInstaller v-else-if="uiPhase === 'confirm' && data" :extension="data" @confirm="install()">
			<template #additionalInfo>
				<FormSection>
					<template #label>{{ i18n.ts._externalResourceInstaller._vendorInfo.title }}</template>
					<div class="_gaps_s">
						<MkKeyValue>
							<template #key>{{ i18n.ts._externalResourceInstaller._vendorInfo.endpoint }}</template>
							<template #value><MkUrl :url="url" :showUrlPreview="false"></MkUrl></template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>{{ i18n.ts._externalResourceInstaller._vendorInfo.hashVerify }}</template>
							<template #value>
								<!-- この画面が出ている時点でハッシュの検証には成功している -->
								<i class="ti ti-check" style="color: var(--MI_THEME-accent)"></i>
							</template>
						</MkKeyValue>
					</div>
				</FormSection>
			</template>
		</MkExtensionInstaller>
		<div v-else-if="uiPhase === 'error'" class="_gaps_m" :class="[$style.extInstallerRoot, $style.error]">
			<div :class="$style.extInstallerIconWrapper">
				<i class="ti ti-circle-x"></i>
			</div>
			<h2 :class="$style.extInstallerTitle">{{ errorKV?.title }}</h2>
			<div :class="$style.extInstallerNormDesc">{{ errorKV?.description }}</div>
			<div class="_buttonsCenter">
				<MkButton @click="goBack()">{{ i18n.ts.goBack }}</MkButton>
				<MkButton @click="goToMisskey()">{{ i18n.ts.goToMisskey }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, onActivated, onDeactivated, nextTick } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkExtensionInstaller from '@/components/MkExtensionInstaller.vue';
import type { Extension } from '@/components/MkExtensionInstaller.vue';
import MkButton from '@/components/MkButton.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkUrl from '@/components/global/MkUrl.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { parsePluginMeta, installPlugin } from '@/scripts/install-plugin.js';
import type { AiScriptPluginMeta } from '@/scripts/install-plugin.js';
import { parseThemeCode, installTheme } from '@/scripts/install-theme.js';
import { unisonReload } from '@/scripts/unison-reload.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const uiPhase = ref<'fetching' | 'confirm' | 'error'>('fetching');
const errorKV = ref<{
	title?: string;
	description?: string;
}>({
	title: '',
	description: '',
});

const url = ref<string | null>(null);
const hash = ref<string | null>(null);

const data = ref<Extension | null>(null);

function goBack(): void {
	history.back();
}

function goToMisskey(): void {
	location.href = '/';
}

async function fetch() {
	if (!url.value || !hash.value) {
		errorKV.value = {
			title: i18n.ts._externalResourceInstaller._errors._invalidParams.title,
			description: i18n.ts._externalResourceInstaller._errors._invalidParams.description,
		};
		uiPhase.value = 'error';
		return;
	}
	const res = await misskeyApi('fetch-external-resources', {
		url: url.value,
		hash: hash.value,
	}).catch((err) => {
		switch (err.id) {
			case 'bb774091-7a15-4a70-9dc5-6ac8cf125856':
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._failedToFetch.title,
					description: i18n.ts._externalResourceInstaller._errors._failedToFetch.parseErrorDescription,
				};
				uiPhase.value = 'error';
				break;
			case '693ba8ba-b486-40df-a174-72f8279b56a4':
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._hashUnmatched.title,
					description: i18n.ts._externalResourceInstaller._errors._hashUnmatched.description,
				};
				uiPhase.value = 'error';
				break;
			default:
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._failedToFetch.title,
					description: i18n.ts._externalResourceInstaller._errors._failedToFetch.fetchErrorDescription,
				};
				uiPhase.value = 'error';
				break;
		}
		throw new Error(err.code);
	});

	if (!res) {
		errorKV.value = {
			title: i18n.ts._externalResourceInstaller._errors._failedToFetch.title,
			description: i18n.ts._externalResourceInstaller._errors._failedToFetch.fetchErrorDescription,
		};
		uiPhase.value = 'error';
		return;
	}

	switch (res.type) {
		case 'plugin':
			try {
				const meta = await parsePluginMeta(res.data);
				data.value = {
					type: 'plugin',
					meta,
					raw: res.data,
				};
			} catch (err) {
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._pluginParseFailed.title,
					description: i18n.ts._externalResourceInstaller._errors._pluginParseFailed.description,
				};
				console.error(err);
				uiPhase.value = 'error';
				return;
			}
			break;

		case 'theme':
			try {
				const metaRaw = parseThemeCode(res.data);
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id, props, desc: description, ...meta } = metaRaw;
				data.value = {
					type: 'theme',
					meta: {
						// description, // 使用されていない
						...meta,
					},
					raw: res.data,
				};
			} catch (err) {
				switch (err.message.toLowerCase()) {
					case 'this theme is already installed':
						errorKV.value = {
							title: i18n.ts._externalResourceInstaller._errors._themeParseFailed.title,
							description: i18n.ts._theme.alreadyInstalled,
						};
						break;

					default:
						errorKV.value = {
							title: i18n.ts._externalResourceInstaller._errors._themeParseFailed.title,
							description: i18n.ts._externalResourceInstaller._errors._themeParseFailed.description,
						};
						break;
				}
				console.error(err);
				uiPhase.value = 'error';
				return;
			}
			break;

		default:
			errorKV.value = {
				title: i18n.ts._externalResourceInstaller._errors._resourceTypeNotSupported.title,
				description: i18n.ts._externalResourceInstaller._errors._resourceTypeNotSupported.description,
			};
			uiPhase.value = 'error';
			return;
	}

	uiPhase.value = 'confirm';
}

async function install() {
	if (!data.value) return;

	switch (data.value.type) {
		case 'plugin':
			if (!data.value.meta) return;
			try {
				await installPlugin(data.value.raw, data.value.meta as AiScriptPluginMeta);
				os.success();
				nextTick(() => {
					unisonReload('/');
				});
			} catch (err) {
				errorKV.value = {
					title: i18n.ts._externalResourceInstaller._errors._pluginInstallFailed.title,
					description: i18n.ts._externalResourceInstaller._errors._pluginInstallFailed.description,
				};
				console.error(err);
				uiPhase.value = 'error';
			}
			break;
		case 'theme':
			if (!data.value.meta) return;
			await installTheme(data.value.raw);
			os.success();
			nextTick(() => {
				location.href = '/settings/theme';
			});
	}
}

onActivated(() => {
	const urlParams = new URLSearchParams(window.location.search);
	url.value = urlParams.get('url');
	hash.value = urlParams.get('hash');
	fetch();
});

onDeactivated(() => {
	uiPhase.value = 'fetching';
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts._externalResourceInstaller.title,
	icon: 'ti ti-download',
}));
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

.error .extInstallerIconWrapper {
	background-color: rgba(255, 42, 42, .15);
	color: #ff2a2a;
}

.extInstallerTitle {
	font-size: 1.2rem;
	text-align: center;
	margin: 0;
}

.extInstallerNormDesc {
	text-align: center;
}
</style>
