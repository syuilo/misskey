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

			<MkUserCardMini v-for="user in accounts" :key="user.id" :user="user" :class="$style.user" @click.prevent="menu(user, $event)"/>
		</div>
	</FormSuspense>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import type * as Misskey from 'misskey-js';
import FormSuspense from '@/components/form/suspense.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { getAccounts, removeAccount as _removeAccount, login, $i, getAccountWithSigninDialog, getAccountWithSignupDialog } from '@/account.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';

const storedAccounts = ref<{ id: string, token: string }[] | null>(null);
const accounts = ref<Misskey.entities.UserDetailed[]>([]);

const init = async () => {
	getAccounts().then(accounts => {
		storedAccounts.value = accounts.filter(x => x.id !== $i!.id);

		return misskeyApi('users/show', {
			userIds: storedAccounts.value.map(x => x.id),
		});
	}).then(response => {
		accounts.value = response;
	});
};

function menu(account: Misskey.entities.UserDetailed, ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts.switch,
		icon: 'ti ti-switch-horizontal',
		action: () => switchAccount(account),
	}, {
		text: i18n.ts.logout,
		icon: 'ti ti-trash',
		danger: true,
		action: () => removeAccount(account),
	}], ev.currentTarget ?? ev.target);
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

async function removeAccount(account: Misskey.entities.UserDetailed) {
	await _removeAccount(account.id);
	accounts.value = accounts.value.filter(x => x.id !== account.id);
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

async function switchAccount(account: Misskey.entities.UserDetailed) {
	const fetchedAccounts = await getAccounts();
	const token = fetchedAccounts.find(x => x.id === account.id)!.token;
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
</style>
