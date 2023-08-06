<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
// @ts-nocheck
import { defineAsyncComponent, ref } from 'vue';
import type * as Misskey from 'misskey-js';
import FormSuspense from '@/components/form/suspense.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { getAccounts, addAccount as addAccounts, removeAccount as _removeAccount, login, $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkUserCardMini from '@/components/MkUserCardMini.vue';

const storedAccounts = ref<any>(null);
const accounts = ref<Misskey.entities.UserDetailed[]>([]);

const init = async () => {
	getAccounts().then(accounts => {
		storedAccounts.value = accounts.filter(x => x.id !== $i!.id);

		return os.api('users/show', {
			userIds: storedAccounts.value.map(x => x.id),
		});
	}).then(response => {
		accounts.value = response;
	});
};

function menu(account, ev) {
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

function addAccount(ev) {
	os.popupMenu([{
		text: i18n.ts.existingAccount,
		action: () => { addExistingAccount(); },
	}, {
		text: i18n.ts.createAccount,
		action: () => { createAccount(); },
	}], ev.currentTarget ?? ev.target);
}

async function removeAccount(account) {
	await _removeAccount(account.id);
	accounts.value = accounts.value.filter(x => x.id !== account.id);
}

function addExistingAccount() {
	os.popup(defineAsyncComponent(() => import('@/components/MkSigninDialog.vue')), {}, {
		done: async res => {
			await addAccounts(res.id, res.i);
			os.success();
			init();
		},
	}, 'closed');
}

function createAccount() {
	os.popup(defineAsyncComponent(() => import('@/components/MkSignupDialog.vue')), {}, {
		done: async res => {
			await addAccounts(res.id, res.i);
			switchAccountWithToken(res.i);
		},
	}, 'closed');
}

async function switchAccount(account: any) {
	const fetchedAccounts: any[] = await getAccounts();
	const token = fetchedAccounts.find(x => x.id === account.id).token;
	switchAccountWithToken(token);
}

function switchAccountWithToken(token: string) {
	login(token);
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.accounts,
	icon: 'ti ti-users',
});
</script>

<style lang="scss" module>
.user {
    cursor: pointer;
}
</style>
