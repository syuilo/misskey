<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<section>
	<div v-if="app.permission.length > 0">
		<p>{{ i18n.t('_auth.permission', { name }) }}</p>
		<ul>
			<li v-for="p in app.permission" :key="p">{{ i18n.t(`_permissions.${p}`) }}</li>
		</ul>
	</div>
	<div>{{ i18n.t('_auth.shareAccess', { name: `${name} (${app.id})` }) }}</div>
	<div :class="$style.buttons">
		<MkButton inline @click="cancel">{{ i18n.ts.cancel }}</MkButton>
		<MkButton inline primary @click="accept">{{ i18n.ts.accept }}</MkButton>
	</div>
</section>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import { AuthSession } from 'misskey-js/built/entities';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	session: AuthSession;
}>();

const emit = defineEmits<{
	(event: 'accepted'): void;
	(event: 'denied'): void;
}>();

const app = $computed(() => props.session.app);

const name = $computed(() => {
	const el = document.createElement('div');
	el.textContent = app.name;
	return el.innerHTML;
});

function cancel() {
	os.api('auth/deny', {
		token: props.session.token,
	}).then(() => {
		emit('denied');
	});
}

function accept() {
	os.api('auth/accept', {
		token: props.session.token,
	}).then(() => {
		emit('accepted');
	});
}

</script>

<style lang="scss" module>
.buttons {
	margin-top: 16px;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}
</style>
