<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header>
			<MkPageHeader v-model:tab="headerTab" :tabs="headerTabs"/>
		</template>
		<XGridLocalComponent v-if="headerTab === 'local'" :class="$style.local"/>
		<XGridRemoteComponent v-else/>
	</MkStickyContainer>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import XGridLocalComponent from '@/pages/admin/custom-emojis-manager.local.vue';
import XGridRemoteComponent from '@/pages/admin/custom-emojis-manager.remote.vue';
import MkPageHeader from '@/components/global/MkPageHeader.vue';
import MkStickyContainer from '@/components/global/MkStickyContainer.vue';

type PageMode = 'local' | 'remote';

const headerTab = ref<PageMode>('local');

const headerTabs = computed(() => [{
	key: 'local',
	title: i18n.ts.local,
}, {
	key: 'remote',
	title: i18n.ts.remote,
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
	needWideArea: true,
})));
</script>

<style lang="css" module>
.local {
	height: calc(100dvh - var(--MI-stickyTop) - var(--MI-stickyBottom));
	overflow: clip;
}
</style>
