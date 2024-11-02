<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.wrapper">
	<Transition
		mode="out-in"
		:enterActiveClass="$style.transition_enterActive"
		:leaveActiveClass="$style.transition_leaveActive"
		:enterFromClass="$style.transition_enterFrom"
		:leaveToClass="$style.transition_leaveTo"

		:inert="_waiting"
	>
		<div v-if="phase === 'accountSelect'" key="accountSelect" :class="$style.root" class="_gaps">
			<div :class="$style.header" class="_gaps_s">
				<div :class="$style.iconFallback">
					<i class="ti ti-user"></i>
				</div>
				<div :class="$style.headerText">{{ i18n.ts.pleaseSelectAccount }}</div>
			</div>
			<div>
				<div :class="$style.accountSelectorLabel">{{ i18n.ts.selectAccount }}</div>
				<div :class="$style.accountSelectorList">
					<template v-for="[id, user] in users">
						<input :id="'account-' + id" v-model="selectedUser" type="radio" name="accountSelector" :value="id" :class="$style.accountSelectorRadio"/>
						<label :for="'account-' + id" :class="$style.accountSelectorItem">
							<MkAvatar :user="user" :class="$style.accountSelectorAvatar"/>
							<div :class="$style.accountSelectorBody">
								<MkUserName :user="user" :class="$style.accountSelectorName"/>
								<MkAcct :user="user" :class="$style.accountSelectorAcct"/>
							</div>
						</label>
					</template>
					<button class="_button" :class="[$style.accountSelectorItem, $style.accountSelectorAddAccountRoot]" @click="clickAddAccount">
						<div :class="[$style.accountSelectorAvatar, $style.accountSelectorAddAccountAvatar]">
							<i class="ti ti-user-plus"></i>
						</div>
						<div :class="[$style.accountSelectorBody, $style.accountSelectorName]">{{ i18n.ts.addAccount }}</div>
					</button>
				</div>
			</div>
			<div class="_buttonsCenter">
				<MkButton rounded gradate :disabled="selectedUser === null" @click="clickChooseAccount">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
			</div>
		</div>
		<div v-else-if="phase === 'consent'" key="consent" :class="$style.root" class="_gaps">
			<div :class="$style.header" class="_gaps_s">
				<img v-if="icon" :class="$style.icon" :src="getProxiedImageUrl(icon, 'preview')"/>
				<div v-else :class="$style.iconFallback">
					<i class="ti ti-apps"></i>
				</div>
				<div :class="$style.headerText">{{ name ? i18n.tsx._auth.shareAccess({ name }) : i18n.ts._auth.shareAccessAsk }}</div>
			</div>
			<div v-if="permissions && permissions.length > 0" class="_gaps_s" :class="$style.permissionRoot">
				<div>{{ name ? i18n.tsx._auth.permission({ name }) : i18n.ts._auth.permissionAsk }}</div>
				<div :class="$style.permissionListWrapper">
					<ul :class="$style.permissionList">
						<li v-for="p in permissions" :key="p">{{ i18n.ts._permissions[p] }}</li>
					</ul>
				</div>
			</div>
			<slot name="consentAdditionalInfo"></slot>
			<div>
				<div :class="$style.accountSelectorLabel">
					{{ i18n.ts._auth.scopeUser }} <button class="_textButton" @click="clickBackToAccountSelect">{{ i18n.ts.switchAccount }}</button>
				</div>
				<div :class="$style.accountSelectorList">
					<div :class="[$style.accountSelectorItem, $style.static]">
						<MkAvatar :user="users.get(selectedUser!)!" :class="$style.accountSelectorAvatar"/>
						<div :class="$style.accountSelectorBody">
							<MkUserName :user="users.get(selectedUser!)!" :class="$style.accountSelectorName"/>
							<MkAcct :user="users.get(selectedUser!)!" :class="$style.accountSelectorAcct"/>
						</div>
					</div>
				</div>
			</div>
			<div class="_buttonsCenter">
				<MkButton rounded @click="clickCancel">{{ i18n.ts.reject }}</MkButton>
				<MkButton rounded gradate @click="clickAccept">{{ i18n.ts.accept }}</MkButton>
			</div>
		</div>
		<div v-else-if="phase === 'success'" key="success" :class="$style.root" class="_gaps_s">
			<div :class="$style.header" class="_gaps_s">
				<div :class="$style.iconFallback">
					<i class="ti ti-check"></i>
				</div>
				<div :class="$style.headerText">{{ i18n.ts._auth.accepted }}</div>
				<div :class="$style.headerTextSub">{{ i18n.ts._auth.pleaseGoBack }}</div>
			</div>
		</div>
		<div v-else-if="phase === 'denied'" key="denied" :class="$style.root" class="_gaps_s">
			<div :class="$style.header" class="_gaps_s">
				<div :class="$style.iconFallback">
					<i class="ti ti-x"></i>
				</div>
				<div :class="$style.headerText">{{ i18n.ts._auth.denied }}</div>
			</div>
		</div>
		<div v-else-if="phase === 'failed'" key="failed" :class="$style.root" class="_gaps_s">
			<div :class="$style.header" class="_gaps_s">
				<div :class="$style.iconFallback">
					<i class="ti ti-x"></i>
				</div>
				<div :class="$style.headerText">{{ i18n.ts.somethingHappened }}</div>
			</div>
		</div>
	</Transition>
	<div v-if="_waiting" :class="$style.waitingRoot">
		<MkLoading/>
	</div>
</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';

import MkButton from '@/components/MkButton.vue';

import { $i, getAccounts, getAccountWithSigninDialog, getAccountWithSignupDialog } from '@/account.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { getProxiedImageUrl } from '@/scripts/media-proxy.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const props = defineProps<{
	name?: string;
	icon?: string;
	permissions?: (typeof Misskey.permissions[number])[];
	manualWaiting?: boolean;
	waitOnDeny?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'accept', token: string): void;
	(ev: 'deny', token: string): void;
}>();

const waiting = ref(true);
const _waiting = computed(() => waiting.value || props.manualWaiting);
const phase = ref<'accountSelect' | 'consent' | 'success' | 'denied' | 'failed'>('accountSelect');

const selectedUser = ref<string | null>(null);

const users = ref(new Map<string, Misskey.entities.UserDetailed & { token: string; }>());

async function init() {
	waiting.value = true;

	users.value.clear();

	if ($i) {
		users.value.set($i.id, $i);
	}

	const accounts = await getAccounts();

	const accountIdsToFetch = accounts.map(a => a.id).filter(id => !users.value.has(id));

	if (accountIdsToFetch.length > 0) {
		const usersRes = await misskeyApi('users/show', {
			userIds: accountIdsToFetch,
		});

		for (const user of usersRes) {
			if (users.value.has(user.id)) continue;

			users.value.set(user.id, {
				...user,
				token: accounts.find(a => a.id === user.id)!.token,
			});
		}
	}

	waiting.value = false;
}

init();

function clickAddAccount(ev: MouseEvent) {
	selectedUser.value = null;

	os.popupMenu([{
		text: i18n.ts.existingAccount,
		action: () => {
			getAccountWithSigninDialog().then(async (res) => {
				if (res != null) {
					os.success();
					await init();
					if (users.value.has(res.id)) {
						selectedUser.value = res.id;
					}
				}
			});
		},
	}, {
		text: i18n.ts.createAccount,
		action: () => {
			getAccountWithSignupDialog().then(async (res) => {
				if (res != null) {
					os.success();
					await init();
					if (users.value.has(res.id)) {
						selectedUser.value = res.id;
					}
				}
			});
		},
	}], ev.currentTarget ?? ev.target);
}

function clickChooseAccount() {
	if (selectedUser.value === null) return;

	phase.value = 'consent';
}

function clickBackToAccountSelect() {
	selectedUser.value = null;
	phase.value = 'accountSelect';
}

function clickCancel() {
	if (selectedUser.value === null) return;

	const user = users.value.get(selectedUser.value)!;

	const token = user.token;

	if (props.waitOnDeny) {
		waiting.value = true;
	}
	emit('deny', token);
}

async function clickAccept() {
	if (selectedUser.value === null) return;

	const user = users.value.get(selectedUser.value)!;

	const token = user.token;

	waiting.value = true;
	emit('accept', token);
}

function showUI(state: 'success' | 'denied' | 'failed') {
	phase.value = state;
	waiting.value = false;
}

defineExpose({
	showUI,
});
</script>

<style lang="scss" module>
.transition_enterActive,
.transition_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.wrapper {
	overflow-x: hidden;
	overflow-x: clip;

	position: relative;
	width: 100%;
	height: 100%;
}

.waitingRoot {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: color-mix(in srgb, var(--MI_THEME-panel), transparent 50%);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1;
	cursor: wait;
}

.root {
	position: relative;
	box-sizing: border-box;
	width: 100%;
	padding: 48px 24px;
}

.header {
	margin: 0 auto;
	max-width: 320px;
}

.icon,
.iconFallback {
	display: block;
	margin: 0 auto;
	width: 54px;
	height: 54px;
}

.icon {
	border-radius: 50%;
	border: 1px solid var(--MI_THEME-divider);
	background-color: #fff;
	object-fit: contain;
}

.iconFallback {
	border-radius: 50%;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	text-align: center;
	line-height: 54px;
	font-size: 18px;
}

.headerText,
.headerTextSub {
	text-align: center;
	word-break: normal;
	word-break: auto-phrase;
}

.headerText {
	font-size: 16px;
	font-weight: 700;
}

.permissionRoot {
	padding: 16px;
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-bg);
}

.permissionListWrapper {
	max-height: 350px;
	overflow-y: auto;
	padding: 12px;
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-panel);
}

.permissionList {
	margin: 0 0 0 1.5em;
	padding: 0;
	font-size: 90%;
}

.accountSelectorLabel {
	font-size: 0.85em;
	opacity: 0.7;
	margin-bottom: 8px;
}

.accountSelectorList {
	border-radius: var(--MI-radius);
	border: 1px solid var(--MI_THEME-divider);
	overflow: hidden;
	overflow: clip;
}

.accountSelectorRadio {
	position: absolute;
	clip: rect(0, 0, 0, 0);
	pointer-events: none;

	&:focus-visible + .accountSelectorItem {
		outline: 2px solid var(--MI_THEME-accent);
		outline-offset: -4px;
	}

	&:checked:focus-visible + .accountSelectorItem {
		outline-color: #fff;
	}

	&:checked + .accountSelectorItem {
		background: var(--MI_THEME-accent);
		color: #fff;
	}
}

.accountSelectorItem {
	display: flex;
	align-items: center;
	padding: 8px;
	font-size: 14px;
	-webkit-tap-highlight-color: transparent;
	cursor: pointer;

	&:hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.static {
		cursor: unset;

		&:hover {
			background: none;
		}
	}
}

.accountSelectorAddAccountRoot {
	width: 100%;
}

.accountSelectorBody {
	padding: 0 8px;
	min-width: 0;
}

.accountSelectorAvatar {
	width: 45px;
	height: 45px;
}

.accountSelectorAddAccountAvatar {
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 16px;
	line-height: 45px;
	text-align: center;
	border-radius: 50%;
}

.accountSelectorName {
	display: block;
	font-weight: bold;
}

.accountSelectorAcct {
	opacity: 0.5;
}
</style>
