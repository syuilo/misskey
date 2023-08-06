<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-adaptive-bg class="_panel" style="position: relative;">
	<div :class="$style.banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''"></div>
	<MkAvatar :class="$style.avatar" :user="user" indicator/>
	<div :class="$style.title">
		<div :class="$style.name"><MkUserName :user="user" :nowrap="false"/></div>
		<p :class="$style.username"><MkAcct :user="user"/></p>
	</div>
	<div :class="$style.description">
		<div v-if="user.description" :class="$style.mfm">
			<Mfm :text="user.description" :author="user" :i="$i"/>
		</div>
		<span v-else style="opacity: 0.7;">{{ i18n.ts.noAccountDescription }}</span>
	</div>
	<div :class="$style.footer">
		<MkButton v-if="!isFollowing" primary gradate rounded full @click="follow"><i class="ti ti-plus"></i> {{ i18n.ts.follow }}</MkButton>
		<div v-else style="opacity: 0.7; text-align: center;">{{ i18n.ts.youFollowing }} <i class="ti ti-check"></i></div>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import * as misskey from 'misskey-js';
import { ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import * as os from '@/os';

const props = defineProps<{
	user: misskey.entities.UserDetailed;
}>();

const isFollowing = ref(false);

async function follow() {
	isFollowing.value = true;
	os.api('following/create', {
		userId: props.user.id,
	});
}
</script>

<style lang="scss" module>
.banner {
	height: 60px;
	background-color: rgba(0, 0, 0, 0.1);
	background-size: cover;
	background-position: center;
}

.avatar {
	display: block;
	position: absolute;
	top: 30px;
	left: 13px;
	z-index: 2;
	width: 58px;
	height: 58px;
	border: solid 4px var(--panel);
}

.title {
	display: block;
	padding: 10px 0 10px 88px;
}

.name {
	display: inline-block;
	margin: 0;
	font-weight: bold;
	line-height: 16px;
	word-break: break-all;
}

.username {
	display: block;
	margin: 0;
	line-height: 16px;
	font-size: 0.8em;
	color: var(--fg);
	opacity: 0.7;
}

.description {
	padding: 0 16px 16px 88px;
	font-size: 0.9em;
}

.mfm {
	display: -webkit-box;
	-webkit-line-clamp: 5;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.footer {
	border-top: solid 0.5px var(--divider);
	padding: 16px;
}
</style>
