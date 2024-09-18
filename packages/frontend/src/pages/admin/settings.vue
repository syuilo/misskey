<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<FormSuspense :p="init">
				<div class="_gaps_m">
					<MkInput v-model="name">
						<template #label>{{ i18n.ts.instanceName }}</template>
					</MkInput>

					<MkInput v-model="shortName">
						<template #label>{{ i18n.ts._serverSettings.shortName }} ({{ i18n.ts.optional }})</template>
						<template #caption>{{ i18n.ts._serverSettings.shortNameDescription }}</template>
					</MkInput>

					<MkTextarea v-model="description">
						<template #label>{{ i18n.ts.instanceDescription }}</template>
					</MkTextarea>

					<FormSplit :minWidth="300">
						<MkInput v-model="maintainerName">
							<template #label>{{ i18n.ts.maintainerName }}</template>
						</MkInput>

						<MkInput v-model="maintainerEmail" type="email">
							<template #prefix><i class="ti ti-mail"></i></template>
							<template #label>{{ i18n.ts.maintainerEmail }}</template>
						</MkInput>
					</FormSplit>

					<MkInput v-model="repositoryUrl" type="url">
						<template #label>{{ i18n.ts.repositoryUrl }}</template>
						<template #prefix><i class="ti ti-link"></i></template>
						<template #caption>{{ i18n.ts.repositoryUrlDescription }}</template>
					</MkInput>

					<MkInfo v-if="!instance.providesTarball && !repositoryUrl" warn>
						{{ i18n.ts.repositoryUrlOrTarballRequired }}
					</MkInfo>

					<MkInput v-model="impressumUrl" type="url">
						<template #label>{{ i18n.ts.impressumUrl }}</template>
						<template #prefix><i class="ti ti-link"></i></template>
						<template #caption>{{ i18n.ts.impressumDescription }}</template>
					</MkInput>

					<FormSection>
						<template #label>{{ i18n.ts.explore }}</template>

						<div class="_gaps_m">
							<MkTextarea v-model="pinnedUsers">
								<template #label>{{ i18n.ts.pinnedUsers }}</template>
								<template #caption>{{ i18n.ts.pinnedUsersDescription }}</template>
							</MkTextarea>

							<MkRadios v-model="preferPopularUserFactor">
								<template #label>{{ i18n.ts.preferPopularUserFactor }}</template>
								<template #caption>{{ i18n.ts.preferPopularUserFactorDescription }}</template>
								<option value="follower">{{ i18n.ts.followersCount }}</option>
								<option value="pv">{{ i18n.ts.pageViewCount }}</option>
								<option value="none">{{ i18n.ts.disabled }}</option>
							</MkRadios>
						</div>
					</FormSection>

					<FormSection>
						<template #label>{{ i18n.ts.files }}</template>

						<div class="_gaps_m">
							<MkSwitch v-model="cacheRemoteFiles">
								<template #label>{{ i18n.ts.cacheRemoteFiles }}</template>
								<template #caption>{{ i18n.ts.cacheRemoteFilesDescription }}{{ i18n.ts.youCanCleanRemoteFilesCache }}</template>
							</MkSwitch>

							<template v-if="cacheRemoteFiles">
								<MkSwitch v-model="cacheRemoteSensitiveFiles">
									<template #label>{{ i18n.ts.cacheRemoteSensitiveFiles }}</template>
									<template #caption>{{ i18n.ts.cacheRemoteSensitiveFilesDescription }}</template>
								</MkSwitch>
							</template>
						</div>
					</FormSection>

					<FormSection>
						<template #label>ServiceWorker</template>

						<div class="_gaps_m">
							<MkSwitch v-model="enableServiceWorker">
								<template #label>{{ i18n.ts.enableServiceworker }}</template>
								<template #caption>{{ i18n.ts.serviceworkerInfo }}</template>
							</MkSwitch>

							<template v-if="enableServiceWorker">
								<MkInput v-model="swPublicKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label>Public key</template>
								</MkInput>

								<MkInput v-model="swPrivateKey">
									<template #prefix><i class="ti ti-key"></i></template>
									<template #label>Private key</template>
								</MkInput>
							</template>
						</div>
					</FormSection>

					<FormSection>
						<template #label>Misskey® Fan-out Timeline Technology™ (FTT)</template>

						<div class="_gaps_m">
							<MkSwitch v-model="enableFanoutTimeline">
								<template #label>{{ i18n.ts.enable }}</template>
								<template #caption>{{ i18n.ts._serverSettings.fanoutTimelineDescription }}</template>
							</MkSwitch>

							<MkSwitch v-model="enableFanoutTimelineDbFallback">
								<template #label>{{ i18n.ts._serverSettings.fanoutTimelineDbFallback }}</template>
								<template #caption>{{ i18n.ts._serverSettings.fanoutTimelineDbFallbackDescription }}</template>
							</MkSwitch>

							<MkInput v-model="perLocalUserUserTimelineCacheMax" type="number">
								<template #label>perLocalUserUserTimelineCacheMax</template>
							</MkInput>

							<MkInput v-model="perRemoteUserUserTimelineCacheMax" type="number">
								<template #label>perRemoteUserUserTimelineCacheMax</template>
							</MkInput>

							<MkInput v-model="perUserHomeTimelineCacheMax" type="number">
								<template #label>perUserHomeTimelineCacheMax</template>
							</MkInput>

							<MkInput v-model="perUserListTimelineCacheMax" type="number">
								<template #label>perUserListTimelineCacheMax</template>
							</MkInput>
						</div>
					</FormSection>

					<FormSection>
						<template #label>{{ i18n.ts._ad.adsSettings }}</template>

						<div class="_gaps_m">
							<div class="_gaps_s">
								<MkInput v-model="notesPerOneAd" :min="0" type="number">
									<template #label>{{ i18n.ts._ad.notesPerOneAd }}</template>
									<template #caption>{{ i18n.ts._ad.setZeroToDisable }}</template>
								</MkInput>
								<MkInfo v-if="notesPerOneAd > 0 && notesPerOneAd < 20" :warn="true">
									{{ i18n.ts._ad.adsTooClose }}
								</MkInfo>
							</div>
						</div>
					</FormSection>

					<FormSection>
						<template #label>{{ i18n.ts._urlPreviewSetting.title }}</template>

						<div class="_gaps_m">
							<MkSwitch v-model="urlPreviewEnabled">
								<template #label>{{ i18n.ts._urlPreviewSetting.enable }}</template>
							</MkSwitch>

							<MkSwitch v-model="urlPreviewRequireContentLength">
								<template #label>{{ i18n.ts._urlPreviewSetting.requireContentLength }}</template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.requireContentLengthDescription }}</template>
							</MkSwitch>

							<MkInput v-model="urlPreviewMaximumContentLength" type="number">
								<template #label>{{ i18n.ts._urlPreviewSetting.maximumContentLength }}</template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.maximumContentLengthDescription }}</template>
							</MkInput>

							<MkInput v-model="urlPreviewTimeout" type="number">
								<template #label>{{ i18n.ts._urlPreviewSetting.timeout }}</template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.timeoutDescription }}</template>
							</MkInput>

							<MkInput v-model="urlPreviewUserAgent" type="text">
								<template #label>{{ i18n.ts._urlPreviewSetting.userAgent }}</template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.userAgentDescription }}</template>
							</MkInput>

							<div>
								<MkInput v-model="urlPreviewSummaryProxyUrl" type="text">
									<template #label>{{ i18n.ts._urlPreviewSetting.summaryProxy }}</template>
									<template #caption>[{{ i18n.ts.notUsePleaseLeaveBlank }}] {{ i18n.ts._urlPreviewSetting.summaryProxyDescription }}</template>
								</MkInput>

								<div :class="$style.subCaption">
									{{ i18n.ts._urlPreviewSetting.summaryProxyDescription2 }}
									<ul style="padding-left: 20px; margin: 4px 0">
										<li>{{ i18n.ts._urlPreviewSetting.timeout }} / key:timeout</li>
										<li>{{ i18n.ts._urlPreviewSetting.maximumContentLength }} / key:contentLengthLimit</li>
										<li>{{ i18n.ts._urlPreviewSetting.requireContentLength }} / key:contentLengthRequired</li>
										<li>{{ i18n.ts._urlPreviewSetting.userAgent }} / key:userAgent</li>
									</ul>
								</div>
							</div>
						</div>
					</FormSection>
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
import { ref, computed } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInfo from '@/components/MkInfo.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance, instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkRadios from '@/components/MkRadios.vue';
import { entities as MisskeyEntities } from 'misskey-js';

const name = ref<string | null>(null);
const shortName = ref<string | null>(null);
const description = ref<string | null>(null);
const maintainerName = ref<string | null>(null);
const maintainerEmail = ref<string | null>(null);
const repositoryUrl = ref<string | null>(null);
const impressumUrl = ref<string | null>(null);
const pinnedUsers = ref<string>('');
const cacheRemoteFiles = ref<boolean>(false);
const cacheRemoteSensitiveFiles = ref<boolean>(false);
const enableServiceWorker = ref<boolean>(false);
const swPublicKey = ref<string | null>(null);
const swPrivateKey = ref<string | null>(null);
const enableFanoutTimeline = ref<boolean>(false);
const enableFanoutTimelineDbFallback = ref<boolean>(false);
const perLocalUserUserTimelineCacheMax = ref<number>(0);
const perRemoteUserUserTimelineCacheMax = ref<number>(0);
const perUserHomeTimelineCacheMax = ref<number>(0);
const perUserListTimelineCacheMax = ref<number>(0);
const notesPerOneAd = ref<number>(0);
const urlPreviewEnabled = ref<boolean>(true);
const urlPreviewTimeout = ref<number>(10000);
const urlPreviewMaximumContentLength = ref<number>(1024 * 1024 * 10);
const urlPreviewRequireContentLength = ref<boolean>(true);
const urlPreviewUserAgent = ref<string | null>(null);
const urlPreviewSummaryProxyUrl = ref<string | null>(null);
const preferPopularUserFactor = ref<MisskeyEntities.MetaLite['preferPopularUserFactor']>('follower');

async function init(): Promise<void> {
	const meta = await misskeyApi('admin/meta');
	name.value = meta.name;
	shortName.value = meta.shortName;
	description.value = meta.description;
	maintainerName.value = meta.maintainerName;
	maintainerEmail.value = meta.maintainerEmail;
	repositoryUrl.value = meta.repositoryUrl;
	impressumUrl.value = meta.impressumUrl;
	pinnedUsers.value = meta.pinnedUsers.join('\n');
	cacheRemoteFiles.value = meta.cacheRemoteFiles;
	cacheRemoteSensitiveFiles.value = meta.cacheRemoteSensitiveFiles;
	enableServiceWorker.value = meta.enableServiceWorker;
	swPublicKey.value = meta.swPublickey;
	swPrivateKey.value = meta.swPrivateKey;
	enableFanoutTimeline.value = meta.enableFanoutTimeline;
	enableFanoutTimelineDbFallback.value = meta.enableFanoutTimelineDbFallback;
	perLocalUserUserTimelineCacheMax.value = meta.perLocalUserUserTimelineCacheMax;
	perRemoteUserUserTimelineCacheMax.value = meta.perRemoteUserUserTimelineCacheMax;
	perUserHomeTimelineCacheMax.value = meta.perUserHomeTimelineCacheMax;
	perUserListTimelineCacheMax.value = meta.perUserListTimelineCacheMax;
	notesPerOneAd.value = meta.notesPerOneAd;
	urlPreviewEnabled.value = meta.urlPreviewEnabled;
	urlPreviewTimeout.value = meta.urlPreviewTimeout;
	urlPreviewMaximumContentLength.value = meta.urlPreviewMaximumContentLength;
	urlPreviewRequireContentLength.value = meta.urlPreviewRequireContentLength;
	urlPreviewUserAgent.value = meta.urlPreviewUserAgent;
	urlPreviewSummaryProxyUrl.value = meta.urlPreviewSummaryProxyUrl;
	preferPopularUserFactor.value = meta.preferPopularUserFactor;
}

async function save() {
	await os.apiWithDialog('admin/update-meta', {
		name: name.value,
		shortName: shortName.value === '' ? null : shortName.value,
		description: description.value,
		maintainerName: maintainerName.value,
		maintainerEmail: maintainerEmail.value,
		repositoryUrl: repositoryUrl.value,
		impressumUrl: impressumUrl.value,
		pinnedUsers: pinnedUsers.value.split('\n'),
		cacheRemoteFiles: cacheRemoteFiles.value,
		cacheRemoteSensitiveFiles: cacheRemoteSensitiveFiles.value,
		enableServiceWorker: enableServiceWorker.value,
		swPublicKey: swPublicKey.value,
		swPrivateKey: swPrivateKey.value,
		enableFanoutTimeline: enableFanoutTimeline.value,
		enableFanoutTimelineDbFallback: enableFanoutTimelineDbFallback.value,
		perLocalUserUserTimelineCacheMax: perLocalUserUserTimelineCacheMax.value,
		perRemoteUserUserTimelineCacheMax: perRemoteUserUserTimelineCacheMax.value,
		perUserHomeTimelineCacheMax: perUserHomeTimelineCacheMax.value,
		perUserListTimelineCacheMax: perUserListTimelineCacheMax.value,
		notesPerOneAd: notesPerOneAd.value,
		urlPreviewEnabled: urlPreviewEnabled.value,
		urlPreviewTimeout: urlPreviewTimeout.value,
		urlPreviewMaximumContentLength: urlPreviewMaximumContentLength.value,
		urlPreviewRequireContentLength: urlPreviewRequireContentLength.value,
		urlPreviewUserAgent: urlPreviewUserAgent.value,
		urlPreviewSummaryProxyUrl: urlPreviewSummaryProxyUrl.value,
		preferPopularUserFactor: preferPopularUserFactor.value,
	});

	fetchInstance(true);
}

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.general,
	icon: 'ti ti-settings',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}

.subCaption {
	font-size: 0.85em;
	color: var(--fgTransparentWeak);
}
</style>
