<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="700">
	<div>
		<div class="_gaps_m">
			<MkInput v-model="name">
				<template #label>{{ i18n.ts.name }}</template>
			</MkInput>
			<MkSelect v-model="src">
				<template #label>{{ i18n.ts.antennaSource }}</template>
				<option value="all">{{ i18n.ts._antennaSources.all }}</option>
				<!--<option value="home">{{ i18n.ts._antennaSources.homeTimeline }}</option>-->
				<option value="users">{{ i18n.ts._antennaSources.users }}</option>
				<!--<option value="list">{{ i18n.ts._antennaSources.userList }}</option>-->
				<option value="users_blacklist">{{ i18n.ts._antennaSources.userBlacklist }}</option>
			</MkSelect>
			<MkSelect v-if="src === 'list'" v-model="userListId">
				<template #label>{{ i18n.ts.userList }}</template>
				<option v-for="list in userLists" :key="list.id" :value="list.id">{{ list.name }}</option>
			</MkSelect>
			<MkTextarea v-else-if="src === 'users' || src === 'users_blacklist'" v-model="users">
				<template #label>{{ i18n.ts.users }}</template>
				<template #caption>{{ i18n.ts.antennaUsersDescription }} <button class="_textButton" @click="addUser">{{ i18n.ts.addUser }}</button></template>
			</MkTextarea>
			<MkSwitch v-model="excludeBots">{{ i18n.ts.antennaExcludeBots }}</MkSwitch>
			<MkSwitch v-model="withReplies">{{ i18n.ts.withReplies }}</MkSwitch>
			<MkTextarea v-model="keywords">
				<template #label>{{ i18n.ts.antennaKeywords }}</template>
				<template #caption>{{ i18n.ts.antennaKeywordsDescription }}</template>
			</MkTextarea>
			<MkTextarea v-model="excludeKeywords">
				<template #label>{{ i18n.ts.antennaExcludeKeywords }}</template>
				<template #caption>{{ i18n.ts.antennaKeywordsDescription }}</template>
			</MkTextarea>
			<MkSwitch v-model="localOnly">{{ i18n.ts.localOnly }}</MkSwitch>
			<MkSwitch v-model="caseSensitive">{{ i18n.ts.caseSensitive }}</MkSwitch>
			<MkSwitch v-model="withFile">{{ i18n.ts.withFileAntenna }}</MkSwitch>
		</div>
		<div :class="$style.actions">
			<div class="_buttons">
				<MkButton inline primary @click="saveAntenna()"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
				<MkButton v-if="initialAntenna.id != null" inline danger @click="deleteAntenna()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</div>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { deepMerge } from '@/scripts/merge.js';
import type { DeepPartial } from '@/scripts/merge.js';

type PartialAllowedAntenna = Omit<Misskey.entities.Antenna, 'id' | 'createdAt' | 'updatedAt'> & {
	id?: string;
	createdAt?: string;
	updatedAt?: string;
};

const props = defineProps<{
	antenna?: DeepPartial<PartialAllowedAntenna>;
}>();

const initialAntenna = deepMerge<PartialAllowedAntenna>(props.antenna ?? {}, {
	name: '',
	src: 'all',
	userListId: null,
	users: [],
	keywords: [],
	excludeKeywords: [],
	excludeBots: false,
	withReplies: false,
	caseSensitive: false,
	localOnly: false,
	withFile: false,
	isActive: true,
	hasUnreadNote: false,
	notify: false,
});

const emit = defineEmits<{
	(ev: 'created', newAntenna: Misskey.entities.Antenna): void,
	(ev: 'updated', editedAntenna: Misskey.entities.Antenna): void,
	(ev: 'deleted'): void,
}>();

const name = ref<string>(initialAntenna.name);
const src = ref<Misskey.entities.AntennasCreateRequest['src']>(initialAntenna.src);
const userListId = ref<string | null>(initialAntenna.userListId);
const users = ref<string>(initialAntenna.users.join('\n'));
const keywords = ref<string>(initialAntenna.keywords.map(x => x.join(' ')).join('\n'));
const excludeKeywords = ref<string>(initialAntenna.excludeKeywords.map(x => x.join(' ')).join('\n'));
const caseSensitive = ref<boolean>(initialAntenna.caseSensitive);
const localOnly = ref<boolean>(initialAntenna.localOnly);
const excludeBots = ref<boolean>(initialAntenna.excludeBots);
const withReplies = ref<boolean>(initialAntenna.withReplies);
const withFile = ref<boolean>(initialAntenna.withFile);
const userLists = ref<Misskey.entities.UserList[] | null>(null);

watch(() => src.value, async () => {
	if (src.value === 'list' && userLists.value === null) {
		userLists.value = await misskeyApi('users/lists/list');
	}
});

async function saveAntenna() {
	const antennaData = {
		name: name.value,
		src: src.value,
		userListId: userListId.value,
		excludeBots: excludeBots.value,
		withReplies: withReplies.value,
		withFile: withFile.value,
		caseSensitive: caseSensitive.value,
		localOnly: localOnly.value,
		users: users.value.trim().split('\n').map(x => x.trim()),
		keywords: keywords.value.trim().split('\n').map(x => x.trim().split(' ')),
		excludeKeywords: excludeKeywords.value.trim().split('\n').map(x => x.trim().split(' ')),
	};

	if (initialAntenna.id == null) {
		const res = await os.apiWithDialog('antennas/create', antennaData);
		emit('created', res);
	} else {
		const res = await os.apiWithDialog('antennas/update', { ...antennaData, antennaId: initialAntenna.id });
		emit('updated', res);
	}
}

async function deleteAntenna() {
	if (initialAntenna.id == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.removeAreYouSure({ x: initialAntenna.name }),
	});
	if (canceled) return;

	await misskeyApi('antennas/delete', {
		antennaId: initialAntenna.id,
	});

	os.success();
	emit('deleted');
}

function addUser() {
	os.selectUser({ includeSelf: true }).then(user => {
		users.value = users.value.trim();
		users.value += '\n@' + Misskey.acct.toString(user);
		users.value = users.value.trim();
	});
}
</script>

<style lang="scss" module>
.actions {
	margin-top: 16px;
	padding: 24px 0;
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>
