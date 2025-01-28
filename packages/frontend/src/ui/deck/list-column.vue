<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-list"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<MkTimeline v-if="column.listId" ref="timeline" src="list" :list="column.listId" :withRenotes="withRenotes" @note="onNote"/>
</XColumn>
</template>

<script lang="ts" setup>
import { watch, shallowRef, ref } from 'vue';
import type { entities as MisskeyEntities } from 'misskey-js';
import XColumn from './column.vue';
import { updateColumn } from './deck-store.js';
import type { Column } from './deck-store.js';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import type { MenuItem } from '@/types/menu.js';
import type { SoundStore } from '@/store.js';
import { userListsCache } from '@/cache.js';
import { soundSettingsButton } from '@/ui/deck/tl-note-notification.js';
import * as sound from '@/scripts/sound.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();
const withRenotes = ref(props.column.withRenotes ?? true);
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });

if (props.column.listId == null) {
	setList();
}

watch(withRenotes, v => {
	updateColumn(props.column.id, {
		withRenotes: v,
	});
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setList() {
	const lists = await misskeyApi('users/lists/list');
	const { canceled, result: list } = await os.select<MisskeyEntities.UserList | '_CREATE_'>({
		title: i18n.ts.selectList,
		items: [
			{ value: '_CREATE_', text: i18n.ts.createNew },
			(lists.length > 0 ? {
				sectionTitle: i18n.ts.createdLists,
				items: lists.map(x => ({
					value: x, text: x.name,
				})),
			} : undefined),
		],
		default: props.column.listId,
	});
	if (canceled || list == null) return;

	if (list === '_CREATE_') {
		const { canceled, result: name } = await os.inputText({
			title: i18n.ts.enterListName,
		});
		if (canceled || name == null || name === '') return;

		const res = await os.apiWithDialog('users/lists/create', { name: name });
		userListsCache.delete();

		updateColumn(props.column.id, {
			listId: res.id,
		});
	} else {
		updateColumn(props.column.id, {
			listId: list.id,
		});
	}
}

function editList() {
	os.pageWindow('my/lists/' + props.column.listId);
}

function onNote() {
	sound.playMisskeySfxFile(soundSetting.value);
}

const menu: MenuItem[] = [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.selectList,
		action: setList,
	},
	{
		icon: 'ti ti-settings',
		text: i18n.ts.editList,
		action: editList,
	},
	{
		type: 'switch',
		text: i18n.ts.showRenotes,
		ref: withRenotes,
	},
	{
		icon: 'ti ti-bell',
		text: i18n.ts._deck.newNoteNotificationSettings,
		action: () => soundSettingsButton(soundSetting),
	},
];
</script>
