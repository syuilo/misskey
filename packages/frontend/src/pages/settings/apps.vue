<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
				<div v-for="token in items" :key="token.id" class="_panel" :class="$style.app">
					<img v-if="token.iconUrl" :class="$style.appIcon" :src="token.iconUrl" alt=""/>
					<div :class="$style.appBody">
						<div :class="$style.appName">{{ token.name }}</div>
						<div>{{ token.description }}</div>
						<MkKeyValue oneline>
							<template #key>{{ i18n.ts.installedDate }}</template>
							<template #value><MkTime :time="token.createdAt"/></template>
						</MkKeyValue>
						<MkKeyValue oneline>
							<template #key>{{ i18n.ts.lastUsedDate }}</template>
							<template #value><MkTime :time="token.lastUsedAt"/></template>
						</MkKeyValue>
						<details>
							<summary>{{ i18n.ts.details }}</summary>
							<ul>
								<li v-for="p in token.permission" :key="p">{{ i18n.t(`_permissions.${p}`) }}</li>
							</ul>
						</details>
						<div>
							<MkButton inline danger @click="revoke(token)"><i class="ti ti-trash"></i></MkButton>
						</div>
					</div>
				</div>
			</div>
		</template>
	</FormPagination>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref } from 'vue';
import FormPagination from '@/components/MkPagination.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkButton from '@/components/MkButton.vue';
import { infoImageUrl } from '@/instance';

const list = ref<any>(null);

const pagination = {
	endpoint: 'i/apps' as const,
	limit: 100,
	noPaging: true,
	params: {
		sort: '+lastUsedAt',
	},
};

function revoke(token) {
	os.api('i/revoke-token', { tokenId: token.id }).then(() => {
		list.value.reload();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.installedApps,
	icon: 'ti ti-plug',
});
</script>

<style lang="scss" module>
.app {
	display: flex;
	padding: 16px;
}

.appIcon {
	display: block;
	flex-shrink: 0;
	margin: 0 12px 0 0;
	width: 50px;
	height: 50px;
	border-radius: 8px;
}

.appBody {
	width: calc(100% - 62px);
	position: relative;
}

.appName {
	font-weight: bold;
}
</style>
