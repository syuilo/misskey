<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="600" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init">
			<div v-if="tab === 'overview'" class="_gaps_m">
				<div class="aeakzknw">
					<MkAvatar class="avatar" :user="user" indicator link preview/>
					<div class="body">
						<span class="name"><MkUserName class="name" :user="user"/></span>
						<span class="sub"><span class="acct _monospace">@{{ acct(user) }}</span></span>
						<span class="state">
							<span v-if="suspended" class="suspended">Suspended</span>
							<span v-if="silenced" class="silenced">Silenced</span>
							<span v-if="moderator" class="moderator">Moderator</span>
						</span>
					</div>
				</div>

				<MkInfo v-if="user.username.includes('.')">{{ i18n.ts.isSystemAccount }}</MkInfo>

				<div v-if="user.url" class="_formLinksGrid">
					<FormLink :to="userPage(user)">Profile</FormLink>
					<FormLink :to="user.url" :external="true">Profile (remote)</FormLink>
				</div>
				<FormLink v-else :to="userPage(user)">Profile</FormLink>

				<FormLink v-if="user.host" :to="`/instance-info/${user.host}`">{{ i18n.ts.instanceInfo }}</FormLink>

				<div style="display: flex; flex-direction: column; gap: 1em;">
					<MkKeyValue :copy="user.id" oneline>
						<template #key>ID</template>
						<template #value><span class="_monospace">{{ user.id }}</span></template>
					</MkKeyValue>
					<!-- 要る？
					<MkKeyValue v-if="ips.length > 0" :copy="user.id" oneline>
						<template #key>IP (recent)</template>
						<template #value><span class="_monospace">{{ ips[0].ip }}</span></template>
					</MkKeyValue>
					-->
					<MkKeyValue oneline>
						<template #key>{{ i18n.ts.createdAt }}</template>
						<template #value><span class="_monospace"><MkTime :time="user.createdAt" :mode="'detail'"/></span></template>
					</MkKeyValue>
					<MkKeyValue v-if="info" oneline>
						<template #key>{{ i18n.ts.lastActiveDate }}</template>
						<template #value><span class="_monospace"><MkTime :time="info.lastActiveDate" :mode="'detail'"/></span></template>
					</MkKeyValue>
					<MkKeyValue v-if="info" oneline>
						<template #key>{{ i18n.ts.email }}</template>
						<template #value><span class="_monospace">{{ info.email }}</span></template>
					</MkKeyValue>
				</div>

				<FormSection>
					<template #label>ActivityPub</template>

					<div class="_gaps_m">
						<div style="display: flex; flex-direction: column; gap: 1em;">
							<MkKeyValue v-if="user.host" oneline>
								<template #key>{{ i18n.ts.instanceInfo }}</template>
								<template #value><MkA :to="`/instance-info/${user.host}`" class="_link">{{ user.host }} <i class="ti ti-chevron-right"></i></MkA></template>
							</MkKeyValue>
							<MkKeyValue v-else oneline>
								<template #key>{{ i18n.ts.instanceInfo }}</template>
								<template #value>(Local user)</template>
							</MkKeyValue>
							<MkKeyValue oneline>
								<template #key>{{ i18n.ts.updatedAt }}</template>
								<template #value><MkTime v-if="user.lastFetchedAt" mode="detail" :time="user.lastFetchedAt"/><span v-else>N/A</span></template>
							</MkKeyValue>
							<MkKeyValue v-if="ap" oneline>
								<template #key>Type</template>
								<template #value><span class="_monospace">{{ ap.type }}</span></template>
							</MkKeyValue>
						</div>

						<MkButton v-if="user.host != null" @click="updateRemoteUser"><i class="ti ti-refresh"></i> {{ i18n.ts.updateRemoteUser }}</MkButton>

						<MkFolder>
							<template #label>Raw</template>

							<MkObjectView v-if="ap" tall :value="ap">
							</MkObjectView>
						</MkFolder>
					</div>
				</FormSection>
			</div>

			<div v-else-if="tab === 'moderation'" class="_gaps_m">
				<MkSwitch v-model="suspended" @update:modelValue="toggleSuspend">{{ i18n.ts.suspend }}</MkSwitch>

				<div>
					<MkButton v-if="user.host == null && iAmModerator" inline style="margin-right: 8px;" @click="resetPassword"><i class="ti ti-key"></i> {{ i18n.ts.resetPassword }}</MkButton>
					<MkButton v-if="$i.isAdmin" inline danger @click="deleteAccount">{{ i18n.ts.deleteAccount }}</MkButton>
				</div>

				<MkFolder>
					<template #icon><i class="ti ti-license"></i></template>
					<template #label>{{ i18n.ts._role.policies }}</template>
					<div class="_gaps">
						<div v-for="policy in Object.keys(info.policies)" :key="policy">
							{{ policy }} ... {{ info.policies[policy] }}
						</div>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-badges"></i></template>
					<template #label>{{ i18n.ts.roles }}</template>
					<div class="_gaps">
						<MkButton v-if="user.host == null && iAmModerator" primary rounded @click="assignRole"><i class="ti ti-plus"></i> {{ i18n.ts.assign }}</MkButton>

						<div v-for="role in info.roles" :key="role.id" :class="$style.roleItem">
							<div :class="$style.roleItemMain">
								<MkRolePreview :class="$style.role" :role="role" :forModeration="true"/>
								<button class="_button" :class="$style.roleToggle" @click="toggleRoleItem(role)"><i class="ti ti-chevron-down"></i></button>
								<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnassign" @click="unassignRole(role, $event)"><i class="ti ti-x"></i></button>
								<button v-else class="_button" :class="$style.roleUnassign" disabled><i class="ti ti-ban"></i></button>
							</div>
							<div v-if="expandedRoles.includes(role.id)" :class="$style.roleItemSub">
								<div>Assigned: <MkTime :time="info.roleAssigns.find(a => a.roleId === role.id).createdAt" mode="detail"/></div>
								<div v-if="info.roleAssigns.find(a => a.roleId === role.id).expiresAt">Period: {{ new Date(info.roleAssigns.find(a => a.roleId === role.id).expiresAt).toLocaleString() }}</div>
								<div v-else>Period: {{ i18n.ts.indefinitely }}</div>
							</div>
						</div>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-password"></i></template>
					<template #label>IP</template>
					<MkInfo v-if="!iAmAdmin" warn>{{ i18n.ts.requireAdminForView }}</MkInfo>
					<MkInfo v-else>The date is the IP address was first acknowledged.</MkInfo>
					<template v-if="iAmAdmin && ips">
						<div v-for="record in ips" :key="record.ip" class="_monospace" :class="$style.ip" style="margin: 1em 0;">
							<span class="date">{{ record.createdAt }}</span>
							<span class="ip">{{ record.ip }}</span>
						</div>
					</template>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-cloud"></i></template>
					<template #label>{{ i18n.ts.files }}</template>
					<MkFileListForAdmin :pagination="filesPagination" viewMode="grid"/>
				</MkFolder>

				<MkTextarea v-model="moderationNote" manualSave>
					<template #label>Moderation note</template>
				</MkTextarea>
			</div>

			<div v-else-if="tab === 'chart'" class="_gaps_m">
				<div class="cmhjzshm">
					<div class="selects">
						<MkSelect v-model="chartSrc" style="margin: 0 10px 0 0; flex: 1;">
							<option value="per-user-notes">{{ i18n.ts.notes }}</option>
						</MkSelect>
					</div>
					<div class="charts">
						<div class="label">{{ i18n.t('recentNHours', { n: 90 }) }}</div>
						<MkChart class="chart" :src="chartSrc" span="hour" :limit="90" :args="{ user, withoutAll: true }" :detailed="true"></MkChart>
						<div class="label">{{ i18n.t('recentNDays', { n: 90 }) }}</div>
						<MkChart class="chart" :src="chartSrc" span="day" :limit="90" :args="{ user, withoutAll: true }" :detailed="true"></MkChart>
					</div>
				</div>
			</div>

			<div v-else-if="tab === 'raw'" class="_gaps_m">
				<MkObjectView v-if="info && $i.isAdmin" tall :value="info">
				</MkObjectView>

				<MkObjectView tall :value="user">
				</MkObjectView>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, watch } from 'vue';
import * as misskey from 'misskey-js';
import MkChart from '@/components/MkChart.vue';
import MkObjectView from '@/components/MkObjectView.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkFileListForAdmin from '@/components/MkFileListForAdmin.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { url } from '@/config';
import { userPage, acct } from '@/filters/user';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { iAmAdmin, iAmModerator, $i } from '@/account';
import MkRolePreview from '@/components/MkRolePreview.vue';

const props = withDefaults(defineProps<{
	userId: string;
	initialTab?: string;
}>(), {
	initialTab: 'overview',
});

let tab = $ref(props.initialTab);
let chartSrc = $ref('per-user-notes');
let user = $ref<null | misskey.entities.UserDetailed>();
let init = $ref<ReturnType<typeof createFetcher>>();
let info = $ref();
let ips = $ref(null);
let ap = $ref(null);
let moderator = $ref(false);
let silenced = $ref(false);
let suspended = $ref(false);
let moderationNote = $ref('');
const filesPagination = {
	endpoint: 'admin/drive/files' as const,
	limit: 10,
	params: computed(() => ({
		userId: props.userId,
	})),
};
let expandedRoles = $ref([]);

function createFetcher() {
	if (iAmModerator) {
		return () => Promise.all([os.api('users/show', {
			userId: props.userId,
		}), os.api('admin/show-user', {
			userId: props.userId,
		}), iAmAdmin ? os.api('admin/get-user-ips', {
			userId: props.userId,
		}) : Promise.resolve(null)]).then(([_user, _info, _ips]) => {
			user = _user;
			info = _info;
			ips = _ips;
			moderator = info.isModerator;
			silenced = info.isSilenced;
			suspended = info.isSuspended;
			moderationNote = info.moderationNote;

			watch($$(moderationNote), async () => {
				await os.api('admin/update-user-note', { userId: user.id, text: moderationNote });
				await refreshUser();
			});
		});
	} else {
		return () => os.api('users/show', {
			userId: props.userId,
		}).then((res) => {
			user = res;
		});
	}
}

function refreshUser() {
	init = createFetcher();
}

async function updateRemoteUser() {
	await os.apiWithDialog('federation/update-remote-user', { userId: user.id });
	refreshUser();
}

async function resetPassword() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.resetPasswordConfirm,
	});
	if (confirm.canceled) {
		return;
	} else {
		const { password } = await os.api('admin/reset-password', {
			userId: user.id,
		});
		os.alert({
			type: 'success',
			text: i18n.t('newPasswordIs', { password }),
		});
	}
}

async function toggleSuspend(v) {
	const confirm = await os.confirm({
		type: 'warning',
		text: v ? i18n.ts.suspendConfirm : i18n.ts.unsuspendConfirm,
	});
	if (confirm.canceled) {
		suspended = !v;
	} else {
		await os.api(v ? 'admin/suspend-user' : 'admin/unsuspend-user', { userId: user.id });
		await refreshUser();
	}
}

async function deleteAllFiles() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteAllFilesConfirm,
	});
	if (confirm.canceled) return;
	const process = async () => {
		await os.api('admin/delete-all-files-of-a-user', { userId: user.id });
		os.success();
	};
	await process().catch(err => {
		os.alert({
			type: 'error',
			text: err.toString(),
		});
	});
	await refreshUser();
}

async function deleteAccount() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteAccountConfirm,
	});
	if (confirm.canceled) return;

	const typed = await os.inputText({
		text: i18n.t('typeToConfirm', { x: user?.username }),
	});
	if (typed.canceled) return;

	if (typed.result === user?.username) {
		await os.apiWithDialog('admin/delete-account', {
			userId: user.id,
		});
	} else {
		os.alert({
			type: 'error',
			text: 'input not match',
		});
	}
}

async function assignRole() {
	const roles = await os.api('admin/roles/list');

	const { canceled, result: roleId } = await os.select({
		title: i18n.ts._role.chooseRoleToAssign,
		items: roles.map(r => ({ text: r.name, value: r.id })),
	});
	if (canceled) return;

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

	await os.apiWithDialog('admin/roles/assign', { roleId, userId: user.id, expiresAt });
	refreshUser();
}

async function unassignRole(role, ev) {
	os.popupMenu([{
		text: i18n.ts.unassign,
		icon: 'ti ti-x',
		danger: true,
		action: async () => {
			await os.apiWithDialog('admin/roles/unassign', { roleId: role.id, userId: user.id });
			refreshUser();
		},
	}], ev.currentTarget ?? ev.target);
}

function toggleRoleItem(role) {
	if (expandedRoles.includes(role.id)) {
		expandedRoles = expandedRoles.filter(x => x !== role.id);
	} else {
		expandedRoles.push(role.id);
	}
}

watch(() => props.userId, () => {
	init = createFetcher();
}, {
	immediate: true,
});

watch($$(user), () => {
	os.api('ap/get', {
		uri: user.uri ?? `${url}/users/${user.id}`,
	}).then(res => {
		ap = res;
	});
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, iAmModerator ? {
	key: 'moderation',
	title: i18n.ts.moderation,
	icon: 'ti ti-user-exclamation',
} : null, {
	key: 'chart',
	title: i18n.ts.charts,
	icon: 'ti ti-chart-line',
}, {
	key: 'raw',
	title: 'Raw',
	icon: 'ti ti-code',
}].filter(x => x != null));

definePageMetadata(computed(() => ({
	title: user ? acct(user) : i18n.ts.userInfo,
	icon: 'ti ti-info-circle',
})));
</script>

<style lang="scss" scoped>
.aeakzknw {
	display: flex;
	align-items: center;

	> .avatar {
		display: block;
		width: 64px;
		height: 64px;
		margin-right: 16px;
	}

	> .body {
		flex: 1;
		overflow: hidden;

		> .name {
			display: block;
			width: 100%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> .sub {
			display: block;
			width: 100%;
			font-size: 85%;
			opacity: 0.7;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		> .state {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
			margin-top: 4px;

			&:empty {
				display: none;
			}

			> .suspended, > .silenced, > .moderator {
				display: inline-block;
				border: solid 1px;
				border-radius: 6px;
				padding: 2px 6px;
				font-size: 85%;
			}

			> .suspended {
				color: var(--error);
				border-color: var(--error);
			}

			> .silenced {
				color: var(--warn);
				border-color: var(--warn);
			}

			> .moderator {
				color: var(--success);
				border-color: var(--success);
			}
		}
	}
}

.cmhjzshm {
	> .selects {
		display: flex;
		margin: 0 0 16px 0;
	}

	> .charts {
		> .label {
			margin-bottom: 12px;
			font-weight: bold;
		}
	}
}
</style>

<style lang="scss" module>
.ip {
	display: flex;

	> :global(.date) {
		opacity: 0.7;
	}

	> :global(.ip) {
		margin-left: auto;
	}
}

.roleItem {
}

.roleItemMain {
	display: flex;
}

.role {
	flex: 1;
	min-width: 0;
	margin-right: 8px;
}

.roleItemSub {
	padding: 6px 12px;
	font-size: 85%;
	color: var(--fgTransparentWeak);
}

.roleUnassign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
}
</style>
