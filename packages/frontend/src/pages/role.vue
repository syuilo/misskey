<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :tabs="headerTabs"/></template>
	<MKSpacer v-if="!(typeof error === 'undefined')" :contentMax="1200">
		<div :class="$style.root">
			<img :class="$style.img" :src="serverErrorImageUrl" class="_ghost"/>
			<p :class="$style.text">
				<i class="ti ti-alert-triangle"></i>
				{{ error }}
			</p>
		</div>
	</MKSpacer>
	<MkSpacer v-else-if="tab === 'users'" :contentMax="1200">
		<div class="_gaps_s">
			<div v-if="role">{{ role.description }}</div>
			<MkUserList :pagination="users" :extractor="(item) => item.user"/>
		</div>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'timeline'" :contentMax="700">
		<MkTimeline ref="timeline" src="role" :role="props.role"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, watch } from 'vue';
import * as os from '@/os';
import MkUserList from '@/components/MkUserList.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import MkTimeline from '@/components/MkTimeline.vue';
import { instanceName } from '@/config';
import { serverErrorImageUrl } from '@/instance';

const props = withDefaults(defineProps<{
	role: string;
	initialTab?: string;
}>(), {
	initialTab: 'users',
});

let tab = $ref(props.initialTab);
let role = $ref();
let error = $ref();

watch(() => props.role, () => {
	os.api('roles/show', {
		roleId: props.role,
	}).then(res => {
		role = res;
		document.title = `${role?.name} | ${instanceName}`;
	}).catch((err) => {
		if (err.code === 'NO_SUCH_ROLE') {
			error = i18n.ts.noRole;
		} else {
			error = i18n.ts.somethingHappened;
		}
		document.title = `${error} | ${instanceName}`;
	});
}, { immediate: true });

const users = $computed(() => ({
	endpoint: 'roles/users' as const,
	limit: 30,
	params: {
		roleId: props.role,
	},
}));

const headerTabs = $computed(() => [{
	key: 'users',
	icon: 'ti ti-users',
	title: i18n.ts.users,
}, {
	key: 'timeline',
	icon: 'ti ti-pencil',
	title: i18n.ts.timeline,
}]);

definePageMetadata(computed(() => ({
	title: role?.name,
	icon: 'ti ti-badge',
})));
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;
  align-items: center;
}

.text {
	margin: 0 0 8px 0;
}

.img {
	vertical-align: bottom;
  width: 128px;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}
</style>

