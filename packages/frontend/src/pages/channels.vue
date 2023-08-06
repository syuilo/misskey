<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<div v-if="tab === 'search'">
			<div class="_gaps">
				<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<MkRadios v-model="searchType" @update:modelValue="search()">
					<option value="nameAndDescription">{{ i18n.ts._channel.nameAndDescription }}</option>
					<option value="nameOnly">{{ i18n.ts._channel.nameOnly }}</option>
				</MkRadios>
				<MkButton large primary gradate rounded @click="search">{{ i18n.ts.search }}</MkButton>
			</div>

			<MkFoldableSection v-if="channelPagination">
				<template #header>{{ i18n.ts.searchResult }}</template>
				<MkChannelList :key="key" :pagination="channelPagination"/>
			</MkFoldableSection>
		</div>
		<div v-if="tab === 'featured'">
			<MkPagination v-slot="{items}" :pagination="featuredPagination">
				<MkChannelPreview v-for="channel in items" :key="channel.id" class="_margin" :channel="channel"/>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'favorites'">
			<MkPagination v-slot="{items}" :pagination="favoritesPagination">
				<MkChannelPreview v-for="channel in items" :key="channel.id" class="_margin" :channel="channel"/>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'following'">
			<MkPagination v-slot="{items}" :pagination="followingPagination">
				<MkChannelPreview v-for="channel in items" :key="channel.id" class="_margin" :channel="channel"/>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'owned'">
			<MkButton class="new" @click="create()"><i class="ti ti-plus"></i></MkButton>
			<MkPagination v-slot="{items}" :pagination="ownedPagination">
				<MkChannelPreview v-for="channel in items" :key="channel.id" class="_margin" :channel="channel"/>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, onMounted } from 'vue';
import MkChannelPreview from '@/components/MkChannelPreview.vue';
import MkChannelList from '@/components/MkChannelList.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { useRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const router = useRouter();

const props = defineProps<{
	query: string;
	type?: string;
}>();

let key = $ref('');
let tab = $ref('featured');
let searchQuery = $ref('');
let searchType = $ref('nameAndDescription');
let channelPagination = $ref();

onMounted(() => {
	searchQuery = props.query ?? '';
	searchType = props.type ?? 'nameAndDescription';
});

const featuredPagination = {
	endpoint: 'channels/featured' as const,
	noPaging: true,
};
const favoritesPagination = {
	endpoint: 'channels/my-favorites' as const,
	limit: 100,
	noPaging: true,
};
const followingPagination = {
	endpoint: 'channels/followed' as const,
	limit: 10,
};
const ownedPagination = {
	endpoint: 'channels/owned' as const,
	limit: 10,
};

async function search() {
	const query = searchQuery.toString().trim();

	if (query == null) return;

	const type = searchType.toString().trim();

	channelPagination = {
		endpoint: 'channels/search',
		limit: 10,
		params: {
			query: searchQuery,
			type: type,
		},
	};

	key = query + type;
}

function create() {
	router.push('/channels/new');
}

const headerActions = $computed(() => [{
	icon: 'ti ti-plus',
	text: i18n.ts.create,
	handler: create,
}]);

const headerTabs = $computed(() => [{
	key: 'search',
	title: i18n.ts.search,
	icon: 'ti ti-search',
}, {
	key: 'featured',
	title: i18n.ts._channel.featured,
	icon: 'ti ti-comet',
}, {
	key: 'favorites',
	title: i18n.ts.favorites,
	icon: 'ti ti-star',
}, {
	key: 'following',
	title: i18n.ts._channel.following,
	icon: 'ti ti-eye',
}, {
	key: 'owned',
	title: i18n.ts._channel.owned,
	icon: 'ti ti-edit',
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.channel,
	icon: 'ti ti-device-tv',
})));
</script>
