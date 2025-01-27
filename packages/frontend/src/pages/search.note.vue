<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search" @enter.prevent="search">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkFoldableSection :expanded="true">
			<template #header>{{ i18n.ts.options }}</template>

			<div class="_gaps_m">
				<template v-if="instance.federation !== 'none'">
					<MkRadios v-model="hostSelect">
						<template #label>{{ i18n.ts.host }}</template>
						<option value="all" default>{{ i18n.ts.all }}</option>
						<option value="local">{{ i18n.ts.local }}</option>
						<option v-if="noteSearchableScope === 'global'" value="specified">{{ i18n.ts.specifyHost }}</option>
					</MkRadios>
					<MkInput v-if="noteSearchableScope === 'global'" v-model="hostInput" :disabled="hostSelect !== 'specified'" :large="true" type="search">
						<template #prefix><i class="ti ti-server"></i></template>
					</MkInput>
				</template>

				<MkFolder :defaultOpen="true">
					<template #label>{{ i18n.ts.specifyUser }}</template>
					<template v-if="user" #suffix>@{{ user.username }}{{ user.host ? `@${user.host}` : "" }}</template>

					<div class="_gaps">
						<div :class="$style.userItem">
							<MkUserCardMini v-if="user" :class="$style.userCard" :user="user" :withChart="false"/>
							<MkButton v-if="user == null && $i != null" transparent :class="$style.addMeButton" @click="selectSelf"><div :class="$style.addUserButtonInner"><span><i class="ti ti-plus"></i><i class="ti ti-user"></i></span><span>{{ i18n.ts.selectSelf }}</span></div></MkButton>
							<MkButton v-if="user == null" transparent :class="$style.addUserButton" @click="selectUser"><div :class="$style.addUserButtonInner"><i class="ti ti-plus"></i><span>{{ i18n.ts.selectUser }}</span></div></MkButton>
							<button class="_button" :class="$style.remove" :disabled="user == null" @click="removeUser"><i class="ti ti-x"></i></button>
						</div>
					</div>
				</MkFolder>
			</div>
		</MkFoldableSection>
		<div>
			<MkButton large primary gradate rounded style="margin: 0 auto;" @click="search">{{ i18n.ts.search }}</MkButton>
		</div>
	</div>

	<MkFoldableSection v-if="notePagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkNotes :key="key" :pagination="notePagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, toRef, watch } from 'vue';
import type { UserDetailed } from 'misskey-js/entities.js';
import type { Paging } from '@/components/MkPagination.vue';
import MkNotes from '@/components/MkNotes.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkFolder from '@/components/MkFolder.vue';
import { useRouter } from '@/router/supplier.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkRadios from '@/components/MkRadios.vue';
import { $i } from '@/account.js';
import { instance } from '@/instance.js';

const props = withDefaults(defineProps<{
	query?: string;
	userId?: string;
	username?: string;
	host?: string | null;
}>(), {
	query: '',
	userId: undefined,
	username: undefined,
	host: '',
});

const router = useRouter();
const key = ref(0);
const searchQuery = ref(toRef(props, 'query').value);
const notePagination = ref<Paging>();
const user = ref<UserDetailed | null>(null);
const hostInput = ref(toRef(props, 'host').value);

const noteSearchableScope = instance.noteSearchableScope ?? 'local';

const hostSelect = ref<'all' | 'local' | 'specified'>('all');

const setHostSelectWithInput = (after: string | undefined | null, before: string | undefined | null) => {
	if (before === after) return;
	if (after === '') hostSelect.value = 'all';
	else hostSelect.value = 'specified';
};

setHostSelectWithInput(hostInput.value, undefined);

watch(hostInput, setHostSelectWithInput);

const searchHost = computed(() => {
	if (hostSelect.value === 'local' || instance.federation === 'none') return '.';
	if (hostSelect.value === 'specified') return hostInput.value;
	return null;
});

if (props.userId != null) {
	misskeyApi('users/show', { userId: props.userId }).then(_user => {
		user.value = _user;
	});
} else if (props.username != null) {
	misskeyApi('users/show', {
		username: props.username,
		...(props.host != null && props.host !== '') ? { host: props.host } : {},
	}).then(_user => {
		user.value = _user;
	});
}

function selectUser() {
	os.selectUser({ includeSelf: true, localOnly: instance.noteSearchableScope === 'local' }).then(_user => {
		user.value = _user;
		hostInput.value = _user.host ?? '';
	});
}

function selectSelf() {
	user.value = $i as UserDetailed | null;
	hostInput.value = null;
}

function removeUser() {
	user.value = null;
	hostInput.value = '';
}

async function search() {
	const query = searchQuery.value.toString().trim();

	if (query == null || query === '') return;

	//#region AP lookup
	if (query.startsWith('https://') && !query.includes(' ')) {
		const confirm = await os.confirm({
			type: 'info',
			text: i18n.ts.lookupConfirm,
		});
		if (!confirm.canceled) {
			const promise = misskeyApi('ap/show', {
				uri: query,
			});

			os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

			const res = await promise;

			if (res.type === 'User') {
				router.push(`/@${res.object.username}@${res.object.host}`);
			} else if (res.type === 'Note') {
				router.push(`/notes/${res.object.id}`);
			}

			return;
		}
	}
	//#endregion

	if (query.length > 1 && !query.includes(' ')) {
		if (query.startsWith('@')) {
			const confirm = await os.confirm({
				type: 'info',
				text: i18n.ts.lookupConfirm,
			});
			if (!confirm.canceled) {
				router.push(`/${query}`);
				return;
			}
		}

		if (query.startsWith('#')) {
			const confirm = await os.confirm({
				type: 'info',
				text: i18n.ts.openTagPageConfirm,
			});
			if (!confirm.canceled) {
				router.push(`/tags/${encodeURIComponent(query.substring(1))}`);
				return;
			}
		}
	}

	notePagination.value = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			query: searchQuery.value,
			userId: user.value ? user.value.id : null,
			...(searchHost.value ? { host: searchHost.value } : {}),
		},
	};

	key.value++;
}
</script>
<style lang="scss" module>
.userItem {
	display: flex;
	justify-content: center;
}
.addMeButton {
  border: 2px dashed var(--MI_THEME-fgTransparent);
	padding: 12px;
	margin-right: 16px;
}
.addUserButton {
  border: 2px dashed var(--MI_THEME-fgTransparent);
	padding: 12px;
	flex-grow: 1;
}
.addUserButtonInner {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	min-height: 38px;
}
.userCard {
	flex-grow: 1;
}
.remove {
	width: 32px;
	height: 32px;
	align-self: center;

	& > i:before {
		color: #ff2a2a;
	}

	&:disabled {
		opacity: 0;
	}
}
</style>
