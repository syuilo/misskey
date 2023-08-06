<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="instance" :contentMax="600" :marginMin="16" :marginMax="32">
		<div v-if="tab === 'overview'" class="_gaps_m">
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
					<MkSwitch v-model="suspended" :disabled="!instance" @update:modelValue="toggleSuspend">{{ i18n.ts.stopActivityDelivery }}</MkSwitch>
					<MkSwitch v-model="isBlocked" :disabled="!meta || !instance" @update:modelValue="toggleBlock">{{ i18n.ts.blockThisInstance }}</MkSwitch>
					<MkButton @click="refreshMetadata"><i class="ti ti-refresh"></i> Refresh metadata</MkButton>
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
		<div v-else-if="tab === 'chart'" class="_gaps_m">
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
					<div class="label">{{ i18n.t('recentNHours', { n: 90 }) }}</div>
					<MkChart class="chart" :src="chartSrc" span="hour" :limit="90" :args="{ host: host }" :detailed="true"></MkChart>
					<div class="label">{{ i18n.t('recentNDays', { n: 90 }) }}</div>
					<MkChart class="chart" :src="chartSrc" span="day" :limit="90" :args="{ host: host }" :detailed="true"></MkChart>
				</div>
			</div>
		</div>
		<div v-else-if="tab === 'users'" class="_gaps_m">
			<MkPagination v-slot="{items}" :pagination="usersPagination" style="display: grid; grid-template-columns: repeat(auto-fill,minmax(270px,1fr)); grid-gap: 12px;">
				<MkA v-for="user in items" :key="user.id" v-tooltip.mfm="`Last posted: ${dateString(user.updatedAt)}`" class="user" :to="`/user-info/${user.id}`">
					<MkUserCardMini :user="user"/>
				</MkA>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'raw'" class="_gaps_m">
			<MkObjectView tall :value="instance">
			</MkObjectView>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkChart from '@/components/MkChart.vue';
import MkObjectView from '@/components/MkObjectView.vue';
import FormLink from '@/components/form/link.vue';
import MkLink from '@/components/MkLink.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os';
import number from '@/filters/number';
import { iAmModerator, iAmAdmin } from '@/account';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkPagination from '@/components/MkPagination.vue';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy';
import { dateString } from '@/filters/date';

const props = defineProps<{
	host: string;
}>();

let tab = $ref('overview');
let chartSrc = $ref('instance-requests');
let meta = $ref<misskey.entities.AdminInstanceMetadata | null>(null);
let instance = $ref<misskey.entities.Instance | null>(null);
let suspended = $ref(false);
let isBlocked = $ref(false);
let faviconUrl = $ref<string | null>(null);

const usersPagination = {
	endpoint: iAmModerator ? 'admin/show-users' : 'users' as const,
	limit: 10,
	params: {
		sort: '+updatedAt',
		state: 'all',
		hostname: props.host,
	},
	offsetMode: true,
};

async function fetch(): Promise<void> {
	if (iAmAdmin) {
		meta = await os.api('admin/meta');
	}
	instance = await os.api('federation/show-instance', {
		host: props.host,
	});
	suspended = instance.isSuspended;
	isBlocked = instance.isBlocked;
	faviconUrl = getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.iconUrl, 'preview');
}

async function toggleBlock(): Promise<void> {
	if (!meta) throw new Error('No meta?');
	if (!instance) throw new Error('No instance?');
	const { host } = instance;
	await os.api('admin/update-meta', {
		blockedHosts: isBlocked ? meta.blockedHosts.concat([host]) : meta.blockedHosts.filter(x => x !== host),
	});
}

async function toggleSuspend(): Promise<void> {
	if (!instance) throw new Error('No instance?');
	await os.api('admin/federation/update-instance', {
		host: instance.host,
		isSuspended: suspended,
	});
}

function refreshMetadata(): void {
	if (!instance) throw new Error('No instance?');
	os.api('admin/federation/refresh-remote-instance-metadata', {
		host: instance.host,
	});
	os.alert({
		text: 'Refresh requested',
	});
}

fetch();

const headerActions = $computed(() => [{
	text: `https://${props.host}`,
	icon: 'ti ti-external-link',
	handler: () => {
		window.open(`https://${props.host}`, '_blank');
	},
}]);

const headerTabs = $computed(() => [{
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

definePageMetadata({
	title: props.host,
	icon: 'ti ti-server',
});
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
