<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:withOkButton="true"
	:okButtonDisabled="selected == null"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.selectUser }}</template>
	<div>
		<div :class="$style.form">
			<MkInput v-if="localOnly" v-model="username" :autofocus="true" @update:modelValue="search">
				<template #label>{{ i18n.ts.username }}</template>
				<template #prefix>@</template>
			</MkInput>
			<FormSplit v-else :minWidth="170">
				<MkInput v-model="username" :autofocus="true" @update:modelValue="search">
					<template #label>{{ i18n.ts.username }}</template>
					<template #prefix>@</template>
				</MkInput>
				<MkInput v-model="host" :datalist="[hostname]" @update:modelValue="search">
					<template #label>{{ i18n.ts.host }}</template>
					<template #prefix>@</template>
				</MkInput>
			</FormSplit>
		</div>
		<div v-if="username != '' || host != ''" :class="[$style.result, { [$style.hit]: users.length > 0 }]">
			<div v-if="users.length > 0" :class="$style.users">
				<div v-for="user in users" :key="user.id" class="_button" :class="[$style.user, { [$style.selected]: selected && selected.id === user.id }]" @click="selected = user" @dblclick="ok()">
					<MkAvatar :user="user" :class="$style.avatar" indicator/>
					<div :class="$style.userBody">
						<MkUserName :user="user" :class="$style.userName"/>
						<MkAcct :user="user" :class="$style.userAcct"/>
					</div>
				</div>
			</div>
			<div v-else :class="$style.empty">
				<span>{{ i18n.ts.noUsers }}</span>
			</div>
		</div>
		<div v-if="username == '' && host == ''" :class="$style.recent">
			<div :class="$style.users">
				<div v-for="user in recentUsers" :key="user.id" class="_button" :class="[$style.user, { [$style.selected]: selected && selected.id === user.id }]" @click="selected = user" @dblclick="ok()">
					<MkAvatar :user="user" :class="$style.avatar" indicator/>
					<div :class="$style.userBody">
						<MkUserName :user="user" :class="$style.userName"/>
						<MkAcct :user="user" :class="$style.userAcct"/>
					</div>
				</div>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkInput from '@/components/MkInput.vue';
import FormSplit from '@/components/form/split.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import { host as currentHost, hostname } from '@@/js/config.js';

const emit = defineEmits<{
	(ev: 'ok', selected: Misskey.entities.UserDetailed): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const props = withDefaults(defineProps<{
	includeSelf?: boolean;
	localOnly?: boolean;
}>(), {
	includeSelf: false,
	localOnly: false,
});

const username = ref('');
const host = ref('');
const users = ref<Misskey.entities.UserLite[]>([]);
const recentUsers = ref<Misskey.entities.UserDetailed[]>([]);
const selected = ref<Misskey.entities.UserLite | null>(null);
const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function search() {
	if (username.value === '' && host.value === '') {
		users.value = [];
		return;
	}
	misskeyApi('users/search-by-username-and-host', {
		username: username.value,
		host: props.localOnly ? '.' : host.value,
		limit: 10,
		detail: false,
	}).then(_users => {
		users.value = _users.filter((u) => {
			if (props.includeSelf) {
				return true;
			} else {
				return u.id !== $i?.id;
			}
		});
	});
}

async function ok() {
	if (selected.value == null) return;

	const user = await misskeyApi('users/show', {
		userId: selected.value.id,
	});
	emit('ok', user);

	dialogEl.value?.close();

	// 最近使ったユーザー更新
	let recents = defaultStore.state.recentlyUsedUsers;
	recents = recents.filter(x => x !== selected.value?.id);
	recents.unshift(selected.value.id);
	defaultStore.set('recentlyUsedUsers', recents.splice(0, 16));
}

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

onMounted(() => {
	misskeyApi('users/show', {
		userIds: defaultStore.state.recentlyUsedUsers,
	}).then(foundUsers => {
		let _users = foundUsers;
		_users = _users.filter((u) => {
			if (props.localOnly) {
				return u.host == null;
			} else {
				return true;
			}
		});
		_users = _users.filter((u) => {
			if (props.includeSelf) {
				return true;
			} else {
				return u.id !== $i?.id;
			}
		});
		recentUsers.value = _users;
	});
});
</script>

<style lang="scss" module>

.form {
	padding: calc(var(--root-margin) / 2) var(--root-margin);
}

.result,
.recent {
	display: flex;
	flex-direction: column;
	overflow: auto;
	height: 100%;

	&.result.hit {
		padding: 0;
	}

	&.recent {
		padding: 0;
	}
}

.users {
	flex: 1;
	overflow: auto;
	padding: 8px 0;
}

.user {
	display: flex;
	align-items: center;
	padding: 8px var(--root-margin);
	font-size: 14px;

	&:hover {
		background: var(--MI_THEME-X7);
	}

	&.selected {
		background: var(--MI_THEME-accent);
		color: #fff;
	}
}

.userBody {
	padding: 0 8px;
	min-width: 0;
}

.avatar {
	width: 45px;
	height: 45px;
}

.userName {
	display: block;
	font-weight: bold;
}

.userAcct {
	opacity: 0.5;
}

.empty {
	opacity: 0.7;
	text-align: center;
	padding: 16px;
}
</style>
