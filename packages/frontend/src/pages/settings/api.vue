<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkButton primary @click="generateToken">{{ i18n.ts.generateAccessToken }}</MkButton>
	<FormLink to="/settings/apps">{{ i18n.ts.manageAccessTokens }}</FormLink>
	<FormLink to="/api-console" :behavior="isDesktop ? 'window' : null">API console</FormLink>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent, ref } from 'vue';
import FormLink from '@/components/form/link.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const isDesktop = ref(window.innerWidth >= 1100);

function generateToken() {
	os.popup(defineAsyncComponent(() => import('@/components/MkTokenGenerateWindow.vue')), {}, {
		done: async result => {
			const { name, permissions } = result;
			const { token } = await os.api('miauth/gen-token', {
				session: null,
				name: name,
				permission: permissions,
			});

			os.alert({
				type: 'success',
				title: i18n.ts.token,
				text: token,
			});
		},
	}, 'closed');
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: 'API',
	icon: 'ti ti-api',
});
</script>
