<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormPagination ref="list" :pagination="pagination">
		<template #empty>
			<div class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
		</template>
		<template #default="{items}">
			<div class="_gaps">
				<MkFolder v-for="token in items" :key="token.id" :defaultOpen="true">
					<template #icon>
						<img v-if="token.iconUrl" :class="$style.appIcon" :src="token.iconUrl" alt=""/>
						<i v-else class="ti ti-plug"/>
					</template>
					<template #label>{{ token.name }}</template>
					<template #caption>{{ token.description }}</template>
					<template #suffix><MkTime :time="token.lastUsedAt"/></template>
					<template #footer>
						<MkButton danger @click="revoke(token)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
					</template>

					<div class="_gaps_s">
						<div v-if="token.description">{{ token.description }}</div>
						<div>
							<MkKeyValue oneline>
								<template #key>{{ i18n.ts.installedDate }}</template>
								<template #value><MkTime :time="token.createdAt" :mode="'detail'"/></template>
							</MkKeyValue>
							<MkKeyValue oneline>
								<template #key>{{ i18n.ts.lastUsedDate }}</template>
								<template #value><MkTime :time="token.lastUsedAt" :mode="'detail'"/></template>
							</MkKeyValue>
						</div>
						<MkFolder>
							<template #label>{{ i18n.ts.permission }}</template>
							<template #suffix>{{ Object.keys(token.permission).length === 0 ? i18n.ts.none : Object.keys(token.permission).length }}</template>
							<ul>
								<li v-for="p in token.permission" :key="p">{{ i18n.ts._permissions[p] }}</li>
							</ul>
						</MkFolder>
					</div>
				</MkFolder>
			</div>
		</template>
	</FormPagination>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import FormPagination from '@/components/MkPagination.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import { infoImageUrl } from '@/instance.js';

const list = ref<InstanceType<typeof FormPagination>>();

const pagination = {
	endpoint: 'i/apps' as const,
	limit: 100,
	noPaging: true,
	params: {
		sort: '+lastUsedAt',
	},
};

function revoke(token) {
	misskeyApi('i/revoke-token', { tokenId: token.id }).then(() => {
		list.value?.reload();
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.installedApps,
	icon: 'ti ti-plug',
}));
</script>

<style lang="scss" module>
.appIcon {
	width: 20px;
	height: 20px;
	border-radius: 4px;
}
</style>
