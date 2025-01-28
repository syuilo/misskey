<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :class="$style.main">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<div v-if="channel && tab === 'overview'" key="overview" class="_gaps">
				<div class="_panel" :class="$style.bannerContainer">
					<XChannelFollowButton :channel="channel" :full="true" :class="$style.subscribe"/>
					<MkButton v-if="favorited" v-tooltip="i18n.ts.unfavorite" asLike class="button" rounded primary :class="$style.favorite" @click="unfavorite()"><i class="ti ti-star"></i></MkButton>
					<MkButton v-else v-tooltip="i18n.ts.favorite" asLike class="button" rounded :class="$style.favorite" @click="favorite()"><i class="ti ti-star"></i></MkButton>
					<div :style="{ backgroundImage: channel.bannerUrl ? `url(${channel.bannerUrl})` : undefined }" :class="$style.banner">
						<div :class="$style.bannerStatus">
							<div><i class="ti ti-users ti-fw"></i><I18n :src="i18n.ts._channel.usersCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.usersCount }}</b></template></I18n></div>
							<div><i class="ti ti-pencil ti-fw"></i><I18n :src="i18n.ts._channel.notesCount" tag="span" style="margin-left: 4px;"><template #n><b>{{ channel.notesCount }}</b></template></I18n></div>
						</div>
						<div v-if="channel.isSensitive" :class="$style.sensitiveIndicator">{{ i18n.ts.sensitive }}</div>
						<div :class="$style.bannerFade"></div>
					</div>
					<div v-if="channel.description" :class="$style.description">
						<Mfm :text="channel.description" :isNote="false"/>
					</div>
				</div>

				<MkFoldableSection>
					<template #header><i class="ti ti-pin ti-fw" style="margin-right: 0.5em;"></i>{{ i18n.ts.pinnedNotes }}</template>
					<div v-if="channel.pinnedNotes && channel.pinnedNotes.length > 0" class="_gaps">
						<MkNote v-for="note in channel.pinnedNotes" :key="note.id" class="_panel" :note="note"/>
					</div>
				</MkFoldableSection>
			</div>
			<div v-if="channel && tab === 'timeline'" key="timeline" class="_gaps">
				<MkInfo v-if="channel.isArchived" warn>{{ i18n.ts.thisChannelArchived }}</MkInfo>

				<!-- スマホ・タブレットの場合、キーボードが表示されると投稿が見づらくなるので、デスクトップ場合のみ自動でフォーカスを当てる -->
				<MkPostForm v-if="$i && defaultStore.reactiveState.showFixedPostFormInChannel.value" :channel="channel" class="post-form _panel" fixed :autofocus="deviceKind === 'desktop'"/>

				<MkTimeline :key="channelId" src="channel" :channel="channelId" @before="before" @after="after" @note="miLocalStorage.setItemAsJson(`channelLastReadedAt:${channel.id}`, Date.now())"/>
			</div>
			<div v-else-if="tab === 'featured'" key="featured">
				<MkNotes :pagination="featuredPagination"/>
			</div>
			<div v-else-if="tab === 'search'" key="search">
				<div v-if="notesSearchAvailable" class="_gaps">
					<div>
						<MkInput v-model="searchQuery" @enter="search()">
							<template #prefix><i class="ti ti-search"></i></template>
						</MkInput>
						<MkButton primary rounded style="margin-top: 8px;" @click="search()">{{ i18n.ts.search }}</MkButton>
					</div>
					<MkNotes v-if="searchPagination" :key="searchKey" :pagination="searchPagination"/>
				</div>
				<div v-else>
					<MkInfo warn>{{ i18n.ts.notesSearchNotAvailable }}</MkInfo>
				</div>
			</div>
		</MkHorizontalSwipe>
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
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkPostForm from '@/components/MkPostForm.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import XChannelFollowButton from '@/components/MkChannelFollowButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { $i, iAmModerator } from '@/account.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { deviceKind } from '@/scripts/device-kind.js';
import MkNotes from '@/components/MkNotes.vue';
import { url } from '@@/js/config.js';
import { favoritedChannelsCache } from '@/cache.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import { defaultStore } from '@/store.js';
import MkNote from '@/components/MkNote.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';
import type { PageHeaderItem } from '@/types/page-header.js';
import { isSupportShare } from '@/scripts/navigator.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { notesSearchAvailable } from '@/scripts/check-permissions.js';
import { miLocalStorage } from '@/local-storage.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

const props = defineProps<{
	channelId: string;
}>();

const tab = ref('overview');

const channel = ref<Misskey.entities.Channel | null>(null);
const favorited = ref(false);
const searchQuery = ref('');
const searchPagination = ref();
const searchKey = ref('');
const featuredPagination = computed(() => ({
	endpoint: 'notes/featured' as const,
	limit: 10,
	params: {
		channelId: props.channelId,
	},
}));

watch(() => props.channelId, async () => {
	channel.value = await misskeyApi('channels/show', {
		channelId: props.channelId,
	});
	favorited.value = channel.value.isFavorited ?? false;
	if (favorited.value || channel.value.isFollowing) {
		tab.value = 'timeline';
	}

	if ((favorited.value || channel.value.isFollowing) && channel.value.lastNotedAt) {
		const lastReadedAt: number = miLocalStorage.getItemAsJson(`channelLastReadedAt:${channel.value.id}`) ?? 0;
		const lastNotedAt = Date.parse(channel.value.lastNotedAt);

		if (lastNotedAt > lastReadedAt) {
			miLocalStorage.setItemAsJson(`channelLastReadedAt:${channel.value.id}`, lastNotedAt);
		}
	}
}, { immediate: true });

function edit() {
	router.push(`/channels/${channel.value?.id}/edit`);
}

function openPostForm() {
	os.post({
		channel: channel.value,
	});
}

function favorite() {
	if (!channel.value) return;

	os.apiWithDialog('channels/favorite', {
		channelId: channel.value.id,
	}).then(() => {
		favorited.value = true;
		favoritedChannelsCache.delete();
	});
}

async function unfavorite() {
	if (!channel.value) return;

	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unfavoriteConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('channels/unfavorite', {
		channelId: channel.value.id,
	}).then(() => {
		favorited.value = false;
		favoritedChannelsCache.delete();
	});
}

async function search() {
	if (!channel.value) return;

	const query = searchQuery.value.toString().trim();

	if (query == null) return;

	searchPagination.value = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			query: query,
			channelId: channel.value.id,
		},
	};

	searchKey.value = query;
}

const headerActions = computed(() => {
	if (channel.value && channel.value.userId) {
		const headerItems: PageHeaderItem[] = [];

		headerItems.push({
			icon: 'ti ti-link',
			text: i18n.ts.copyUrl,
			handler: async (): Promise<void> => {
				if (!channel.value) {
					console.warn('failed to copy channel URL. channel.value is null.');
					return;
				}
				copyToClipboard(`${url}/channels/${channel.value.id}`);
				os.success();
			},
		});

		if (isSupportShare()) {
			headerItems.push({
				icon: 'ti ti-share',
				text: i18n.ts.share,
				handler: async (): Promise<void> => {
					if (!channel.value) {
						console.warn('failed to share channel. channel.value is null.');
						return;
					}

					navigator.share({
						title: channel.value.name,
						text: channel.value.description ?? undefined,
						url: `${url}/channels/${channel.value.id}`,
					});
				},
			});
		}

		if (($i && $i.id === channel.value.userId) || iAmModerator) {
			headerItems.push({
				icon: 'ti ti-settings',
				text: i18n.ts.edit,
				handler: edit,
			});
		}

		return headerItems.length > 0 ? headerItems : null;
	} else {
		return null;
	}
});

const headerTabs = computed(() => [{
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

definePageMetadata(() => ({
	title: channel.value ? channel.value.name : i18n.ts.channel,
	icon: 'ti ti-device-tv',
}));
</script>

<style lang="scss" module>
.main {
	min-height: calc(100cqh - (var(--MI-stickyTop, 0px) + var(--MI-stickyBottom, 0px)));
}

.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background: var(--MI_THEME-acrylicBg);
	border-top: solid 0.5px var(--MI_THEME-divider);
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
	background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));
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
	color: var(--MI_THEME-warn);
	border-radius: 6px;
	font-weight: bold;
	font-size: 1em;
	padding: 4px 7px;
}
</style>
