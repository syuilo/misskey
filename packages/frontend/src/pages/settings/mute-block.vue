<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkTab v-model="tab">
		<option value="renoteMute">{{ i18n.ts.mutedUsers }} ({{ i18n.ts.renote }})</option>
		<option value="mute">{{ i18n.ts.mutedUsers }}</option>
		<option value="block">{{ i18n.ts.blockedUsers }}</option>
	</MkTab>

	<div v-if="tab === 'renoteMute'">
		<MkPagination :pagination="renoteMutingPagination">
			<template #empty>
				<div class="_fullinfo">
					<img :src="infoImageUrl" class="_ghost"/>
					<div>{{ i18n.ts.noUsers }}</div>
				</div>
			</template>

			<template #default="{ items }">
				<div class="_gaps_s">
					<div v-for="item in items" :key="item.mutee.id" :class="[$style.userItem, { [$style.userItemOpend]: expandedRenoteMuteItems.includes(item.id) }]">
						<div :class="$style.userItemMain">
							<MkA :class="$style.userItemMainBody" :to="`/user-info/${item.mutee.id}`">
								<MkUserCardMini :user="item.mutee"/>
							</MkA>
							<button class="_button" :class="$style.userToggle" @click="toggleRenoteMuteItem(item)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
							<button class="_button" :class="$style.remove" @click="unrenoteMute(item.mutee, $event)"><i class="ti ti-x"></i></button>
						</div>
						<div v-if="expandedRenoteMuteItems.includes(item.id)" :class="$style.userItemSub">
							<div>Muted at: <MkTime :time="item.createdAt" mode="detail"/></div>
						</div>
					</div>
				</div>
			</template>
		</MkPagination>
	</div>

	<div v-else-if="tab === 'mute'">
		<MkPagination :pagination="mutingPagination">
			<template #empty>
				<div class="_fullinfo">
					<img :src="infoImageUrl" class="_ghost"/>
					<div>{{ i18n.ts.noUsers }}</div>
				</div>
			</template>

			<template #default="{ items }">
				<div class="_gaps_s">
					<div v-for="item in items" :key="item.mutee.id" :class="[$style.userItem, { [$style.userItemOpend]: expandedMuteItems.includes(item.id) }]">
						<div :class="$style.userItemMain">
							<MkA :class="$style.userItemMainBody" :to="`/user-info/${item.mutee.id}`">
								<MkUserCardMini :user="item.mutee"/>
							</MkA>
							<button class="_button" :class="$style.userToggle" @click="toggleMuteItem(item)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
							<button class="_button" :class="$style.remove" @click="unmute(item.mutee, $event)"><i class="ti ti-x"></i></button>
						</div>
						<div v-if="expandedMuteItems.includes(item.id)" :class="$style.userItemSub">
							<div>Muted at: <MkTime :time="item.createdAt" mode="detail"/></div>
							<div v-if="item.expiresAt">Period: {{ new Date(item.expiresAt).toLocaleString() }}</div>
							<div v-else>Period: {{ i18n.ts.indefinitely }}</div>
						</div>
					</div>
				</div>
			</template>
		</MkPagination>
	</div>

	<div v-else-if="tab === 'block'">
		<MkPagination :pagination="blockingPagination">
			<template #empty>
				<div class="_fullinfo">
					<img :src="infoImageUrl" class="_ghost"/>
					<div>{{ i18n.ts.noUsers }}</div>
				</div>
			</template>

			<template #default="{ items }">
				<div class="_gaps_s">
					<div v-for="item in items" :key="item.blockee.id" :class="[$style.userItem, { [$style.userItemOpend]: expandedBlockItems.includes(item.id) }]">
						<div :class="$style.userItemMain">
							<MkA :class="$style.userItemMainBody" :to="`/user-info/${item.blockee.id}`">
								<MkUserCardMini :user="item.blockee"/>
							</MkA>
							<button class="_button" :class="$style.userToggle" @click="toggleBlockItem(item)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
							<button class="_button" :class="$style.remove" @click="unblock(item.blockee, $event)"><i class="ti ti-x"></i></button>
						</div>
						<div v-if="expandedBlockItems.includes(item.id)" :class="$style.userItemSub">
							<div>Blocked at: <MkTime :time="item.createdAt" mode="detail"/></div>
							<div v-if="item.expiresAt">Period: {{ new Date(item.expiresAt).toLocaleString() }}</div>
							<div v-else>Period: {{ i18n.ts.indefinitely }}</div>
						</div>
					</div>
				</div>
			</template>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkTab from '@/components/MkTab.vue';
import FormInfo from '@/components/MkInfo.vue';
import FormLink from '@/components/form/link.vue';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import * as os from '@/os';
import { infoImageUrl } from '@/instance';

let tab = $ref('renoteMute');

const renoteMutingPagination = {
	endpoint: 'renote-mute/list' as const,
	limit: 10,
};

const mutingPagination = {
	endpoint: 'mute/list' as const,
	limit: 10,
};

const blockingPagination = {
	endpoint: 'blocking/list' as const,
	limit: 10,
};

let expandedRenoteMuteItems = $ref([]);
let expandedMuteItems = $ref([]);
let expandedBlockItems = $ref([]);

async function unrenoteMute(user, ev) {
	os.popupMenu([{
		text: i18n.ts.renoteUnmute,
		icon: 'ti ti-x',
		action: async () => {
			await os.apiWithDialog('renote-mute/delete', { userId: user.id });
			//role.users = role.users.filter(u => u.id !== user.id);
		},
	}], ev.currentTarget ?? ev.target);
}

async function unmute(user, ev) {
	os.popupMenu([{
		text: i18n.ts.unmute,
		icon: 'ti ti-x',
		action: async () => {
			await os.apiWithDialog('mute/delete', { userId: user.id });
			//role.users = role.users.filter(u => u.id !== user.id);
		},
	}], ev.currentTarget ?? ev.target);
}

async function unblock(user, ev) {
	os.popupMenu([{
		text: i18n.ts.unblock,
		icon: 'ti ti-x',
		action: async () => {
			await os.apiWithDialog('blocking/delete', { userId: user.id });
			//role.users = role.users.filter(u => u.id !== user.id);
		},
	}], ev.currentTarget ?? ev.target);
}

async function toggleRenoteMuteItem(item) {
	if (expandedRenoteMuteItems.includes(item.id)) {
		expandedRenoteMuteItems = expandedRenoteMuteItems.filter(x => x !== item.id);
	} else {
		expandedRenoteMuteItems.push(item.id);
	}
}

async function toggleMuteItem(item) {
	if (expandedMuteItems.includes(item.id)) {
		expandedMuteItems = expandedMuteItems.filter(x => x !== item.id);
	} else {
		expandedMuteItems.push(item.id);
	}
}

async function toggleBlockItem(item) {
	if (expandedBlockItems.includes(item.id)) {
		expandedBlockItems = expandedBlockItems.filter(x => x !== item.id);
	} else {
		expandedBlockItems.push(item.id);
	}
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.muteAndBlock,
	icon: 'ti ti-ban',
});
</script>

<style lang="scss" module>
.userItemMain {
	display: flex;
}

.userItemSub {
	padding: 6px 12px;
	font-size: 85%;
	color: var(--fgTransparentWeak);
}

.userItemMainBody {
	flex: 1;
	min-width: 0;
	margin-right: 8px;

	&:hover {
		text-decoration: none;
	}
}

.userToggle,
.remove {
	width: 32px;
	height: 32px;
	align-self: center;
}

.chevron {
	display: block;
	transition: transform 0.1s ease-out;
}

.userItem.userItemOpend {
	.chevron {
		transform: rotateX(180deg);
	}
}
</style>
