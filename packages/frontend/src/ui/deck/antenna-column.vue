<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-antenna"></i><span style="margin-left: 8px;">{{ column.name || antennaName || i18n.ts._deck._columns.antenna }}</span>
	</template>

	<MkTimeline v-if="column.antennaId" ref="timeline" src="antenna" :antenna="column.antennaId" @note="onNote"/>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch, defineAsyncComponent } from 'vue';
import type { entities as MisskeyEntities } from 'misskey-js';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store.js';
import MkTimeline from '@/components/MkTimeline.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import type { MenuItem } from '@/types/menu.js';
import { antennasCache } from '@/cache.js';
import { SoundStore } from '@/store.js';
import { soundSettingsButton } from '@/ui/deck/tl-note-notification.js';
import * as sound from '@/scripts/sound.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });
const antennaName = ref<string | null>(null);

onMounted(() => {
	if (props.column.antennaId == null) {
		setAntenna();
	}
});

watch([() => props.column.name, () => props.column.antennaId], () => {
	if (!props.column.name && props.column.antennaId) {
		misskeyApi('antennas/show', { antennaId: props.column.antennaId })
			.then(value => antennaName.value = value.name);
	}
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setAntenna() {
	const antennas = await misskeyApi('antennas/list');
	const { canceled, result: antenna } = await os.select<MisskeyEntities.Antenna | '_CREATE_'>({
		title: i18n.ts.selectAntenna,
		items: [
			{ value: '_CREATE_', text: i18n.ts.createNew },
			(antennas.length > 0 ? {
				sectionTitle: i18n.ts.createdAntennas,
				items: antennas.map(x => ({
					value: x, text: x.name,
				})),
			} : undefined),
		],
		default: props.column.antennaId,
	});
	if (canceled || antenna == null) return;

	if (antenna === '_CREATE_') {
		const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkAntennaEditorDialog.vue')), {}, {
			created: (newAntenna: MisskeyEntities.Antenna) => {
				antennasCache.delete();
				updateColumn(props.column.id, {
					antennaId: newAntenna.id,
				});
			},
			closed: () => {
				dispose();
			},
		});
		return;
	}

	updateColumn(props.column.id, {
		antennaId: antenna.id,
	});
}

function editAntenna() {
	os.pageWindow('my/antennas/' + props.column.antennaId);
}

function onNote() {
	sound.playMisskeySfxFile(soundSetting.value);
}

const menu: MenuItem[] = [
	{
		icon: 'ti ti-pencil',
		text: i18n.ts.selectAntenna,
		action: setAntenna,
	},
	{
		icon: 'ti ti-settings',
		text: i18n.ts.editAntenna,
		action: editAntenna,
	},
	{
		icon: 'ti ti-bell',
		text: i18n.ts._deck.newNoteNotificationSettings,
		action: () => soundSettingsButton(soundSetting),
	},
];

/*
function focus() {
	timeline.focus();
}

defineExpose({
	focus,
});
*/
</script>
