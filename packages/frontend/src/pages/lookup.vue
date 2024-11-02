<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div v-if="state === 'done'" class="_buttonsCenter">
			<MkButton @click="close">{{ i18n.ts.close }}</MkButton>
			<MkButton @click="goToMisskey">{{ i18n.ts.goToMisskey }}</MkButton>
		</div>
		<div v-else class="_fullInfo">
			<MkLoading/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { mainRouter } from '@/router/main.js';
import MkButton from '@/components/MkButton.vue';

const state = ref<'fetching' | 'done'>('fetching');

function fetch() {
	const params = new URL(location.href).searchParams;

	// acctのほうはdeprecated
	let uri = params.get('uri') ?? params.get('acct');
	if (uri == null) {
		state.value = 'done';
		return;
	}

	let promise: Promise<unknown>;

	if (uri.startsWith('https://')) {
		promise = misskeyApi('ap/show', {
			uri,
		});
		promise.then(res => {
			if (res.type === 'User') {
				mainRouter.replace(res.object.host ? `/@${res.object.username}@${res.object.host}` : `/@${res.object.username}`);
			} else if (res.type === 'Note') {
				mainRouter.replace(`/notes/${res.object.id}`);
			} else {
				os.alert({
					type: 'error',
					text: 'Not a user',
				});
			}
		});
	} else {
		if (uri.startsWith('acct:')) {
			uri = uri.slice(5);
		}
		promise = misskeyApi('users/show', Misskey.acct.parse(uri));
		promise.then(user => {
			mainRouter.replace(user.host ? `/@${user.username}@${user.host}` : `/@${user.username}`);
		});
	}

	os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);
}

function close(): void {
	window.close();

	// 閉じなければ100ms後タイムラインに
	window.setTimeout(() => {
		location.href = '/';
	}, 100);
}

function goToMisskey(): void {
	location.href = '/';
}

fetch();

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.lookup,
	icon: 'ti ti-world-search',
});
</script>
