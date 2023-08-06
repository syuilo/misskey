<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="1000" :marginMin="16" :marginMax="32">
		<div class="_root">
			<Transition :name="defaultStore.state.animation ? 'fade' : ''" mode="out-in">
				<div v-if="post" class="rkxwuolj">
					<div class="files">
						<div v-for="file in post.files" :key="file.id" class="file">
							<img :src="file.url"/>
						</div>
					</div>
					<div class="body">
						<div class="title">{{ post.title }}</div>
						<div class="description"><Mfm :text="post.description"/></div>
						<div class="info">
							<i class="ti ti-clock"></i> <MkTime :time="post.createdAt" mode="detail"/>
						</div>
						<div class="actions">
							<div class="like">
								<MkButton v-if="post.isLiked" v-tooltip="i18n.ts._gallery.unlike" class="button" primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="post.likedCount > 0" class="count">{{ post.likedCount }}</span></MkButton>
								<MkButton v-else v-tooltip="i18n.ts._gallery.like" class="button" @click="like()"><i class="ti ti-heart"></i><span v-if="post.likedCount > 0" class="count">{{ post.likedCount }}</span></MkButton>
							</div>
							<div class="other">
								<button v-if="$i && $i.id === post.user.id" v-tooltip="i18n.ts.edit" v-click-anime class="_button" @click="edit"><i class="ti ti-pencil ti-fw"></i></button>
								<button v-tooltip="i18n.ts.shareWithNote" v-click-anime class="_button" @click="shareWithNote"><i class="ti ti-repeat ti-fw"></i></button>
								<button v-tooltip="i18n.ts.share" v-click-anime class="_button" @click="share"><i class="ti ti-share ti-fw"></i></button>
							</div>
						</div>
						<div class="user">
							<MkAvatar :user="post.user" class="avatar" link preview/>
							<div class="name">
								<MkUserName :user="post.user" style="display: block;"/>
								<MkAcct :user="post.user"/>
							</div>
							<MkFollowButton v-if="!$i || $i.id != post.user.id" :user="post.user" :inline="true" :transparent="false" :full="true" large class="koudoku"/>
						</div>
					</div>
					<MkAd :prefer="['horizontal', 'horizontal-big']"/>
					<MkContainer :max-height="300" :foldable="true" class="other">
						<template #icon><i class="ti ti-clock"></i></template>
						<template #header>{{ i18n.ts.recentPosts }}</template>
						<MkPagination v-slot="{items}" :pagination="otherPostsPagination">
							<div class="sdrarzaf">
								<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
							</div>
						</MkPagination>
					</MkContainer>
				</div>
				<MkError v-else-if="error" @retry="fetchPost()"/>
				<MkLoading v-else/>
			</Transition>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import MkContainer from '@/components/MkContainer.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkGalleryPostPreview from '@/components/MkGalleryPostPreview.vue';
import MkFollowButton from '@/components/MkFollowButton.vue';
import { url } from '@/config';
import { useRouter } from '@/router';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { defaultStore } from '@/store';
import { $i } from '@/account';

const router = useRouter();

const props = defineProps<{
	postId: string;
}>();

let post = $ref(null);
let error = $ref(null);
const otherPostsPagination = {
	endpoint: 'users/gallery/posts' as const,
	limit: 6,
	params: computed(() => ({
		userId: post.user.id,
	})),
};

function fetchPost() {
	post = null;
	os.api('gallery/posts/show', {
		postId: props.postId,
	}).then(_post => {
		post = _post;
	}).catch(_error => {
		error = _error;
	});
}

function share() {
	navigator.share({
		title: post.title,
		text: post.description,
		url: `${url}/gallery/${post.id}`,
	});
}

function shareWithNote() {
	os.post({
		initialText: `${post.title} ${url}/gallery/${post.id}`,
	});
}

function like() {
	os.apiWithDialog('gallery/posts/like', {
		postId: props.postId,
	}).then(() => {
		post.isLiked = true;
		post.likedCount++;
	});
}

async function unlike() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('gallery/posts/unlike', {
		postId: props.postId,
	}).then(() => {
		post.isLiked = false;
		post.likedCount--;
	});
}

function edit() {
	router.push(`/gallery/${post.id}/edit`);
}

watch(() => props.postId, fetchPost, { immediate: true });

const headerActions = $computed(() => [{
	icon: 'ti ti-pencil',
	text: i18n.ts.edit,
	handler: edit,
}]);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => post ? {
	title: post.title,
	avatar: post.user,
} : null));
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.rkxwuolj {
	> .files {
		> .file {
			> img {
				display: block;
				max-width: 100%;
				max-height: 500px;
				margin: 0 auto;
			}

			& + .file {
				margin-top: 16px;
			}
		}
	}

	> .body {
		padding: 32px;

		> .title {
			font-weight: bold;
			font-size: 1.2em;
			margin-bottom: 16px;
		}

		> .info {
			margin-top: 16px;
			font-size: 90%;
			opacity: 0.7;
		}

		> .actions {
			display: flex;
			align-items: center;
			margin-top: 16px;
			padding: 16px 0 0 0;
			border-top: solid 0.5px var(--divider);

			> .like {
				> .button {
					--accent: rgb(241 97 132);
					--X8: rgb(241 92 128);
					--buttonBg: rgb(216 71 106 / 5%);
					--buttonHoverBg: rgb(216 71 106 / 10%);
					color: #ff002f;

					::v-deep(.count) {
						margin-left: 0.5em;
					}
				}
			}

			> .other {
				margin-left: auto;

				> button {
					padding: 8px;
					margin: 0 8px;

					&:hover {
						color: var(--fgHighlighted);
					}
				}
			}
		}

		> .user {
			margin-top: 16px;
			padding: 16px 0 0 0;
			border-top: solid 0.5px var(--divider);
			display: flex;
			align-items: center;
			flex-wrap: wrap;

			> .avatar {
				width: 52px;
				height: 52px;
			}

			> .name {
				margin: 0 0 0 12px;
				font-size: 90%;
			}

			> .koudoku {
				margin-left: auto;
			}
		}
	}
}

.sdrarzaf {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: var(--margin);

	> .post {

	}
}
</style>
