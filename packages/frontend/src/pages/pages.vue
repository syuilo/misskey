<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<div v-if="tab === 'featured'" key="featured">
				<MkPagination v-slot="{items}" :pagination="featuredPagesPagination">
					<div class="_gaps">
						<MkPagePreview v-for="page in items" :key="page.id" :page="page"/>
					</div>
				</MkPagination>
			</div>

			<div v-else-if="tab === 'my'" key="my" class="_gaps">
				<MkButton class="new" @click="create()"><i class="ti ti-plus"></i></MkButton>
				<MkPagination v-slot="{items}" :pagination="myPagesPagination">
					<div class="_gaps">
						<MkPagePreview v-for="page in items" :key="page.id" :page="page"/>
					</div>
				</MkPagination>
			</div>

			<div v-else-if="tab === 'liked'" key="liked">
				<MkPagination v-slot="{items}" :pagination="likedPagesPagination">
					<div class="_gaps">
						<MkPagePreview v-for="like in items" :key="like.page.id" :page="like.page"/>
					</div>
				</MkPagination>
			</div>
		</MkHorizontalSwipe>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkPagePreview from '@/components/MkPagePreview.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

const tab = ref('featured');

const featuredPagesPagination = {
	endpoint: 'pages/featured' as const,
	limit: 5,
	offsetMode: true,
};
const myPagesPagination = {
	endpoint: 'i/pages' as const,
	limit: 5,
};
const likedPagesPagination = {
	endpoint: 'i/page-likes' as const,
	limit: 5,
};

function create() {
	router.push('/pages/new');
}

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: i18n.ts.create,
	handler: create,
}]);

const headerTabs = computed(() => [{
	key: 'featured',
	title: i18n.ts._pages.featured,
	icon: 'ti ti-flare',
}, {
	key: 'my',
	title: i18n.ts._pages.my,
	icon: 'ti ti-edit',
}, {
	key: 'liked',
	title: i18n.ts._pages.liked,
	icon: 'ti ti-heart',
}]);

definePageMetadata(() => ({
	title: i18n.ts.pages,
	icon: 'ti ti-note',
}));
</script>
