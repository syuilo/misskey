<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="700">
	<MkPagination v-slot="{items}" ref="list" :pagination="pagination">
		<div v-for="item in items" :key="item.id" :to="`/clips/${item.id}`" class="_panel _margin">
			<div :class="$style.header">
				<MkAvatar :class="$style.avatar" :user="user"/>
				<MkReactionIcon :class="$style.reaction" :reaction="item.type" :noStyle="true"/>
				<MkTime :time="item.createdAt" :class="$style.createdAt"/>
			</div>
			<MkNote :key="item.id" :note="item.note"/>
		</div>
	</MkPagination>
</MkSpacer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import MkPagination from '@/components/MkPagination.vue';
import MkNote from '@/components/MkNote.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';

const props = defineProps<{
	user: misskey.entities.User;
}>();

const pagination = {
	endpoint: 'users/reactions' as const,
	limit: 20,
	params: computed(() => ({
		userId: props.user.id,
	})),
};
</script>

<style lang="scss" module>
.header {
	display: flex;
	align-items: center;
	padding: 8px 16px;
	margin-bottom: 8px;
	border-bottom: solid 2px var(--divider);
}

.avatar {
	width: 24px;
	height: 24px;
	margin-right: 8px;
}

.reaction {
	width: 32px;
	height: 32px;
}

.createdAt {
	margin-left: auto;
}
</style>
