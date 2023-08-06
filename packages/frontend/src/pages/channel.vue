<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :class="$style.main">
		<div v-if="channel && tab === 'overview'" class="_gaps">
			<div class="_panel" :class="$style.bannerContainer">
				<XChannelFollowButton :channel="channel" :full="true" :class="$style.subscribe"/>
				<MkButton v-if="favorited" v-tooltip="i18n.ts.unfavorite" asLike class="button" rounded primary :class="$style.favorite" @click="unfavorite()"><i class="ti ti-star"></i></MkButton>
				<MkButton v-else v-tooltip="i18n.ts.favorite" asLike class="button" rounded :class="$style.favorite" @click="favorite()"><i class="ti ti-star"></i></MkButton>
				<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : null }" :class="$style.banner">
					<div :class="$style.bannerStatus">
						<div><i class="ti ti-users ti-fw"></i><I18n :src="i18n.ts._channel.usersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.usersCount }}</b></template></I18n></div>
						<div><i class="ti ti-pencil ti-fw"></i><I18n :src="i18n.ts._channel.notesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.notesCount }}</b></template></I18n></div>
					</div>
					<div v-if="channel.isSensitive" :class="$style.sensitiveIndicator">{{ i18n.ts.sensitive }}</div>
					<div :class="$style.bannerFade"></div>
				</div>
				<div v-if="channel.description" :class="$style.description">
					<Mfm :text="channel.description" :isNote="false" :i="$i"/>
				</div>
			</div>

			<MkFoldableSection>
				<template #header><i class="ti ti-pin ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.pinnedNotes }}</template>
				<div v-if="channel.pinnedNotes.length > 0" class="_gaps">
					<MkNote v-for="note in channel.pinnedNotes" :key="note.id" class="_panel" :note="note"/>
				</div>
			</MkFoldableSection>
		</div>
		<div v-if="channel && tab === 'timeline'" class="_gaps">
			<MkInfo v-if="channel.isArchived" warn>{{ i18n.ts.thisChannelArchived }}</MkInfo>

			<!-- スマホ・タブレットの場合、キーボードが表示されると投稿が見づらくなるので、デスクトップ場合のみ自動でフォーカスを当てる -->
			<MkPostForm v-if="$i && defaultStore.reactiveState.showFixedPostFormInChannel.value" :channel="channel" class="post-form _panel" fixed :autofocus="deviceKind === 'desktop'"/>

			<MkTimeline :key="channelId" src="channel" :channel="channelId" @before="before" @after="after"/>
		</div>
		<div v-else-if="tab === 'featured'">
			<MkNotes :pagination="featuredPagination"/>
		</div>
		<div v-else-if="tab === 'search'">
			<div class="_gaps">
				<div>
					<MkInput v-model="searchQuery">
						<template #prefix><i class="ti ti-search"></i></template>
					</MkInput>
					<MkButton primary rounded style="margin-top: 8px;" @click="search()">{{ i18n.ts.search }}</MkButton>
				</div>
				<MkNotes v-if="searchPagination" :key="searchKey" :pagination="searchPagination"/>
			</div>
		</div>
	</MkSpacer>
	<template #footer>
		<div :class="$style.footer">
			<MkSpacer :contentMax="700" :marginMin="16" :marginMax="16">
				<div class="_buttonsCenter">
					<MkButton inline rounded primary gradate @click="openPostForm()"><i class="ti ti-pencil"></i> {{ i18n.ts.postToTheChannel }}</MkButton>
				</div>
			</MkSpacer>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, watch } from 'vue';
import MkPostForm from '@/components/MkPostForm.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import XChannelFollowButton from '@/components/MkChannelFollowButton.vue';
import * as os from '@/os';
import { useRouter } from '@/router';
import { $i, iAmModerator } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { deviceKind } from '@/scripts/device-kind';
import MkNotes from '@/components/MkNotes.vue';
import { url } from '@/config';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import { defaultStore } from '@/store';
import MkNote from '@/components/MkNote.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';

const router = useRouter();

const props = defineProps<{
	channelId: string;
}>();

let tab = $ref('overview');
let channel = $ref(null);
let favorited = $ref(false);
let searchQuery = $ref('');
let searchPagination = $ref();
let searchKey = $ref('');
const featuredPagination = $computed(() => ({
	endpoint: 'notes/featured' as const,
	limit: 10,
	offsetMode: true,
	params: {
		channelId: props.channelId,
	},
}));

watch(() => props.channelId, async () => {
	channel = await os.api('channels/show', {
		channelId: props.channelId,
	});
	favorited = channel.isFavorited;
	if (favorited || channel.isFollowing) {
		tab = 'timeline';
	}
}, { immediate: true });

function edit() {
	router.push(`/channels/${channel.id}/edit`);
}

function openPostForm() {
	os.post({
		channel,
	});
}

function favorite() {
	os.apiWithDialog('channels/favorite', {
		channelId: channel.id,
	}).then(() => {
		favorited = true;
	});
}

async function unfavorite() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unfavoriteConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('channels/unfavorite', {
		channelId: channel.id,
	}).then(() => {
		favorited = false;
	});
}

async function search() {
	const query = searchQuery.toString().trim();

	if (query == null) return;

	searchPagination = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			query: query,
			channelId: channel.id,
		},
	};

	searchKey = query;
}

const headerActions = $computed(() => {
	if (channel && channel.userId) {
		const share = {
			icon: 'ti ti-share',
			text: i18n.ts.share,
			handler: async (): Promise<void> => {
				navigator.share({
					title: channel.name,
					text: channel.description,
					url: `${url}/channels/${channel.id}`,
				});
			},
		};

		const canEdit = ($i && $i.id === channel.userId) || iAmModerator;
		return canEdit ? [share, {
			icon: 'ti ti-settings',
			text: i18n.ts.edit,
			handler: edit,
		}] : [share];
	} else {
		return null;
	}
});

const headerTabs = $computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, {
	key: 'timeline',
	title: i18n.ts.timeline,
	icon: 'ti ti-home',
}, {
	key: 'featured',
	title: i18n.ts.featured,
	icon: 'ti ti-bolt',
}, {
	key: 'search',
	title: i18n.ts.search,
	icon: 'ti ti-search',
}]);

definePageMetadata(computed(() => channel ? {
	title: channel.name,
	icon: 'ti ti-device-tv',
} : null));
</script>

<style lang="scss" module>
.main {
	min-height: calc(100cqh - (var(--stickyTop, 0px) + var(--stickyBottom, 0px)));
}

.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	border-top: solid 0.5px var(--divider);
}

.bannerContainer {
	position: relative;
}

.subscribe {
	position: absolute;
	z-index: 1;
	top: 16px;
	left: 16px;
}

.favorite {
	position: absolute;
	z-index: 1;
	top: 16px;
	right: 16px;
}

.banner {
	position: relative;
	height: 200px;
	background-position: center;
	background-size: cover;
}

.bannerFade {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 64px;
	background: linear-gradient(0deg, var(--panel), var(--X15));
}

.bannerStatus {
	position: absolute;
	z-index: 1;
	bottom: 16px;
	right: 16px;
	padding: 8px 12px;
	font-size: 80%;
	background: rgba(0, 0, 0, 0.7);
	border-radius: 6px;
	color: #fff;
}

.description {
	padding: 16px;
}

.sensitiveIndicator {
	position: absolute;
	z-index: 1;
	bottom: 16px;
	left: 16px;
	background: rgba(0, 0, 0, 0.7);
	color: var(--warn);
	border-radius: 6px;
	font-weight: bold;
	font-size: 1em;
	padding: 4px 7px;
}
</style>
