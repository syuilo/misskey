<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MKSpacer v-if="!(typeof error === 'undefined')" :contentMax="1200">
		<div :class="$style.root">
			<img :class="$style.img" :src="serverErrorImageUrl" class="_ghost"/>
			<p :class="$style.text">
				<i class="ti ti-alert-triangle"></i>
				{{ i18n.ts.nothing }}
			</p>
		</div>
	</MKSpacer>
	<MkSpacer v-else-if="list" :contentMax="700" :class="$style.main">
		<div v-if="list" class="members _margin">
			<div :class="$style.member_text">{{ i18n.ts.members }}</div>
			<div class="_gaps_s">
				<div v-for="user in users" :key="user.id" :class="$style.userItem">
					<MkA :class="$style.userItemBody" :to="`${userPage(user)}`">
						<MkUserCardMini :user="user"/>
					</MkA>
				</div>
			</div>
		</div>
		<MkButton v-if="list.isLiked" v-tooltip="i18n.ts.unlike" inline :class="$style.button" asLike primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="list.likedCount > 0" class="count">{{ list.likedCount }}</span></MkButton>
		<MkButton v-if="!list.isLiked" v-tooltip="i18n.ts.like" inline :class="$style.button" asLike @click="like()"><i class="ti ti-heart"></i><span v-if="1 > 0" class="count">{{ list.likedCount }}</span></MkButton>
		<MkButton inline @click="create()"><i class="ti ti-download" :class="$style.import"></i>{{ i18n.ts.import }}</MkButton>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { watch, computed } from 'vue';
import * as os from '@/os';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkButton from '@/components/MkButton.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { serverErrorImageUrl } from '@/instance';

const props = defineProps<{
	listId: string;
}>();

let list = $ref(null);
let error = $ref();
let users = $ref([]);

function fetchList(): void {
	os.api('users/lists/show', {
		listId: props.listId,
		forPublic: true,
	}).then(_list => {
		list = _list;
		os.api('users/show', {
			userIds: list.userIds,
		}).then(_users => {
			users = _users;
		});
	}).catch(err => {
		error = err;
	});
}

function like() {
	os.apiWithDialog('users/lists/favorite', {
		listId: list.id,
	}).then(() => {
		list.isLiked = true;
		list.likedCount++;
	});
}

function unlike() {
	os.apiWithDialog('users/lists/unfavorite', {
		listId: list.id,
	}).then(() => {
		list.isLiked = false;
		list.likedCount--;
	});
}

async function create() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
	});
	if (canceled) return;
	await os.apiWithDialog('users/lists/create-from-public', { name: name, listId: list.id });
}

watch(() => props.listId, fetchList, { immediate: true });

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => list ? {
	title: list.name,
	icon: 'ti ti-list',
} : null));
</script>
<style lang="scss" module>
.main {
	min-height: calc(100cqh - (var(--stickyTop, 0px) + var(--stickyBottom, 0px)));
}

.userItem {
	display: flex;
}

.userItemBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}
.member_text {
	margin: 5px;
}

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

.button {
	margin-right: 10px;
}

.import {
	margin-right: 4px;
}
</style>
