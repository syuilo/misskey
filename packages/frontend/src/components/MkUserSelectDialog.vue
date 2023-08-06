<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
	@closed="$emit('closed')"
>
	<template #header>{{ i18n.ts.selectUser }}</template>
	<div>
		<div :class="$style.form">
			<FormSplit :minWidth="170">
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
// @ts-nocheck
import { onMounted } from 'vue';
import * as misskey from 'misskey-js';
import MkInput from '@/components/MkInput.vue';
import FormSplit from '@/components/form/split.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { hostname } from '@/config';

const emit = defineEmits<{
	(ev: 'ok', selected: misskey.entities.UserDetailed): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const props = defineProps<{
	includeSelf?: boolean;
}>();

let username = $ref('');
let host = $ref('');
let users: misskey.entities.UserDetailed[] = $ref([]);
let recentUsers: misskey.entities.UserDetailed[] = $ref([]);
let selected: misskey.entities.UserDetailed | null = $ref(null);
let dialogEl = $ref();

const search = () => {
	if (username === '' && host === '') {
		users = [];
		return;
	}
	os.api('users/search-by-username-and-host', {
		username: username,
		host: host,
		limit: 10,
		detail: false,
	}).then(_users => {
		users = _users;
	});
};

const ok = () => {
	if (selected == null) return;
	emit('ok', selected);
	dialogEl.close();

	// 最近使ったユーザー更新
	let recents = defaultStore.state.recentlyUsedUsers;
	recents = recents.filter(x => x !== selected.id);
	recents.unshift(selected.id);
	defaultStore.set('recentlyUsedUsers', recents.splice(0, 16));
};

const cancel = () => {
	emit('cancel');
	dialogEl.close();
};

onMounted(() => {
	os.api('users/show', {
		userIds: defaultStore.state.recentlyUsedUsers,
	}).then(users => {
		if (props.includeSelf && users.find(x => $i ? x.id === $i.id : true) == null) {
			recentUsers = [$i, ...users];
		} else {
			recentUsers = users;
		}
	});
});
</script>

<style lang="scss" module>

.form {
	padding: 0 var(--root-margin);
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
		background: var(--X7);
	}

	&.selected {
		background: var(--accent);
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
