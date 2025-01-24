<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput
			v-model="searchQuery"
			large
			autofocus
			type="search"
			@enter.prevent="search"
		>
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkFoldableSection expanded>
			<template #header>{{ i18n.ts.options }}</template>

			<div class="_gaps_m">
				<MkRadios v-model="searchScope">
					<option v-if="instance.federation !== 'none' && noteSearchableScope === 'global'" value="all">{{ i18n.ts._search.searchScopeAll }}</option>
					<option value="local">{{ instance.federation === 'none' ? i18n.ts._search.searchScopeAll : i18n.ts._search.searchScopeLocal }}</option>
					<option v-if="instance.federation !== 'none' && noteSearchableScope === 'global'" value="server">{{ i18n.ts._search.searchScopeServer }}</option>
					<option value="user">{{ i18n.ts._search.searchScopeUser }}</option>
				</MkRadios>

				<div v-if="instance.federation !== 'none' && searchScope === 'server'" :class="$style.subOptionRoot">
					<MkInput
						v-model="hostInput"
						:placeholder="i18n.ts._search.serverHostPlaceholder"
						@enter.prevent="search"
					>
						<template #label>{{ i18n.ts._search.pleaseEnterServerHost }}</template>
						<template #prefix><i class="ti ti-server"></i></template>
					</MkInput>
				</div>

				<div v-if="searchScope === 'user'" :class="$style.subOptionRoot">
					<div :class="$style.userSelectLabel">{{ i18n.ts._search.pleaseSelectUser }}</div>
					<div class="_gaps">
						<div v-if="user == null" :class="$style.userSelectButtons">
							<div v-if="$i != null">
								<MkButton
									transparent
									:class="$style.userSelectButton"
									@click="selectSelf"
								>
									<div :class="$style.userSelectButtonInner">
										<span><i class="ti ti-plus"></i><i class="ti ti-user"></i></span>
										<span>{{ i18n.ts.selectSelf }}</span>
									</div>
								</MkButton>
							</div>
							<div :style="$i == null ? 'grid-column: span 2;' : undefined">
								<MkButton
									transparent
									:class="$style.userSelectButton"
									@click="selectUser"
								>
									<div :class="$style.userSelectButtonInner">
										<span><i class="ti ti-plus"></i></span>
										<span>{{ i18n.ts.selectUser }}</span>
									</div>
								</MkButton>
							</div>
						</div>
						<div v-else :class="$style.userSelectedButtons">
							<div style="overflow: hidden;">
								<MkUserCardMini
									:user="user"
									:withChart="false"
									:class="$style.userSelectedCard"
								/>
							</div>
							<div>
								<button
									class="_button"
									:class="$style.userSelectedRemoveButton"
									@click="removeUser"
								>
									<i class="ti ti-x"></i>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</MkFoldableSection>
		<div>
			<MkButton
				large
				primary
				gradate
				rounded
				:disabled="searchParams == null"
				style="margin: 0 auto;"
				@click="search"
			>
				{{ i18n.ts.search }}
			</MkButton>
		</div>
	</div>

	<MkFoldableSection v-if="notePagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkNotes :key="`searchNotes:${key}`" :pagination="notePagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, toRef } from 'vue';
import type * as Misskey from 'misskey-js';
import type { Paging } from '@/components/MkPagination.vue';
import { $i } from '@/account.js';
import { host as localHost } from '@@/js/config.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useRouter } from '@/router/supplier.js';
import MkButton from '@/components/MkButton.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkInput from '@/components/MkInput.vue';
import MkNotes from '@/components/MkNotes.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';

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
const notePagination = ref<Paging<'notes/search'>>();

const searchQuery = ref(toRef(props, 'query').value);
const hostInput = ref(toRef(props, 'host').value);

const user = shallowRef<Misskey.entities.UserDetailed | null>(null);

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const noteSearchableScope = instance.noteSearchableScope ?? 'local';

//#region set user
let fetchedUser: Misskey.entities.UserDetailed | null = null;

if (props.userId) {
	fetchedUser = await misskeyApi('users/show', {
		userId: props.userId,
	}).catch(() => null);
}

if (props.username && fetchedUser == null) {
	fetchedUser = await misskeyApi('users/show', {
		username: props.username,
		...(props.host ? { host: props.host } : {}),
	}).catch(() => null);
}

if (fetchedUser != null) {
	if (!(noteSearchableScope === 'local' && fetchedUser.host != null)) {
		user.value = fetchedUser;
	}
}
//#endregion

const searchScope = ref<'all' | 'local' | 'server' | 'user'>((() => {
	if (user.value != null) return 'user';
	if (noteSearchableScope === 'local') return 'local';
	if (hostInput.value) return 'server';
	return 'all';
})());

type SearchParams = {
	readonly query: string;
	readonly host?: string;
	readonly userId?: string;
};

const fixHostIfLocal = (target: string | null | undefined) => {
	if (!target || target === localHost) return '.';
	return target;
};

const searchParams = computed<SearchParams | null>(() => {
	const trimmedQuery = searchQuery.value.trim();
	if (!trimmedQuery) return null;

	if (searchScope.value === 'user') {
		if (user.value == null) return null;
		return {
			query: trimmedQuery,
			host: fixHostIfLocal(user.value.host),
			userId: user.value.id,
		};
	}

	if (instance.federation !== 'none' && searchScope.value === 'server') {
		let trimmedHost = hostInput.value?.trim();
		if (!trimmedHost) return null;
		if (trimmedHost.startsWith('https://') || trimmedHost.startsWith('http://')) {
			try {
				trimmedHost = new URL(trimmedHost).host;
			} catch (err) { /* empty */ }
		}
		return {
			query: trimmedQuery,
			host: fixHostIfLocal(trimmedHost),
		};
	}

	if (instance.federation === 'none' || searchScope.value === 'local') {
		return {
			query: trimmedQuery,
			host: '.',
		};
	}

	return {
		query: trimmedQuery,
	};
});

function selectUser() {
	os.selectUser({
		includeSelf: true,
		localOnly: instance.noteSearchableScope === 'local',
	}).then(_user => {
		user.value = _user;
	});
}

function selectSelf() {
	user.value = $i;
}

function removeUser() {
	user.value = null;
}

async function search() {
	if (searchParams.value == null) return;

	//#region AP lookup
	if (searchParams.value.query.startsWith('https://') && !searchParams.value.query.includes(' ')) {
		const confirm = await os.confirm({
			type: 'info',
			text: i18n.ts.lookupConfirm,
		});
		if (!confirm.canceled) {
			const promise = misskeyApi('ap/show', {
				uri: searchParams.value.query,
			});

			os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

			const res = await promise;

			if (res.type === 'User') {
				router.push(`/@${res.object.username}@${res.object.host}`);
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			} else if (res.type === 'Note') {
				router.push(`/notes/${res.object.id}`);
			}

			return;
		}
	}
	//#endregion

	if (searchParams.value.query.length > 1 && !searchParams.value.query.includes(' ')) {
		if (searchParams.value.query.startsWith('@')) {
			const confirm = await os.confirm({
				type: 'info',
				text: i18n.ts.lookupConfirm,
			});
			if (!confirm.canceled) {
				router.push(`/${searchParams.value.query}`);
				return;
			}
		}

		if (searchParams.value.query.startsWith('#')) {
			const confirm = await os.confirm({
				type: 'info',
				text: i18n.ts.openTagPageConfirm,
			});
			if (!confirm.canceled) {
				router.push(`/tags/${encodeURIComponent(searchParams.value.query.substring(1))}`);
				return;
			}
		}
	}

	notePagination.value = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			...searchParams.value,
		},
	};

	key.value++;
}
</script>
<style lang="scss" module>
.subOptionRoot {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
	padding: var(--MI-margin);
}

.userSelectLabel {
	font-size: 0.85em;
	padding: 0 0 8px;
	user-select: none;
}

.userSelectButtons {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 16px;
}

.userSelectButton {
	width: 100%;
	height: 100%;
	padding: 12px;
	border: 2px dashed var(--MI_THEME-fgTransparent);
}

.userSelectButtonInner {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	min-height: 38px;
}

.userSelectedButtons {
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
}

.userSelectedRemoveButton {
	width: 32px;
	height: 32px;
	color: #ff2a2a;
}
</style>
