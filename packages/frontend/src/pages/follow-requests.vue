<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
			<div :key="tab" class="_gaps">
				<MkPagination ref="paginationComponent" :pagination="pagination">
					<template #empty>
						<div class="_fullinfo">
							<img :src="infoImageUrl" class="_ghost"/>
							<div>{{ i18n.ts.noFollowRequests }}</div>
						</div>
					</template>
					<template #default="{items}">
						<div class="mk-follow-requests _gaps">
							<div v-for="req in items" :key="req.id" class="user _panel">
								<MkAvatar class="avatar" :user="displayUser(req)" indicator link preview/>
								<div class="body">
									<div class="name">
										<MkA v-user-preview="displayUser(req).id" class="name" :to="userPage(displayUser(req))"><MkUserName :user="displayUser(req)"/></MkA>
										<p class="acct">@{{ acct(displayUser(req)) }}</p>
									</div>
									<div v-if="tab === 'list'" class="commands">
										<MkButton class="command" rounded primary @click="accept(displayUser(req))"><i class="ti ti-check"/> {{ i18n.ts.accept }}</MkButton>
										<MkButton class="command" rounded danger @click="reject(displayUser(req))"><i class="ti ti-x"/> {{ i18n.ts.reject }}</MkButton>
									</div>
									<div v-else class="commands">
										<MkButton class="command" rounded danger @click="cancel(displayUser(req))"><i class="ti ti-x"/> {{ i18n.ts.cancel }}</MkButton>
									</div>
								</div>
							</div>
						</div>
					</template>
				</MkPagination>
			</div>
		</MkHorizontalSwipe>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { shallowRef, computed, ref } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import type { Paging } from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import { userPage, acct } from '@/filters/user.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { infoImageUrl } from '@/instance.js';
import { $i } from '@/account.js';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';

const paginationComponent = shallowRef<InstanceType<typeof MkPagination>>();

const pagination = computed<Paging>(() => tab.value === 'list' ? {
	endpoint: 'following/requests/list',
	limit: 10,
} : {
	endpoint: 'following/requests/sent',
	limit: 10,
});

function accept(user: Misskey.entities.UserLite) {
	os.apiWithDialog('following/requests/accept', { userId: user.id }).then(() => {
		paginationComponent.value?.reload();
	});
}

function reject(user: Misskey.entities.UserLite) {
	os.apiWithDialog('following/requests/reject', { userId: user.id }).then(() => {
		paginationComponent.value?.reload();
	});
}

function cancel(user: Misskey.entities.UserLite) {
	os.apiWithDialog('following/requests/cancel', { userId: user.id }).then(() => {
		paginationComponent.value?.reload();
	});
}

function displayUser(req) {
	return tab.value === 'list' ? req.follower : req.followee;
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [
	{
		key: 'list',
		title: i18n.ts._followRequest.recieved,
		icon: 'ti ti-download',
	}, {
		key: 'sent',
		title: i18n.ts._followRequest.sent,
		icon: 'ti ti-upload',
	},
]);

const tab = ref($i?.isLocked ? 'list' : 'sent');

definePageMetadata(() => ({
	title: i18n.ts.followRequests,
	icon: 'ti ti-user-plus',
}));
</script>

<style lang="scss" scoped>
.mk-follow-requests {
	> .user {
		display: flex;
		padding: 16px;

		> .avatar {
			display: block;
			flex-shrink: 0;
			margin: 0 12px 0 0;
			width: 42px;
			height: 42px;
			border-radius: 8px;
		}

		> .body {
			display: flex;
			width: calc(100% - 54px);
			position: relative;
			flex-wrap: wrap;
			gap: 8px;

			> .name {
				flex: 1 1 50%;

				> .name,
				> .acct {
					display: block;
					white-space: nowrap;
					text-overflow: ellipsis;
					overflow: hidden;
					margin: 0;
				}

				> .name {
					font-size: 16px;
					line-height: 24px;
				}

				> .acct {
					font-size: 15px;
					line-height: 16px;
					opacity: 0.7;
				}
			}

			> .description {
				width: 55%;
				line-height: 42px;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				opacity: 0.7;
				font-size: 14px;
				padding-right: 40px;
				padding-left: 8px;
				box-sizing: border-box;

				@media (max-width: 500px) {
					display: none;
				}
			}

			> .commands {
				display: flex;
				gap: 8px;
			}

			> .actions {
				position: absolute;
				top: 0;
				bottom: 0;
				right: 0;
				margin: auto 0;

				> button {
					padding: 12px;
				}
			}
		}
	}
}
</style>
