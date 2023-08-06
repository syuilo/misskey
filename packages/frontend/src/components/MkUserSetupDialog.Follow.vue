<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div style="text-align: center;">{{ i18n.ts._initialAccountSetting.followUsers }}</div>

	<MkFolder :defaultOpen="true">
		<template #label>{{ i18n.ts.recommended }}</template>

		<MkPagination :pagination="pinnedUsers">
			<template #default="{ items }">
				<div :class="$style.users">
					<XUser v-for="item in items" :key="item.id" :user="item"/>
				</div>
			</template>
		</MkPagination>
	</MkFolder>

	<MkFolder :defaultOpen="true">
		<template #label>{{ i18n.ts.popularUsers }}</template>

		<MkPagination :pagination="popularUsers">
			<template #default="{ items }">
				<div :class="$style.users">
					<XUser v-for="item in items" :key="item.id" :user="item"/>
				</div>
			</template>
		</MkPagination>
	</MkFolder>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, ref, watch } from 'vue';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import XUser from '@/components/MkUserSetupDialog.User.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { $i } from '@/account';
import MkPagination from '@/components/MkPagination.vue';

const pinnedUsers = { endpoint: 'pinned-users', noPaging: true };

const popularUsers = { endpoint: 'users', limit: 10, noPaging: true, params: {
	state: 'alive',
	origin: 'local',
	sort: '+follower',
} };
</script>

<style lang="scss" module>
.users {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
	grid-gap: var(--margin);
	justify-content: center;
}
</style>
