<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="token" :contentMax="700" :marginMin="16" :marginMax="32">
		<div class="_gaps_m">
			<MkInput v-model="password" type="password">
				<template #prefix><i class="ti ti-lock"></i></template>
				<template #label>{{ i18n.ts.newPassword }}</template>
			</MkInput>

			<MkButton primary @click="save">{{ i18n.ts.save }}</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent, onMounted } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { mainRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	token?: string;
}>();

let password = $ref('');

async function save() {
	await os.apiWithDialog('reset-password', {
		token: props.token,
		password: password,
	});
	mainRouter.push('/');
}

onMounted(() => {
	if (props.token == null) {
		os.popup(defineAsyncComponent(() => import('@/components/MkForgotPassword.vue')), {}, {}, 'closed');
		mainRouter.push('/');
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.resetPassword,
	icon: 'ti ti-lock',
});
</script>
