<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="">
	<FormSuspense :p="init">
		<div class="_gaps">
			<div class="_buttons">
				<MkButton primary @click="addAccount"><i class="ti ti-plus"></i> {{ i18n.ts.addAccount }}</MkButton>
				<MkButton @click="init"><i class="ti ti-refresh"></i> {{ i18n.ts.reloadAccountsList }}</MkButton>
			</div>

			<template v-for="[id, user] in accounts">
				<MkUserCardMini v-if="user != null" :key="user.id" :user="user" :class="$style.user" @click.prevent="menu(user, $event)"/>
				<button v-else v-panel class="_button" :class="$style.unknownUser" @click="menu(id, $event)">
					<div :class="$style.unknownUserAvatarMock"><i class="ti ti-user-question"></i></div>
					<div>
						<div :class="$style.unknownUserTitle">{{ i18n.ts.unknown }}</div>
						<div :class="$style.unknownUserSub">ID: <span class="_monospace">{{ id }}</span></div>
					</div>
				</button>
			</template>
		</div>
	</FormSuspense>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import FormSuspense from '@/components/form/suspense.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { getAccounts, removeAccount as _removeAccount, login, $i, getAccountWithSigninDialog, getAccountWithSignupDialog } from '@/account.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import type { MenuItem } from '@/types/menu.js';

const storedAccounts = ref<{ id: string, token: string }[] | null>(null);
const accounts = ref(new Map<string, Misskey.entities.UserDetailed | null>());

const init = async () => {
	getAccounts().then(accounts => {
		storedAccounts.value = accounts.filter(x => x.id !== $i!.id);

		return misskeyApi('users/show', {
			userIds: storedAccounts.value.map(x => x.id),
		});
	}).then(response => {
		if (storedAccounts.value == null) return;
		accounts.value = new Map(storedAccounts.value.map(x => [x.id, response.find((y: Misskey.entities.UserDetailed) => y.id === x.id) ?? null]));
	});
};

function menu(account: Misskey.entities.UserDetailed | string, ev: MouseEvent) {
	let menu: MenuItem[];

	if (typeof account === 'string') {
		menu = [{
			text: i18n.ts.logout,
			icon: 'ti ti-trash',
			danger: true,
			action: () => removeAccount(account),
		}];
	} else {
		menu = [{
			text: i18n.ts.switch,
			icon: 'ti ti-switch-horizontal',
			action: () => switchAccount(account.id),
		}, {
			text: i18n.ts.logout,
			icon: 'ti ti-trash',
			danger: true,
			action: () => removeAccount(account.id),
		}];
	}

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function addAccount(ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts.existingAccount,
		action: () => { addExistingAccount(); },
	}, {
		text: i18n.ts.createAccount,
		action: () => { createAccount(); },
	}], ev.currentTarget ?? ev.target);
}

async function removeAccount(id: string) {
	await _removeAccount(id);
	accounts.value.delete(id);
}

function addExistingAccount() {
	getAccountWithSigninDialog().then((res) => {
		if (res != null) {
			os.success();
			init();
		}
	});
}

function createAccount() {
	getAccountWithSignupDialog().then((res) => {
		if (res != null) {
			switchAccountWithToken(res.token);
		}
	});
}

async function switchAccount(id: string) {
	const fetchedAccounts = await getAccounts();
	const token = fetchedAccounts.find(x => x.id === id)!.token;
	switchAccountWithToken(token);
}

function switchAccountWithToken(token: string) {
	login(token);
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.accounts,
	icon: 'ti ti-users',
}));
</script>

<style lang="scss" module>
.user {
	cursor: pointer;
}

.unknownUser {
	display: flex;
	align-items: center;
	text-align: start;
	padding: 16px;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	font-size: 0.9em;
}

.unknownUserAvatarMock {
	display: block;
	width: 34px;
	height: 34px;
	line-height: 34px;
	text-align: center;
	font-size: 16px;
	margin-right: 12px;
	background-color: color-mix(in srgb, var(--MI_THEME-fg), transparent 85%);
	color: color-mix(in srgb, var(--MI_THEME-fg), transparent 25%);
	border-radius: 50%;
}

.unknownUserTitle {
	display: block;
	width: 100%;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 18px;
}

.unknownUserSub {
	display: block;
	width: 100%;
	font-size: 95%;
	opacity: 0.7;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 16px;
}
</style>
