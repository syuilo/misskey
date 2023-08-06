<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkRadios v-model="searchOrigin" @update:modelValue="search()">
			<option value="combined">{{ i18n.ts.all }}</option>
			<option value="local">{{ i18n.ts.local }}</option>
			<option value="remote">{{ i18n.ts.remote }}</option>
		</MkRadios>
		<MkButton large primary gradate rounded @click="search">{{ i18n.ts.search }}</MkButton>
	</div>

	<MkFoldableSection v-if="userPagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkUserList :key="key" :pagination="userPagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, defineAsyncComponent, onMounted } from 'vue';
import MkUserList from '@/components/MkUserList.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';
import * as os from '@/os';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { $i } from '@/account';
import { instance } from '@/instance';
import MkInfo from '@/components/MkInfo.vue';
import { useRouter } from '@/router';

const router = useRouter();

let key = $ref('');
let searchQuery = $ref('');
let searchOrigin = $ref('combined');
let userPagination = $ref();

async function search() {
	const query = searchQuery.toString().trim();

	if (query == null || query === '') return;

	if (query.startsWith('https://')) {
		const promise = os.api('ap/show', {
			uri: query,
		});

		os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

		const res = await promise;

		if (res.type === 'User') {
			router.push(`/@${res.object.username}@${res.object.host}`);
		} else if (res.type === 'Note') {
			router.push(`/notes/${res.object.id}`);
		}

		return;
	}

	userPagination = {
		endpoint: 'users/search',
		limit: 10,
		params: {
			query: query,
			origin: searchOrigin,
		},
	};

	key = query;
}
</script>
