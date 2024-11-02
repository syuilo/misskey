<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkTooltip ref="tooltip" :showing="showing" :targetElement="targetElement" :maxWidth="250" @closed="emit('closed')">
	<div :class="$style.root">
		<div v-for="u in users" :key="u.id" :class="$style.user">
			<MkAvatar :class="$style.avatar" :user="u"/>
			<MkUserName :user="u" :nowrap="true"/>
		</div>
		<div v-if="users.length < count">+{{ count - users.length }}</div>
	</div>
</MkTooltip>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import MkTooltip from './MkTooltip.vue';

defineProps<{
	showing: boolean;
	users: Misskey.entities.UserLite[];
	count: number;
	targetElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>

<style lang="scss" module>
.root {
	font-size: 0.9em;
	text-align: left;
}

.user {
	line-height: 24px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	&:not(:last-child) {
		margin-bottom: 3px;
	}
}

.avatar {
	width: 24px;
	height: 24px;
	margin-right: 3px;
}
</style>
