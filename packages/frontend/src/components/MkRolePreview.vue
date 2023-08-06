<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA v-adaptive-bg :to="forModeration ? `/admin/roles/${role.id}` : `/roles/${role.id}`" class="_panel" :class="$style.root" tabindex="-1" :style="{ '--color': role.color }">
	<div :class="$style.title">
		<span :class="$style.icon">
			<template v-if="role.iconUrl">
				<img :class="$style.badge" :src="role.iconUrl"/>
			</template>
			<template v-else>
				<i v-if="role.isAdministrator" class="ti ti-crown" style="color: var(--accent);"></i>
				<i v-else-if="role.isModerator" class="ti ti-shield" style="color: var(--accent);"></i>
				<i v-else class="ti ti-user" style="opacity: 0.7;"></i>
			</template>
		</span>
		<span :class="$style.name">{{ role.name }}</span>
		<template v-if="detailed">
			<span v-if="role.target === 'manual'" :class="$style.users">{{ role.usersCount }} users</span>
			<span v-else-if="role.target === 'conditional'" :class="$style.users">({{ i18n.ts._role.conditional }})</span>
		</template>
	</div>
	<div :class="$style.description">{{ role.description }}</div>
</MkA>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	role: any;
	forModeration: boolean;
	detailed: boolean;
}>(), {
	detailed: true,
});
</script>

<style lang="scss" module>
.root {
	display: block;
	padding: 16px 20px;
	border-left: solid 6px var(--color);
}

.title {
	display: flex;
}

.icon {
	margin-right: 8px;
}

.badge {
	height: 1.3em;
	vertical-align: -20%;
}

.name {
	font-weight: bold;
}

.users {
	margin-left: auto;
	opacity: 0.7;
}

.description {
	opacity: 0.7;
	font-size: 85%;
}
</style>
