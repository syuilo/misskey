<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="500">
		<div v-if="state == 'fetch-session-error'">
			<p>{{ i18n.ts.somethingHappened }}</p>
		</div>
		<div v-else-if="$i && !session">
			<MkLoading/>
		</div>
		<div v-else-if="$i && session">
			<XForm
				v-if="state == 'waiting'"
				class="form"
				:session="session"
				@denied="state = 'denied'"
				@accepted="accepted"
			/>
			<div v-if="state == 'denied'">
				<h1>{{ i18n.ts._auth.denied }}</h1>
			</div>
			<div v-if="state == 'accepted' && session">
				<h1>{{ session.app.isAuthorized ? i18n.t('already-authorized') : i18n.ts.allowed }}</h1>
				<p v-if="session.app.callbackUrl">
					{{ i18n.ts._auth.callback }}
					<MkEllipsis/>
				</p>
				<p v-if="!session.app.callbackUrl">{{ i18n.ts._auth.pleaseGoBack }}</p>
			</div>
		</div>
		<div v-else>
			<p :class="$style.loginMessage">{{ i18n.ts._auth.pleaseLogin }}</p>
			<MkSignin @login="onLogin"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted } from 'vue';
import { AuthSession } from 'misskey-js/built/entities';
import XForm from './auth.form.vue';
import MkSignin from '@/components/MkSignin.vue';
import * as os from '@/os';
import { $i, login } from '@/account';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const props = defineProps<{
	token: string;
}>();

let state = $ref<'waiting' | 'accepted' | 'fetch-session-error' | 'denied' | null>(null);
let session = $ref<AuthSession | null>(null);

function accepted() {
	state = 'accepted';
	if (session && session.app.callbackUrl) {
		const url = new URL(session.app.callbackUrl);
		if (['javascript:', 'file:', 'data:', 'mailto:', 'tel:'].includes(url.protocol)) throw new Error('invalid url');
		location.href = `${session.app.callbackUrl}?token=${session.token}`;
	}
}

function onLogin(res) {
	login(res.i);
}

onMounted(async () => {
	if (!$i) return;

	try {
		session = await os.api('auth/session/show', {
			token: props.token,
		});

		// 既に連携していた場合
		if (session.app.isAuthorized) {
			await os.api('auth/accept', {
				token: session.token,
			});
			accepted();
		} else {
			state = 'waiting';
		}
	} catch (err) {
		state = 'fetch-session-error';
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts._auth.shareAccessTitle,
	icon: 'ti ti-apps',
});
</script>

<style lang="scss" module>
.loginMessage {
	text-align: center;
	margin: 8px 0 24px;
}
</style>
