<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init">
			<MkInfo>{{ i18n.ts.proxyAccountDescription }}</MkInfo>
			<MkKeyValue>
				<template #key>{{ i18n.ts.proxyAccount }}</template>
				<template #value>{{ proxyAccount ? `@${proxyAccount.username}` : i18n.ts.none }}</template>
			</MkKeyValue>

			<MkButton primary @click="chooseProxyAccount">{{ i18n.ts.selectAccount }}</MkButton>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let proxyAccount: any = $ref(null);
let proxyAccountId: any = $ref(null);

async function init() {
	const meta = await os.api('admin/meta');
	proxyAccountId = meta.proxyAccountId;
	if (proxyAccountId) {
		proxyAccount = await os.api('users/show', { userId: proxyAccountId });
	}
}

function chooseProxyAccount() {
	os.selectUser().then(user => {
		proxyAccount = user;
		proxyAccountId = user.id;
		save();
	});
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		proxyAccountId: proxyAccountId,
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.proxyAccount,
	icon: 'ti ti-ghost',
});
</script>
