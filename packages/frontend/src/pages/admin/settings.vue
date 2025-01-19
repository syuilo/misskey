<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<div class="_gaps_m">
				<MkFolder :defaultOpen="true">
					<template #icon><i class="ti ti-info-circle"></i></template>
					<template #label>{{ i18n.ts.info }}</template>
					<template v-if="infoForm.modified.value" #footer>
						<MkFormFooter :form="infoForm"/>
					</template>

					<div class="_gaps">
						<MkInput v-model="infoForm.state.name">
							<template #label>{{ i18n.ts.instanceName }}<span v-if="infoForm.modifiedStates.name" class="_modified">{{ i18n.ts.modified }}</span></template>
						</MkInput>

						<MkInput v-model="infoForm.state.shortName">
							<template #label>{{ i18n.ts._serverSettings.shortName }} ({{ i18n.ts.optional }})<span v-if="infoForm.modifiedStates.shortName" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts._serverSettings.shortNameDescription }}</template>
						</MkInput>

						<MkTextarea v-model="infoForm.state.description">
							<template #label>{{ i18n.ts.instanceDescription }}<span v-if="infoForm.modifiedStates.description" class="_modified">{{ i18n.ts.modified }}</span></template>
						</MkTextarea>

						<FormSplit :minWidth="300">
							<MkInput v-model="infoForm.state.maintainerName">
								<template #label>{{ i18n.ts.maintainerName }}<span v-if="infoForm.modifiedStates.maintainerName" class="_modified">{{ i18n.ts.modified }}</span></template>
							</MkInput>

							<MkInput v-model="infoForm.state.maintainerEmail" type="email">
								<template #label>{{ i18n.ts.maintainerEmail }}<span v-if="infoForm.modifiedStates.maintainerEmail" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #prefix><i class="ti ti-mail"></i></template>
							</MkInput>
						</FormSplit>

						<MkInput v-model="infoForm.state.tosUrl" type="url">
							<template #label>{{ i18n.ts.tosUrl }}<span v-if="infoForm.modifiedStates.tosUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #prefix><i class="ti ti-link"></i></template>
						</MkInput>

						<MkInput v-model="infoForm.state.privacyPolicyUrl" type="url">
							<template #label>{{ i18n.ts.privacyPolicyUrl }}<span v-if="infoForm.modifiedStates.privacyPolicyUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #prefix><i class="ti ti-link"></i></template>
						</MkInput>

						<MkInput v-model="infoForm.state.inquiryUrl" type="url">
							<template #label>{{ i18n.ts._serverSettings.inquiryUrl }}<span v-if="infoForm.modifiedStates.inquiryUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts._serverSettings.inquiryUrlDescription }}</template>
							<template #prefix><i class="ti ti-link"></i></template>
						</MkInput>

						<MkInput v-model="infoForm.state.repositoryUrl" type="url">
							<template #label>{{ i18n.ts.repositoryUrl }}<span v-if="infoForm.modifiedStates.repositoryUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts.repositoryUrlDescription }}</template>
							<template #prefix><i class="ti ti-link"></i></template>
						</MkInput>

						<MkInfo v-if="!instance.providesTarball && !infoForm.state.repositoryUrl" warn>
							{{ i18n.ts.repositoryUrlOrTarballRequired }}
						</MkInfo>

						<MkInput v-model="infoForm.state.impressumUrl" type="url">
							<template #label>{{ i18n.ts.impressumUrl }}<span v-if="infoForm.modifiedStates.impressumUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts.impressumDescription }}</template>
							<template #prefix><i class="ti ti-link"></i></template>
						</MkInput>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-user-star"></i></template>
					<template #label>{{ i18n.ts.pinnedUsers }}</template>
					<template v-if="pinnedUsersForm.modified.value" #footer>
						<MkFormFooter :form="pinnedUsersForm"/>
					</template>

					<MkTextarea v-model="pinnedUsersForm.state.pinnedUsers">
						<template #label>{{ i18n.ts.pinnedUsers }}<span v-if="pinnedUsersForm.modifiedStates.pinnedUsers" class="_modified">{{ i18n.ts.modified }}</span></template>
						<template #caption>{{ i18n.ts.pinnedUsersDescription }}</template>
					</MkTextarea>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-cloud"></i></template>
					<template #label>{{ i18n.ts.files }}</template>
					<template v-if="filesForm.modified.value" #footer>
						<MkFormFooter :form="filesForm"/>
					</template>

					<div class="_gaps">
						<MkSwitch v-model="filesForm.state.cacheRemoteFiles">
							<template #label>{{ i18n.ts.cacheRemoteFiles }}<span v-if="filesForm.modifiedStates.cacheRemoteFiles" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts.cacheRemoteFilesDescription }}{{ i18n.ts.youCanCleanRemoteFilesCache }}</template>
						</MkSwitch>

						<template v-if="filesForm.state.cacheRemoteFiles">
							<MkSwitch v-model="filesForm.state.cacheRemoteSensitiveFiles">
								<template #label>{{ i18n.ts.cacheRemoteSensitiveFiles }}<span v-if="filesForm.modifiedStates.cacheRemoteSensitiveFiles" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #caption>{{ i18n.ts.cacheRemoteSensitiveFilesDescription }}</template>
							</MkSwitch>
						</template>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-world-cog"></i></template>
					<template #label>ServiceWorker</template>
					<template v-if="serviceWorkerForm.modified.value" #footer>
						<MkFormFooter :form="serviceWorkerForm"/>
					</template>

					<div class="_gaps">
						<MkSwitch v-model="serviceWorkerForm.state.enableServiceWorker">
							<template #label>{{ i18n.ts.enableServiceworker }}<span v-if="serviceWorkerForm.modifiedStates.enableServiceWorker" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts.serviceworkerInfo }}</template>
						</MkSwitch>

						<template v-if="serviceWorkerForm.state.enableServiceWorker">
							<MkInput v-model="serviceWorkerForm.state.swPublicKey">
								<template #label>Public key<span v-if="serviceWorkerForm.modifiedStates.swPublicKey" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #prefix><i class="ti ti-key"></i></template>
							</MkInput>

							<MkInput v-model="serviceWorkerForm.state.swPrivateKey">
								<template #label>Private key<span v-if="serviceWorkerForm.modifiedStates.swPrivateKey" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #prefix><i class="ti ti-key"></i></template>
							</MkInput>
						</template>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-ad"></i></template>
					<template #label>{{ i18n.ts._ad.adsSettings }}</template>
					<template v-if="adForm.modified.value" #footer>
						<MkFormFooter :form="adForm"/>
					</template>

					<div class="_gaps">
						<div class="_gaps_s">
							<MkInput v-model="adForm.state.notesPerOneAd" :min="0" type="number">
								<template #label>{{ i18n.ts._ad.notesPerOneAd }}<span v-if="adForm.modifiedStates.notesPerOneAd" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #caption>{{ i18n.ts._ad.setZeroToDisable }}</template>
							</MkInput>
							<MkInfo v-if="adForm.state.notesPerOneAd > 0 && adForm.state.notesPerOneAd < 20" :warn="true">
								{{ i18n.ts._ad.adsTooClose }}
							</MkInfo>
						</div>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-world-search"></i></template>
					<template #label>{{ i18n.ts._urlPreviewSetting.title }}</template>
					<template v-if="urlPreviewForm.modified.value" #footer>
						<MkFormFooter :form="urlPreviewForm"/>
					</template>

					<div class="_gaps">
						<MkSwitch v-model="urlPreviewForm.state.urlPreviewEnabled">
							<template #label>{{ i18n.ts._urlPreviewSetting.enable }}<span v-if="urlPreviewForm.modifiedStates.urlPreviewEnabled" class="_modified">{{ i18n.ts.modified }}</span></template>
						</MkSwitch>

						<template v-if="urlPreviewForm.state.urlPreviewEnabled">
							<MkSwitch v-model="urlPreviewForm.state.urlPreviewRequireContentLength">
								<template #label>{{ i18n.ts._urlPreviewSetting.requireContentLength }}<span v-if="urlPreviewForm.modifiedStates.urlPreviewRequireContentLength" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.requireContentLengthDescription }}</template>
							</MkSwitch>

							<MkInput v-model="urlPreviewForm.state.urlPreviewMaximumContentLength" type="number">
								<template #label>{{ i18n.ts._urlPreviewSetting.maximumContentLength }}<span v-if="urlPreviewForm.modifiedStates.urlPreviewMaximumContentLength" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.maximumContentLengthDescription }}</template>
							</MkInput>

							<MkInput v-model="urlPreviewForm.state.urlPreviewTimeout" type="number">
								<template #label>{{ i18n.ts._urlPreviewSetting.timeout }}<span v-if="urlPreviewForm.modifiedStates.urlPreviewTimeout" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.timeoutDescription }}</template>
							</MkInput>

							<MkInput v-model="urlPreviewForm.state.urlPreviewUserAgent" type="text">
								<template #label>{{ i18n.ts._urlPreviewSetting.userAgent }}<span v-if="urlPreviewForm.modifiedStates.urlPreviewUserAgent" class="_modified">{{ i18n.ts.modified }}</span></template>
								<template #caption>{{ i18n.ts._urlPreviewSetting.userAgentDescription }}</template>
							</MkInput>

							<div>
								<MkInput v-model="urlPreviewForm.state.urlPreviewSummaryProxyUrl" type="text">
									<template #label>{{ i18n.ts._urlPreviewSetting.summaryProxy }}<span v-if="urlPreviewForm.modifiedStates.urlPreviewSummaryProxyUrl" class="_modified">{{ i18n.ts.modified }}</span></template>
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
						</template>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-planet"></i></template>
					<template #label>{{ i18n.ts.federation }}</template>
					<template v-if="federationForm.savedState.federation === 'all'" #suffix>{{ i18n.ts.all }}</template>
					<template v-else-if="federationForm.savedState.federation === 'specified'" #suffix>{{ i18n.ts.specifyHost }}</template>
					<template v-else-if="federationForm.savedState.federation === 'none'" #suffix>{{ i18n.ts.none }}</template>
					<template v-if="federationForm.modified.value" #footer>
						<MkFormFooter :form="federationForm"/>
					</template>

					<div class="_gaps">
						<MkRadios v-model="federationForm.state.federation">
							<template #label>{{ i18n.ts.behavior }}<span v-if="federationForm.modifiedStates.federation" class="_modified">{{ i18n.ts.modified }}</span></template>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="specified">{{ i18n.ts.specifyHost }}</option>
							<option value="none">{{ i18n.ts.none }}</option>
						</MkRadios>

						<MkTextarea v-if="federationForm.state.federation === 'specified'" v-model="federationForm.state.federationHosts">
							<template #label>{{ i18n.ts.federationAllowedHosts }}<span v-if="federationForm.modifiedStates.federationHosts" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts.federationAllowedHostsDescription }}</template>
						</MkTextarea>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-ghost"></i></template>
					<template #label>{{ i18n.ts.proxyAccount }}</template>

					<div class="_gaps">
						<MkInfo>{{ i18n.ts.proxyAccountDescription }}</MkInfo>
						<MkKeyValue>
							<template #key>{{ i18n.ts.proxyAccount }}</template>
							<template #value>{{ proxyAccount ? `@${proxyAccount.username}` : i18n.ts.none }}</template>
						</MkKeyValue>

						<MkButton primary @click="chooseProxyAccount">{{ i18n.ts.selectAccount }}</MkButton>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-bolt"></i></template>
					<template #label>{{ i18n.ts._featuredSetting.title }}</template>
					<template v-if="featuredForm.modified.value" #footer>
						<MkFormFooter :form="featuredForm"/>
					</template>

					<div class="_gaps_m">
						<MkRange v-model="featuredForm.state.featuredUpdateRatio" :min="0" :max="1" :step="0.05">
							<template #label>{{ i18n.ts._featuredSetting.updateRatio }} <span v-if="featuredForm.modifiedStates.featuredUpdateRatio" class="_modified">{{ i18n.ts.modified }}</span></template>
							<template #caption>{{ i18n.ts._featuredSetting.updateRatioDescription }}</template>
						</MkRange>
					</div>
				</MkFolder>
			</div>
		</MkSpacer>
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
import FormSplit from '@/components/form/split.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { fetchInstance, instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkRange from '@/components/MkRange.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import { useForm } from '@/scripts/use-form.js';
import MkFormFooter from '@/components/MkFormFooter.vue';
import MkRadios from '@/components/MkRadios.vue';

const meta = await misskeyApi('admin/meta');

const proxyAccount = ref(meta.proxyAccountId ? await misskeyApi('users/show', { userId: meta.proxyAccountId }) : null);

const infoForm = useForm({
	name: meta.name ?? '',
	shortName: meta.shortName ?? '',
	description: meta.description ?? '',
	maintainerName: meta.maintainerName ?? '',
	maintainerEmail: meta.maintainerEmail ?? '',
	tosUrl: meta.tosUrl ?? '',
	privacyPolicyUrl: meta.privacyPolicyUrl ?? '',
	inquiryUrl: meta.inquiryUrl ?? '',
	repositoryUrl: meta.repositoryUrl ?? '',
	impressumUrl: meta.impressumUrl ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		name: state.name,
		shortName: state.shortName === '' ? null : state.shortName,
		description: state.description,
		maintainerName: state.maintainerName,
		maintainerEmail: state.maintainerEmail,
		tosUrl: state.tosUrl,
		privacyPolicyUrl: state.privacyPolicyUrl,
		inquiryUrl: state.inquiryUrl,
		repositoryUrl: state.repositoryUrl,
		impressumUrl: state.impressumUrl,
	});
	fetchInstance(true);
});

const pinnedUsersForm = useForm({
	pinnedUsers: meta.pinnedUsers.join('\n'),
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		pinnedUsers: state.pinnedUsers.split('\n'),
	});
	fetchInstance(true);
});

const filesForm = useForm({
	cacheRemoteFiles: meta.cacheRemoteFiles,
	cacheRemoteSensitiveFiles: meta.cacheRemoteSensitiveFiles,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		cacheRemoteFiles: state.cacheRemoteFiles,
		cacheRemoteSensitiveFiles: state.cacheRemoteSensitiveFiles,
	});
	fetchInstance(true);
});

const serviceWorkerForm = useForm({
	enableServiceWorker: meta.enableServiceWorker,
	swPublicKey: meta.swPublickey ?? '',
	swPrivateKey: meta.swPrivateKey ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		enableServiceWorker: state.enableServiceWorker,
		swPublicKey: state.swPublicKey,
		swPrivateKey: state.swPrivateKey,
	});
	fetchInstance(true);
});

const adForm = useForm({
	notesPerOneAd: meta.notesPerOneAd,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		notesPerOneAd: state.notesPerOneAd,
	});
	fetchInstance(true);
});

const urlPreviewForm = useForm({
	urlPreviewEnabled: meta.urlPreviewEnabled,
	urlPreviewTimeout: meta.urlPreviewTimeout,
	urlPreviewMaximumContentLength: meta.urlPreviewMaximumContentLength,
	urlPreviewRequireContentLength: meta.urlPreviewRequireContentLength,
	urlPreviewUserAgent: meta.urlPreviewUserAgent ?? '',
	urlPreviewSummaryProxyUrl: meta.urlPreviewSummaryProxyUrl ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		urlPreviewEnabled: state.urlPreviewEnabled,
		urlPreviewTimeout: state.urlPreviewTimeout,
		urlPreviewMaximumContentLength: state.urlPreviewMaximumContentLength,
		urlPreviewRequireContentLength: state.urlPreviewRequireContentLength,
		urlPreviewUserAgent: state.urlPreviewUserAgent,
		urlPreviewSummaryProxyUrl: state.urlPreviewSummaryProxyUrl,
	});
	fetchInstance(true);
});

const federationForm = useForm({
	federation: meta.federation,
	federationHosts: meta.federationHosts.join('\n'),
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		federation: state.federation,
		federationHosts: state.federationHosts.split('\n'),
	});
	fetchInstance(true);
});

const featuredForm = useForm({
	featuredUpdateRatio: meta.featuredUpdateRatio,
}, async (state) => {
	await os.apiWithDialog('admin/update-meta', {
		featuredUpdateRatio: state.featuredUpdateRatio,
	});
	fetchInstance(true);
});

function chooseProxyAccount() {
	os.selectUser({ localOnly: true }).then(user => {
		proxyAccount.value = user;
		os.apiWithDialog('admin/update-meta', {
			proxyAccountId: user.id,
		}).then(() => {
			fetchInstance(true);
		});
	});
}

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.general,
	icon: 'ti ti-settings',
}));
</script>

<style lang="scss" module>
.subCaption {
	font-size: 0.85em;
	color: var(--MI_THEME-fgTransparentWeak);
}
</style>
