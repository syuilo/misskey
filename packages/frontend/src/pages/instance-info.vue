<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="instance" :contentMax="600" :marginMin="16" :marginMax="32">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<div v-if="tab === 'overview'" key="overview" class="_gaps_m">
				<div class="fnfelxur">
					<img :src="faviconUrl" alt="" class="icon"/>
					<span class="name">{{ instance.name || `(${i18n.ts.unknown})` }}</span>
				</div>
				<div style="display: flex; flex-direction: column; gap: 1em;">
					<MkKeyValue :copy="host" oneline>
						<template #key>Host</template>
						<template #value><span class="_monospace"><MkLink :url="`https://${host}`">{{ host }}</MkLink></span></template>
					</MkKeyValue>
					<MkKeyValue oneline>
						<template #key>{{ i18n.ts.software }}</template>
						<template #value><span class="_monospace">{{ instance.softwareName || `(${i18n.ts.unknown})` }} / {{ instance.softwareVersion || `(${i18n.ts.unknown})` }}</span></template>
					</MkKeyValue>
					<MkKeyValue oneline>
						<template #key>{{ i18n.ts.administrator }}</template>
						<template #value>{{ instance.maintainerName || `(${i18n.ts.unknown})` }} ({{ instance.maintainerEmail || `(${i18n.ts.unknown})` }})</template>
					</MkKeyValue>
				</div>
				<MkKeyValue>
					<template #key>{{ i18n.ts.description }}</template>
					<template #value>{{ instance.description }}</template>
				</MkKeyValue>

				<FormSection v-if="iAmModerator">
					<template #label>Moderation</template>
					<div class="_gaps_s">
						<MkKeyValue>
							<template #key>
								{{ i18n.ts._delivery.status }}
							</template>
							<template #value>
								{{ i18n.ts._delivery._type[suspensionState] }}
							</template>
						</MkKeyValue>
						<MkButton v-if="suspensionState === 'none'" :disabled="!instance" danger @click="stopDelivery">{{ i18n.ts._delivery.stop }}</MkButton>
						<MkButton v-if="suspensionState !== 'none'" :disabled="!instance" @click="resumeDelivery">{{ i18n.ts._delivery.resume }}</MkButton>
						<MkSwitch v-model="isBlocked" :disabled="!meta || !instance" @update:modelValue="toggleBlock">{{ i18n.ts.blockThisInstance }}</MkSwitch>
						<MkSwitch v-model="isSilenced" :disabled="!meta || !instance" @update:modelValue="toggleSilenced">{{ i18n.ts.silenceThisInstance }}</MkSwitch>
						<MkSwitch v-model="isMediaSilenced" :disabled="!meta || !instance" @update:modelValue="toggleMediaSilenced">{{ i18n.ts.mediaSilenceThisInstance }}</MkSwitch>
						<MkButton @click="refreshMetadata"><i class="ti ti-refresh"></i> Refresh metadata</MkButton>
						<MkTextarea v-model="moderationNote" manualSave>
							<template #label>{{ i18n.ts.moderationNote }}</template>
							<template #caption>{{ i18n.ts.moderationNoteDescription }}</template>
						</MkTextarea>
					</div>
				</FormSection>

				<FormSection>
					<MkKeyValue oneline style="margin: 1em 0;">
						<template #key>{{ i18n.ts.registeredAt }}</template>
						<template #value><MkTime mode="detail" :time="instance.firstRetrievedAt"/></template>
					</MkKeyValue>
					<MkKeyValue oneline style="margin: 1em 0;">
						<template #key>{{ i18n.ts.updatedAt }}</template>
						<template #value><MkTime mode="detail" :time="instance.infoUpdatedAt"/></template>
					</MkKeyValue>
					<MkKeyValue oneline style="margin: 1em 0;">
						<template #key>{{ i18n.ts.latestRequestReceivedAt }}</template>
						<template #value><MkTime v-if="instance.latestRequestReceivedAt" :time="instance.latestRequestReceivedAt"/><span v-else>N/A</span></template>
					</MkKeyValue>
				</FormSection>

				<FormSection>
					<MkKeyValue oneline style="margin: 1em 0;">
						<template #key>Following (Pub)</template>
						<template #value>{{ number(instance.followingCount) }}</template>
					</MkKeyValue>
					<MkKeyValue oneline style="margin: 1em 0;">
						<template #key>Followers (Sub)</template>
						<template #value>{{ number(instance.followersCount) }}</template>
					</MkKeyValue>
				</FormSection>

				<FormSection>
					<template #label>Well-known resources</template>
					<FormLink :to="`https://${host}/.well-known/host-meta`" external style="margin-bottom: 8px;">host-meta</FormLink>
					<FormLink :to="`https://${host}/.well-known/host-meta.json`" external style="margin-bottom: 8px;">host-meta.json</FormLink>
					<FormLink :to="`https://${host}/.well-known/nodeinfo`" external style="margin-bottom: 8px;">nodeinfo</FormLink>
					<FormLink :to="`https://${host}/robots.txt`" external style="margin-bottom: 8px;">robots.txt</FormLink>
					<FormLink :to="`https://${host}/manifest.json`" external style="margin-bottom: 8px;">manifest.json</FormLink>
				</FormSection>
			</div>
			<div v-else-if="tab === 'chart'" key="chart" class="_gaps_m">
				<div class="cmhjzshl">
					<div class="selects">
						<MkSelect v-model="chartSrc" style="margin: 0 10px 0 0; flex: 1;">
							<option value="instance-requests">{{ i18n.ts._instanceCharts.requests }}</option>
							<option value="instance-users">{{ i18n.ts._instanceCharts.users }}</option>
							<option value="instance-users-total">{{ i18n.ts._instanceCharts.usersTotal }}</option>
							<option value="instance-notes">{{ i18n.ts._instanceCharts.notes }}</option>
							<option value="instance-notes-total">{{ i18n.ts._instanceCharts.notesTotal }}</option>
							<option value="instance-ff">{{ i18n.ts._instanceCharts.ff }}</option>
							<option value="instance-ff-total">{{ i18n.ts._instanceCharts.ffTotal }}</option>
							<option value="instance-drive-usage">{{ i18n.ts._instanceCharts.cacheSize }}</option>
							<option value="instance-drive-usage-total">{{ i18n.ts._instanceCharts.cacheSizeTotal }}</option>
							<option value="instance-drive-files">{{ i18n.ts._instanceCharts.files }}</option>
							<option value="instance-drive-files-total">{{ i18n.ts._instanceCharts.filesTotal }}</option>
						</MkSelect>
					</div>
					<div class="charts">
						<div class="label">{{ i18n.tsx.recentNHours({ n: 90 }) }}</div>
						<MkChart class="chart" :src="chartSrc" span="hour" :limit="90" :args="{ host: host }" :detailed="true"></MkChart>
						<div class="label">{{ i18n.tsx.recentNDays({ n: 90 }) }}</div>
						<MkChart class="chart" :src="chartSrc" span="day" :limit="90" :args="{ host: host }" :detailed="true"></MkChart>
					</div>
				</div>
			</div>
			<div v-else-if="tab === 'users'" key="users" class="_gaps_m">
				<MkPagination v-slot="{items}" :pagination="usersPagination" style="display: grid; grid-template-columns: repeat(auto-fill,minmax(270px,1fr)); grid-gap: 12px;">
					<MkA v-for="user in items" :key="user.id" v-tooltip.mfm="`Last posted: ${dateString(user.updatedAt)}`" class="user" :to="`/admin/user/${user.id}`">
						<MkUserCardMini :user="user"/>
					</MkA>
				</MkPagination>
			</div>
			<div v-else-if="tab === 'raw'" key="raw" class="_gaps_m">
				<MkObjectView tall :value="instance">
				</MkObjectView>
			</div>
		</MkHorizontalSwipe>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import * as Misskey from 'misskey-js';
import MkChart from '@/components/MkChart.vue';
import type { ChartSrc } from '@/components/MkChart.vue';
import MkObjectView from '@/components/MkObjectView.vue';
import FormLink from '@/components/form/link.vue';
import MkLink from '@/components/MkLink.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import number from '@/filters/number.js';
import { iAmModerator, iAmAdmin } from '@/account.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkPagination from '@/components/MkPagination.vue';
import type { Paging } from '@/components/MkPagination.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy.js';
import { dateString } from '@/filters/date.js';
import MkTextarea from '@/components/MkTextarea.vue';

const props = defineProps<{
	host: string;
}>();

const tab = ref('overview');

const chartSrc = ref<ChartSrc>('instance-requests');
const meta = ref<Misskey.entities.AdminMetaResponse | null>(null);
const instance = ref<Misskey.entities.FederationInstance | null>(null);
const suspensionState = ref<'none' | 'manuallySuspended' | 'goneSuspended' | 'autoSuspendedForNotResponding'>('none');
const isBlocked = ref(false);
const isSilenced = ref(false);
const isMediaSilenced = ref(false);
const faviconUrl = ref<string | null>(null);
const moderationNote = ref('');

const usersPagination = {
	endpoint: iAmModerator ? 'admin/show-users' : 'users',
	limit: 10,
	params: {
		sort: '+updatedAt',
		state: 'all',
		hostname: props.host,
	},
	offsetMode: true,
} satisfies Paging;

if (iAmModerator) {
	watch(moderationNote, async () => {
		if (instance.value == null) return;
		await misskeyApi('admin/federation/update-instance', { host: instance.value.host, moderationNote: moderationNote.value });
	});
}

async function fetch(): Promise<void> {
	if (iAmAdmin) {
		meta.value = await misskeyApi('admin/meta');
	}
	instance.value = await misskeyApi('federation/show-instance', {
		host: props.host,
	});
	suspensionState.value = instance.value?.suspensionState ?? 'none';
	isBlocked.value = instance.value?.isBlocked ?? false;
	isSilenced.value = instance.value?.isSilenced ?? false;
	isMediaSilenced.value = instance.value?.isMediaSilenced ?? false;
	faviconUrl.value = getProxiedImageUrlNullable(instance.value?.faviconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.value?.iconUrl, 'preview');
	moderationNote.value = instance.value?.moderationNote ?? '';
}

async function toggleBlock(): Promise<void> {
	if (!iAmAdmin) return;
	if (!meta.value) throw new Error('No meta?');
	if (!instance.value) throw new Error('No instance?');
	const { host } = instance.value;
	await misskeyApi('admin/update-meta', {
		blockedHosts: isBlocked.value ? meta.value.blockedHosts.concat([host]) : meta.value.blockedHosts.filter(x => x !== host),
	});
}

async function toggleSilenced(): Promise<void> {
	if (!iAmAdmin) return;
	if (!meta.value) throw new Error('No meta?');
	if (!instance.value) throw new Error('No instance?');
	const { host } = instance.value;
	const silencedHosts = meta.value.silencedHosts ?? [];
	await misskeyApi('admin/update-meta', {
		silencedHosts: isSilenced.value ? silencedHosts.concat([host]) : silencedHosts.filter(x => x !== host),
	});
}

async function toggleMediaSilenced(): Promise<void> {
	if (!iAmAdmin) return;
	if (!meta.value) throw new Error('No meta?');
	if (!instance.value) throw new Error('No instance?');
	const { host } = instance.value;
	const mediaSilencedHosts = meta.value.mediaSilencedHosts ?? [];
	await misskeyApi('admin/update-meta', {
		mediaSilencedHosts: isMediaSilenced.value ? mediaSilencedHosts.concat([host]) : mediaSilencedHosts.filter(x => x !== host),
	});
}

async function stopDelivery(): Promise<void> {
	if (!iAmModerator) return;
	if (!instance.value) throw new Error('No instance?');
	suspensionState.value = 'manuallySuspended';
	await misskeyApi('admin/federation/update-instance', {
		host: instance.value.host,
		isSuspended: true,
	});
}

async function resumeDelivery(): Promise<void> {
	if (!iAmModerator) return;
	if (!instance.value) throw new Error('No instance?');
	suspensionState.value = 'none';
	await misskeyApi('admin/federation/update-instance', {
		host: instance.value.host,
		isSuspended: false,
	});
}

function refreshMetadata(): void {
	if (!iAmModerator) return;
	if (!instance.value) throw new Error('No instance?');
	misskeyApi('admin/federation/refresh-remote-instance-metadata', {
		host: instance.value.host,
	});
	os.alert({
		text: 'Refresh requested',
	});
}

fetch();

const headerActions = computed(() => [{
	text: `https://${props.host}`,
	icon: 'ti ti-external-link',
	handler: () => {
		window.open(`https://${props.host}`, '_blank', 'noopener');
	},
}]);

const headerTabs = computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'chart',
	title: i18n.ts.charts,
	icon: 'ti ti-chart-line',
}, {
	key: 'users',
	title: i18n.ts.users,
	icon: 'ti ti-users',
}, {
	key: 'raw',
	title: 'Raw',
	icon: 'ti ti-code',
}]);

definePageMetadata(() => ({
	title: props.host,
	icon: 'ti ti-server',
}));
</script>

<style lang="scss" scoped>
.fnfelxur {
	display: flex;
	align-items: center;

	> .icon {
		display: block;
		margin: 0 16px 0 0;
		height: 64px;
		border-radius: 8px;
	}

	> .name {
		word-break: break-all;
	}
}

.cmhjzshl {
	> .selects {
		display: flex;
		margin: 0 0 16px 0;
	}

	> .charts {
		> .label {
			margin-bottom: 12px;
			font-weight: bold;
		}
	}
}
</style>
