<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<Transition
			:enterActiveClass="defaultStore.state.animation ? $style.fadeEnterActive : ''"
			:leaveActiveClass="defaultStore.state.animation ? $style.fadeLeaveActive : ''"
			:enterFromClass="defaultStore.state.animation ? $style.fadeEnterFrom : ''"
			:leaveToClass="defaultStore.state.animation ? $style.fadeLeaveTo : ''"
			mode="out-in"
		>
			<div v-if="page" :key="page.id" class="_gaps">
				<div :class="$style.pageMain">
					<div :class="$style.pageBanner">
						<div :class="$style.pageBannerBgRoot">
							<MkImgWithBlurhash
								v-if="page.eyeCatchingImageId"
								:class="$style.pageBannerBg"
								:hash="page.eyeCatchingImage?.blurhash"
								:cover="true"
								:forceBlurhash="true"
							/>
							<img
								v-else-if="instance.backgroundImageUrl || instance.bannerUrl"
								:class="[$style.pageBannerBg, $style.pageBannerBgFallback1]"
								:src="getStaticImageUrl(instance.backgroundImageUrl ?? instance.bannerUrl!)"
							/>
							<div v-else :class="[$style.pageBannerBg, $style.pageBannerBgFallback2]"></div>
						</div>
						<div v-if="page.eyeCatchingImageId" :class="$style.pageBannerImage">
							<MkMediaImage
								:image="page.eyeCatchingImage!"
								:cover="true"
								:disableImageLink="true"
								:class="$style.thumbnail"
							/>
						</div>
						<div :class="$style.pageBannerTitle" class="_gaps_s">
							<h1>{{ page.title || page.name }}</h1>
							<div :class="$style.pageBannerTitleSub">
								<div v-if="page.user" :class="$style.pageBannerTitleUser">
									<MkAvatar :user="page.user" :class="$style.avatar" indicator link preview/> <MkA :to="`/@${username}`"><MkUserName :user="page.user" :nowrap="false"/></MkA>
								</div>
								<div :class="$style.pageBannerTitleSubActions">
									<MkA v-if="page.userId === $i?.id" v-tooltip="i18n.ts._pages.editThisPage" :to="`/pages/edit/${page.id}`" class="_button" :class="$style.generalActionButton"><i class="ti ti-pencil ti-fw"></i></MkA>
									<button v-tooltip="i18n.ts.share" class="_button" :class="$style.generalActionButton" @click="share"><i class="ti ti-share ti-fw"></i></button>
								</div>
							</div>
						</div>
					</div>
					<div :class="$style.pageContent">
						<XPage :page="page"/>
					</div>
					<div :class="$style.pageActions">
						<div>
							<MkButton v-if="page.isLiked" v-tooltip="i18n.ts._pages.unlike" class="button" asLike primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="page.likedCount > 0" class="count">{{ page.likedCount }}</span></MkButton>
							<MkButton v-else v-tooltip="i18n.ts._pages.like" class="button" asLike @click="like()"><i class="ti ti-heart"></i><span v-if="page.likedCount > 0" class="count">{{ page.likedCount }}</span></MkButton>
						</div>
						<div :class="$style.other">
							<MkA v-if="page.userId === $i?.id" v-tooltip="i18n.ts._pages.editThisPage" :to="`/pages/edit/${page.id}`" class="_button" :class="$style.generalActionButton"><i class="ti ti-pencil ti-fw"></i></MkA>
							<button v-tooltip="i18n.ts.copyLink" class="_button" :class="$style.generalActionButton" @click="copyLink"><i class="ti ti-link ti-fw"></i></button>
							<button v-tooltip="i18n.ts.share" class="_button" :class="$style.generalActionButton" @click="share"><i class="ti ti-share ti-fw"></i></button>
							<button v-if="$i" v-click-anime class="_button" :class="$style.generalActionButton" @mousedown="showMenu"><i class="ti ti-dots ti-fw"></i></button>
						</div>
					</div>
					<div :class="$style.pageUser">
						<MkAvatar :user="page.user" :class="$style.avatar" link preview/>
						<MkA :to="`/@${username}`">
							<MkUserName :user="page.user" :class="$style.name"/>
							<MkAcct :user="page.user" :class="$style.acct"/>
						</MkA>
						<MkFollowButton v-if="!$i || $i.id != page.user.id" :user="page.user!" :inline="true" :transparent="false" :full="true" :class="$style.follow"/>
					</div>
					<div :class="$style.pageDate">
						<div><i class="ti ti-clock"></i> {{ i18n.ts.createdAt }}: <MkTime :time="page.createdAt" mode="detail"/></div>
						<div v-if="page.createdAt != page.updatedAt"><i class="ti ti-clock-edit"></i> {{ i18n.ts.updatedAt }}: <MkTime :time="page.updatedAt" mode="detail"/></div>
					</div>
				</div>
				<MkAd :prefer="['horizontal', 'horizontal-big']"/>
				<MkContainer :max-height="300" :foldable="true" class="other">
					<template #icon><i class="ti ti-clock"></i></template>
					<template #header>{{ i18n.ts.recentPosts }}</template>
					<MkPagination v-slot="{items}" :pagination="otherPostsPagination" :class="$style.relatedPagesRoot" class="_gaps">
						<MkPagePreview v-for="page in items" :key="page.id" :page="page" :class="$style.relatedPagesItem"/>
					</MkPagination>
				</MkContainer>
			</div>
			<MkError v-else-if="error" @retry="fetchPage()"/>
			<MkLoading v-else/>
		</Transition>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import XPage from '@/components/page/page.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { url } from '@@/js/config.js';
import MkMediaImage from '@/components/MkMediaImage.vue';
import MkImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import MkFollowButton from '@/components/MkFollowButton.vue';
import MkContainer from '@/components/MkContainer.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkPagePreview from '@/components/MkPagePreview.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { pageViewInterruptors, defaultStore } from '@/store.js';
import { deepClone } from '@/scripts/clone.js';
import { $i } from '@/account.js';
import { isSupportShare } from '@/scripts/navigator.js';
import { instance } from '@/instance.js';
import { getStaticImageUrl } from '@/scripts/media-proxy.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { useRouter } from '@/router/supplier.js';
import type { MenuItem } from '@/types/menu.js';

const router = useRouter();

const props = defineProps<{
	pageName: string;
	username: string;
}>();

const page = ref<Misskey.entities.Page | null>(null);
const error = ref<any>(null);
const otherPostsPagination = {
	endpoint: 'users/pages' as const,
	limit: 6,
	params: computed(() => ({
		userId: page.value.user.id,
	})),
};
const path = computed(() => props.username + '/' + props.pageName);

function fetchPage() {
	page.value = null;
	misskeyApi('pages/show', {
		name: props.pageName,
		username: props.username,
	}).then(async _page => {
		page.value = _page;

		// plugin
		if (pageViewInterruptors.length > 0) {
			let result = deepClone(_page);
			for (const interruptor of pageViewInterruptors) {
				result = await interruptor.handler(result);
			}
			page.value = result;
		}
	}).catch(err => {
		error.value = err;
	});
}

function share(ev: MouseEvent) {
	if (!page.value) return;

	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: i18n.ts.shareWithNote,
		icon: 'ti ti-pencil',
		action: shareWithNote,
	});

	if (isSupportShare()) {
		menuItems.push({
			text: i18n.ts.share,
			icon: 'ti ti-share',
			action: shareWithNavigator,
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

function copyLink() {
	if (!page.value) return;

	copyToClipboard(`${url}/@${page.value.user.username}/pages/${page.value.name}`);
	os.success();
}

function shareWithNote() {
	if (!page.value) return;

	os.post({
		initialText: `${page.value.title || page.value.name}\n${url}/@${page.value.user.username}/pages/${page.value.name}`,
		instant: true,
	});
}

function shareWithNavigator() {
	if (!page.value) return;

	navigator.share({
		title: page.value.title ?? page.value.name,
		text: page.value.summary ?? undefined,
		url: `${url}/@${page.value.user.username}/pages/${page.value.name}`,
	});
}

function like() {
	if (!page.value) return;

	os.apiWithDialog('pages/like', {
		pageId: page.value.id,
	}).then(() => {
		page.value!.isLiked = true;
		page.value!.likedCount++;
	});
}

async function unlike() {
	if (!page.value) return;

	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('pages/unlike', {
		pageId: page.value.id,
	}).then(() => {
		page.value!.isLiked = false;
		page.value!.likedCount--;
	});
}

function pin(pin) {
	if (!page.value) return;

	os.apiWithDialog('i/update', {
		pinnedPageId: pin ? page.value.id : null,
	});
}

function reportAbuse() {
	if (!page.value) return;

	const pageUrl = `${url}/@${props.username}/pages/${props.pageName}`;

	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkAbuseReportWindow.vue')), {
		user: page.value.user,
		initialComment: `Page: ${pageUrl}\n-----\n`,
	}, {
		closed: () => dispose(),
	});
}

function showMenu(ev: MouseEvent) {
	if (!page.value) return;

	const menuItems: MenuItem[] = [];

	if ($i && $i.id === page.value.userId) {
		menuItems.push({
			icon: 'ti ti-pencil',
			text: i18n.ts.editThisPage,
			action: () => router.push(`/pages/edit/${page.value.id}`),
		});

		if ($i.pinnedPageId === page.value.id) {
			menuItems.push({
				icon: 'ti ti-pinned-off',
				text: i18n.ts.unpin,
				action: () => pin(false),
			});
		} else {
			menuItems.push({
				icon: 'ti ti-pin',
				text: i18n.ts.pin,
				action: () => pin(true),
			});
		}
	} else if ($i && $i.id !== page.value.userId) {
		menuItems.push({
			icon: 'ti ti-exclamation-circle',
			text: i18n.ts.reportAbuse,
			action: reportAbuse,
		});

		if ($i.isModerator || $i.isAdmin) {
			menuItems.push({
				type: 'divider',
			}, {
				icon: 'ti ti-trash',
				text: i18n.ts.delete,
				danger: true,
				action: () => os.confirm({
					type: 'warning',
					text: i18n.ts.deleteConfirm,
				}).then(({ canceled }) => {
					if (canceled || !page.value) return;

					os.apiWithDialog('pages/delete', { pageId: page.value.id });
				}),
			});
		}
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

watch(() => path.value, fetchPage, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: page.value ? page.value.title || page.value.name : i18n.ts.pages,
	...page.value ? {
		avatar: page.value.user,
		path: `/@${page.value.user.username}/pages/${page.value.name}`,
		share: {
			title: page.value.title || page.value.name,
			text: page.value.summary,
		},
	} : {},
}));
</script>

<style lang="scss" module>
.fadeEnterActive,
.fadeLeaveActive {
	transition: opacity 0.125s ease;
}
.fadeEnterFrom,
.fadeLeaveTo {
	opacity: 0;
}

.generalActionButton {
	height: 2.5rem;
	width: 2.5rem;
	text-align: center;
	border-radius: 99rem;

	& :global(.ti) {
		line-height: 2.5rem;
	}

	&:hover,
	&:focus-visible {
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
		text-decoration: none;
		outline: none;
	}
}

.pageMain {
	border-radius: var(--MI-radius);
	padding: 2rem;
	background: var(--MI_THEME-panel);
	box-sizing: border-box;
}

.pageBanner {
	width: calc(100% + 4rem);
	margin: -2rem -2rem 1.5rem;
	border-radius: var(--MI-radius) var(--MI-radius) 0 0;
	overflow: hidden;
	position: relative;

	> .pageBannerBgRoot {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;

		.pageBannerBg {
			width: 100%;
			height: 100%;
			object-fit: cover;
			opacity: .2;
			filter: brightness(1.2);
		}

		.pageBannerBgFallback1 {
			filter: blur(20px);
		}

		.pageBannerBgFallback2 {
			background-color: var(--MI_THEME-accentedBg);
		}

		&::after {
			content: '';
			position: absolute;
			left: 0;
			bottom: 0;
			width: 100%;
			height: 100px;
			background: linear-gradient(0deg, var(--MI_THEME-panel), transparent);
		}
	}

	> .pageBannerImage {
		position: relative;
		padding-top: 56.25%;

		> .thumbnail {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}
	}

	> .pageBannerTitle {
		position: relative;
		padding: 1.5rem 2rem;

		h1 {
			font-size: 2rem;
			font-weight: 700;
			color: var(--MI_THEME-fg);
			margin: 0;
		}

		.pageBannerTitleSub {
			display: flex;
			align-items: center;
			width: 100%;
		}

		.pageBannerTitleUser {
			--height: 32px;
			flex-shrink: 0;
			line-height: var(--height);

			.avatar {
				height: var(--height);
				width: var(--height);
			}
		}

		.pageBannerTitleSubActions {
			flex-shrink: 0;
			display: flex;
			align-items: center;
			gap: var(--MI-marginHalf);
			margin-left: auto;
		}
	}
}

.pageContent {
	margin-bottom: 1.5rem;
}

.pageActions {
	display: flex;
	align-items: center;

	border-top: 1px solid var(--MI_THEME-divider);
	padding-top: 1.5rem;
	margin-bottom: 1.5rem;

	> .other {
		margin-left: auto;
		display: flex;
		gap: var(--MI-marginHalf);
	}
}

.pageUser {
	display: flex;
	align-items: center;

	border-top: 1px solid var(--MI_THEME-divider);
	padding-top: 1.5rem;
	margin-bottom: 1.5rem;

	.avatar,
	.name,
	.acct {
		display: block;
	}

	.avatar {
		width: 4rem;
		height: 4rem;
		margin-right: 1rem;
	}

	.name {
		font-size: 110%;
		font-weight: 700;
	}

	.acct {
		font-size: 90%;
		opacity: 0.7;
	}

	.follow {
		margin-left: auto;
	}
}

.pageDate {
	margin-bottom: 1.5rem;
}

.pageLinks {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: var(--MI-marginHalf);
}

.relatedPagesRoot {
	padding: var(--MI-margin);
}

.relatedPagesItem > article {
	background-color: var(--MI_THEME-panelHighlight) !important;
}
</style>
