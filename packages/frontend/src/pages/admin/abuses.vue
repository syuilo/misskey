<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900">
		<div class="_gaps">
			<div :class="$style.subMenus" class="_gaps">
				<MkButton link to="/admin/abuse-report-notification-recipient" primary>{{ i18n.ts.notificationSetting }}</MkButton>
			</div>

			<div :class="$style.filtersRoot">
				<MkSelect v-model="state">
					<template #label>{{ i18n.ts.state }}</template>
					<option value="all">{{ i18n.ts.all }}</option>
					<option value="unresolved">{{ i18n.ts.unresolved }}</option>
					<option value="resolved">{{ i18n.ts.resolved }}</option>
				</MkSelect>
				<MkSelect v-model="targetUserOrigin">
					<template #label>{{ i18n.ts.reporteeOrigin }}</template>
					<option value="combined">{{ i18n.ts.all }}</option>
					<option value="local">{{ i18n.ts.local }}</option>
					<option value="remote">{{ i18n.ts.remote }}</option>
				</MkSelect>
				<MkSelect v-model="reporterOrigin">
					<template #label>{{ i18n.ts.reporterOrigin }}</template>
					<option value="combined">{{ i18n.ts.all }}</option>
					<option value="local">{{ i18n.ts.local }}</option>
					<option value="remote">{{ i18n.ts.remote }}</option>
				</MkSelect>
			</div>

			<!-- TODO
			<div class="inputs" style="display: flex; padding-top: 1.2em;">
				<MkInput v-model="searchUsername" style="margin: 0; flex: 1;" type="text" :spellcheck="false">
					<span>{{ i18n.ts.username }}</span>
				</MkInput>
				<MkInput v-model="searchHost" style="margin: 0; flex: 1;" type="text" :spellcheck="false" :disabled="pagination.params().origin === 'local'">
					<span>{{ i18n.ts.host }}</span>
				</MkInput>
			</div>
			-->

			<MkPagination v-slot="{ items }" ref="reports" :pagination="pagination">
				<XAbuseReport v-for="report in (items as AbuseUserReport[])" :key="report.id" :report="report" @resolved="resolved"/>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, shallowRef, ref } from 'vue';

import XHeader from './_header_.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import XAbuseReport, { type AbuseUserReport } from '@/components/MkAbuseReport.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';

const reports = shallowRef<InstanceType<typeof MkPagination>>();

const state = ref<'all' | 'unresolved' | 'resolved'>('unresolved');
const reporterOrigin = ref<'combined' | 'local' | 'remote'>('combined');
const targetUserOrigin = ref<'combined' | 'local' | 'remote'>('combined');

const pagination = {
	endpoint: 'admin/abuse-user-reports' as const,
	limit: 10,
	params: computed(() => ({
		state: state.value,
		reporterOrigin: reporterOrigin.value,
		targetUserOrigin: targetUserOrigin.value,
	})),
};

const resolved = (reportId: string) => {
	if (state.value === 'unresolved') {
		reports.value?.removeItem(reportId);
	}
};

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.abuseReports,
	icon: 'ti ti-exclamation-circle',
}));
</script>

<style module>
.subMenus {
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	align-items: center;
}

.filtersRoot {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--margin);
}
</style>
