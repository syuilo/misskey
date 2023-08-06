<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>

	<MkSpacer v-if="tab === 'note'" :contentMax="800">
		<div v-if="notesSearchAvailable">
			<XNote/>
		</div>
		<div v-else>
			<MkInfo warn>{{ i18n.ts.notesSearchNotAvailable }}</MkInfo>
		</div>
	</MkSpacer>

	<MkSpacer v-else-if="tab === 'user'" :contentMax="800">
		<XUser/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, defineAsyncComponent, onMounted } from 'vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import * as os from '@/os';
import { $i } from '@/account';
import { instance } from '@/instance';
import MkInfo from '@/components/MkInfo.vue';

const XNote = defineAsyncComponent(() => import('./search.note.vue'));
const XUser = defineAsyncComponent(() => import('./search.user.vue'));

let tab = $ref('note');

const notesSearchAvailable = (($i == null && instance.policies.canSearchNotes) || ($i != null && $i.policies.canSearchNotes));

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	key: 'note',
	title: i18n.ts.notes,
	icon: 'ti ti-pencil',
}, {
	key: 'user',
	title: i18n.ts.users,
	icon: 'ti ti-users',
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.search,
	icon: 'ti ti-search',
})));
</script>
