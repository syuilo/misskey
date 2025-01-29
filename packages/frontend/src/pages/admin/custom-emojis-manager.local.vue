<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="headerTab" :tabs="headerTabs" hideTitle thin/>
	</template>
	<XListComponent v-if="headerTab === 'list'" key="localList"/>
	<MkSpacer v-else key="localRegister">
		<XRegisterComponent/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { i18n } from '@/i18n.js';
import XListComponent from '@/pages/admin/custom-emojis-manager.local.list.vue';
import XRegisterComponent from '@/pages/admin/custom-emojis-manager.local.register.vue';

type PageMode = 'list' | 'register';

const headerTab = ref<PageMode>('list');

const headerTabs = computed(() => [{
	key: 'list',
	title: i18n.ts._customEmojisManager._local.tabTitleList,
}, {
	key: 'register',
	title: i18n.ts._customEmojisManager._local.tabTitleRegister,
}]);
</script>
