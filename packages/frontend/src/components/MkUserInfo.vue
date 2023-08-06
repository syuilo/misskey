<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_panel" :class="$style.root">
	<div :class="$style.banner" :style="user.bannerUrl ? `background-image: url(${user.bannerUrl})` : ''"></div>
	<MkAvatar :class="$style.avatar" :user="user" indicator/>
	<div :class="$style.title">
		<MkA :class="$style.name" :to="userPage(user)"><MkUserName :user="user" :nowrap="false"/></MkA>
		<p :class="$style.username"><MkAcct :user="user"/></p>
	</div>
	<span v-if="$i && $i.id !== user.id && user.isFollowed" :class="$style.followed">{{ i18n.ts.followsYou }}</span>
	<div :class="$style.description">
		<div v-if="user.description" :class="$style.mfm">
			<Mfm :text="user.description" :author="user" :i="$i"/>
		</div>
		<span v-else style="opacity: 0.7;">{{ i18n.ts.noAccountDescription }}</span>
	</div>
	<div :class="$style.status">
		<div :class="$style.statusItem">
			<p :class="$style.statusItemLabel">{{ i18n.ts.notes }}</p><span :class="$style.statusItemValue">{{ number(user.notesCount) }}</span>
		</div>
		<div v-if="isFfVisibleForMe(user)" :class="$style.statusItem">
			<p :class="$style.statusItemLabel">{{ i18n.ts.following }}</p><span :class="$style.statusItemValue">{{ number(user.followingCount) }}</span>
		</div>
		<div v-if="isFfVisibleForMe(user)" :class="$style.statusItem">
			<p :class="$style.statusItemLabel">{{ i18n.ts.followers }}</p><span :class="$style.statusItemValue">{{ number(user.followersCount) }}</span>
		</div>
	</div>
	<MkFollowButton v-if="$i && user.id != $i.id" :class="$style.follow" :user="user" mini/>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import * as misskey from 'misskey-js';
import MkFollowButton from '@/components/MkFollowButton.vue';
import number from '@/filters/number';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { isFfVisibleForMe } from '@/scripts/isFfVisibleForMe';

defineProps<{
	user: misskey.entities.UserDetailed;
}>();
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.banner {
	height: 84px;
	background-color: rgba(0, 0, 0, 0.1);
	background-size: cover;
	background-position: center;
}

.avatar {
	display: block;
	position: absolute;
	top: 62px;
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

.followed {
	position: absolute;
	top: 12px;
	left: 12px;
	padding: 4px 8px;
	color: #fff;
	background: rgba(0, 0, 0, 0.7);
	font-size: 0.7em;
	border-radius: 6px;
}

.description {
	padding: 16px;
	font-size: 0.8em;
	border-top: solid 0.5px var(--divider);
}

.mfm {
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.status {
	padding: 10px 16px;
	border-top: solid 0.5px var(--divider);
}

.statusItem {
	display: inline-block;
	width: 33%;
}

.statusItemLabel {
	margin: 0;
	font-size: 0.7em;
	color: var(--fg);
}

.statusItemValue {
	font-size: 1em;
	color: var(--accent);
}

.follow {
	position: absolute !important;
	top: 8px;
	right: 8px;
}
</style>
