<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="1200">
	<MkTab v-model="origin" style="margin-bottom: var(--margin);">
		<option value="local">{{ i18n.ts.local }}</option>
		<option value="remote">{{ i18n.ts.remote }}</option>
	</MkTab>
	<div v-if="origin === 'local'">
		<template v-if="tag == null">
			<MkFoldableSection class="_margin" persistKey="explore-pinned-users">
				<template #header><i class="ti ti-bookmark ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.pinnedUsers }}</template>
				<MkUserList :pagination="pinnedUsers"/>
			</MkFoldableSection>
			<MkFoldableSection v-if="instance.preferPopularUserFactor !== 'none'" class="_margin" persistKey="explore-popular-users">
				<template #header><i class="ti ti-chart-line ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.popularUsers }}</template>
				<MkUserList :pagination="popularUsers"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin" persistKey="explore-recently-updated-users">
				<template #header><i class="ti ti-message ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.recentlyUpdatedUsers }}</template>
				<MkUserList :pagination="recentlyUpdatedUsers"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin" persistKey="explore-recently-registered-users">
				<template #header><i class="ti ti-plus ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.recentlyRegisteredUsers }}</template>
				<MkUserList :pagination="recentlyRegisteredUsers"/>
			</MkFoldableSection>
		</template>
	</div>
	<div v-else>
		<MkFoldableSection ref="tagsEl" :foldable="true" :expanded="false" class="_margin">
			<template #header><i class="ti ti-hash ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.popularTags }}</template>

			<div>
				<MkA v-for="tag in tagsLocal" :key="'local:' + tag.tag" :to="`/user-tags/${tag.tag}`" style="margin-right: 16px; font-weight: bold;">{{ tag.tag }}</MkA>
				<MkA v-for="tag in tagsRemote" :key="'remote:' + tag.tag" :to="`/user-tags/${tag.tag}`" style="margin-right: 16px;">{{ tag.tag }}</MkA>
			</div>
		</MkFoldableSection>

		<MkFoldableSection v-if="tag != null" :key="`${tag}`" class="_margin">
			<template #header><i class="ti ti-hash ti-fw" style="margin-right: 0.5em;"></i>{{ tag }}</template>
			<MkUserList :pagination="tagUsers"/>
		</MkFoldableSection>

		<template v-if="tag == null">
			<MkFoldableSection v-if="instance.preferPopularUserFactor !== 'none'" class="_margin">
				<template #header><i class="ti ti-chart-line ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.popularUsers }}</template>
				<MkUserList :pagination="popularUsersF"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-message ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.recentlyUpdatedUsers }}</template>
				<MkUserList :pagination="recentlyUpdatedUsersF"/>
			</MkFoldableSection>
			<MkFoldableSection class="_margin">
				<template #header><i class="ti ti-rocket ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.recentlyDiscoveredUsers }}</template>
				<MkUserList :pagination="recentlyRegisteredUsersF"/>
			</MkFoldableSection>
		</template>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { watch, ref, shallowRef, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkUserList from '@/components/MkUserList.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkTab from '@/components/MkTab.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import type { Paging } from '@/components/MkPagination.vue';

const props = defineProps<{
	tag?: string;
}>();

const origin = ref('local');
const tagsEl = shallowRef<InstanceType<typeof MkFoldableSection>>();
const tagsLocal = ref<Misskey.entities.Hashtag[]>([]);
const tagsRemote = ref<Misskey.entities.Hashtag[]>([]);

watch(() => props.tag, () => {
	if (tagsEl.value) tagsEl.value.toggleContent(props.tag == null);
});

const tagUsers = computed(() => ({
	endpoint: 'hashtags/users' as const,
	limit: 30,
	params: {
		tag: props.tag,
		origin: 'combined',
		sort: '+follower',
	},
}));

function createUserQueryPaging(params: Misskey.Endpoints['users']['req']): Paging {
	return {
		endpoint: 'users',
		limit: 10,
		noPaging: true,
		params,
	};
}

const pinnedUsers = {
	endpoint: 'pinned-users',
	noPaging: true,
	limit: 10,
} satisfies Paging;
const popularUsers = createUserQueryPaging({
	state: 'alive',
	origin: 'local',
	sort: instance.preferPopularUserFactor === 'pv' ? '+pv' : '+follower',
});
const recentlyUpdatedUsers = createUserQueryPaging({
	origin: 'local',
	sort: '+updatedAt',
});
const recentlyRegisteredUsers = createUserQueryPaging({
	origin: 'local',
	state: 'alive',
	sort: '+createdAt',
});
const popularUsersF = createUserQueryPaging({
	state: 'alive',
	origin: 'remote',
	sort: '+follower', // リモートのpvは信用ならない
});
const recentlyUpdatedUsersF = createUserQueryPaging({
	origin: 'combined',
	sort: '+updatedAt',
});
const recentlyRegisteredUsersF = createUserQueryPaging({
	origin: 'combined',
	sort: '+createdAt',
});

misskeyApi('hashtags/list', {
	sort: '+attachedLocalUsers',
	attachedToLocalUserOnly: true,
	limit: 30,
}).then(tags => {
	tagsLocal.value = tags;
});
misskeyApi('hashtags/list', {
	sort: '+attachedRemoteUsers',
	attachedToRemoteUserOnly: true,
	limit: 30,
}).then(tags => {
	tagsRemote.value = tags;
});
</script>
