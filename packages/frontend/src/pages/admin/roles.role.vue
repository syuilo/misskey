<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700">
			<div class="_gaps">
				<div class="_buttons">
					<MkButton primary rounded @click="edit"><i class="ti ti-pencil"></i> {{ i18n.ts.edit }}</MkButton>
					<MkButton danger rounded @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
				</div>
				<MkFolder>
					<template #icon><i class="ti ti-info-circle"></i></template>
					<template #label>{{ i18n.ts.info }}</template>
					<XEditor :modelValue="role" readonly/>
				</MkFolder>
				<MkFolder v-if="role.target === 'manual'" defaultOpen>
					<template #icon><i class="ti ti-users"></i></template>
					<template #label>{{ i18n.ts.users }}</template>
					<template #suffix>{{ role.usersCount }}</template>
					<div class="_gaps">
						<MkButton primary rounded @click="assign"><i class="ti ti-plus"></i> {{ i18n.ts.assign }}</MkButton>

						<MkPagination :pagination="usersPagination">
							<template #empty>
								<div class="_fullinfo">
									<img :src="infoImageUrl" class="_ghost"/>
									<div>{{ i18n.ts.noUsers }}</div>
								</div>
							</template>

							<template #default="{ items }">
								<div class="_gaps_s">
									<div v-for="item in items" :key="item.user.id" :class="[$style.userItem, { [$style.userItemOpend]: expandedItems.includes(item.id) }]">
										<div :class="$style.userItemMain">
											<MkA :class="$style.userItemMainBody" :to="`/user-info/${item.user.id}`">
												<MkUserCardMini :user="item.user"/>
											</MkA>
											<button class="_button" :class="$style.userToggle" @click="toggleItem(item)"><i :class="$style.chevron" class="ti ti-chevron-down"></i></button>
											<button class="_button" :class="$style.unassign" @click="unassign(item.user, $event)"><i class="ti ti-x"></i></button>
										</div>
										<div v-if="expandedItems.includes(item.id)" :class="$style.userItemSub">
											<div>Assigned: <MkTime :time="item.createdAt" mode="detail"/></div>
											<div v-if="item.expiresAt">Period: {{ new Date(item.expiresAt).toLocaleString() }}</div>
											<div v-else>Period: {{ i18n.ts.indefinitely }}</div>
										</div>
									</div>
								</div>
							</template>
						</MkPagination>
					</div>
				</MkFolder>
				<MkInfo v-else>{{ i18n.ts._role.isConditionalRole }}</MkInfo>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, reactive } from 'vue';
import XHeader from './_header_.vue';
import XEditor from './roles.editor.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { useRouter } from '@/router';
import MkButton from '@/components/MkButton.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import { infoImageUrl } from '@/instance';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

const usersPagination = {
	endpoint: 'admin/roles/users' as const,
	limit: 20,
	params: computed(() => ({
		roleId: props.id,
	})),
};

let expandedItems = $ref([]);

const role = reactive(await os.api('admin/roles/show', {
	roleId: props.id,
}));

function edit() {
	router.push('/admin/roles/' + role.id + '/edit');
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('deleteAreYouSure', { x: role.name }),
	});
	if (canceled) return;

	await os.apiWithDialog('admin/roles/delete', {
		roleId: role.id,
	});

	router.push('/admin/roles');
}

async function assign() {
	const user = await os.selectUser({
		includeSelf: true,
	});

	const { canceled: canceled2, result: period } = await os.select({
		title: i18n.ts.period,
		items: [{
			value: 'indefinitely', text: i18n.ts.indefinitely,
		}, {
			value: 'oneHour', text: i18n.ts.oneHour,
		}, {
			value: 'oneDay', text: i18n.ts.oneDay,
		}, {
			value: 'oneWeek', text: i18n.ts.oneWeek,
		}, {
			value: 'oneMonth', text: i18n.ts.oneMonth,
		}],
		default: 'indefinitely',
	});
	if (canceled2) return;

	const expiresAt = period === 'indefinitely' ? null
		: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
		: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
		: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
		: period === 'oneMonth' ? Date.now() + (1000 * 60 * 60 * 24 * 30)
		: null;

	await os.apiWithDialog('admin/roles/assign', { roleId: role.id, userId: user.id, expiresAt });
	//role.users.push(user);
}

async function unassign(user, ev) {
	os.popupMenu([{
		text: i18n.ts.unassign,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			await os.apiWithDialog('admin/roles/unassign', { roleId: role.id, userId: user.id });
			//role.users = role.users.filter(u => u.id !== user.id);
		},
	}], ev.currentTarget ?? ev.target);
}

async function toggleItem(item) {
	if (expandedItems.includes(item.id)) {
		expandedItems = expandedItems.filter(x => x !== item.id);
	} else {
		expandedItems.push(item.id);
	}
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.role + ': ' + role.name,
	icon: 'ti ti-badge',
})));
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
.unassign {
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
