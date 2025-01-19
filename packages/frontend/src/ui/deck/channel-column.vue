<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked" :refresher="async () => { await timeline?.reloadTimeline() }">
	<template #header>
		<i class="ti ti-device-tv"></i><span style="margin-left: 8px;">{{ column.name || channel?.name || i18n.ts._deck._columns.channel }}</span>
	</template>

	<template v-if="column.channelId">
		<div style="padding: 8px; text-align: center;">
			<MkButton primary gradate rounded inline small @click="post"><i class="ti ti-pencil"></i></MkButton>
		</div>
		<MkTimeline ref="timeline" src="channel" :channel="column.channelId" @note="onNote"/>
	</template>
</XColumn>
</template>

<script lang="ts" setup>
import { onMounted, ref, shallowRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store.js';
import MkTimeline from '@/components/MkTimeline.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { favoritedChannelsCache } from '@/cache.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import type { MenuItem } from '@/types/menu.js';
import { SoundStore } from '@/store.js';
import { soundSettingsButton } from '@/ui/deck/tl-note-notification.js';
import * as sound from '@/scripts/sound.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const timeline = shallowRef<InstanceType<typeof MkTimeline>>();
const channel = shallowRef<Misskey.entities.Channel>();
const soundSetting = ref<SoundStore>(props.column.soundSetting ?? { type: null, volume: 1 });

onMounted(() => {
	if (props.column.channelId == null) {
		setChannel();
	}
});

watch([() => props.column.name, () => props.column.channelId], () => {
	if (!props.column.name && props.column.channelId) {
		misskeyApi('channels/show', { channelId: props.column.channelId })
			.then(value => channel.value = value);
	}
});

watch(soundSetting, v => {
	updateColumn(props.column.id, { soundSetting: v });
});

async function setChannel() {
	const channels = await favoritedChannelsCache.fetch();
	const { canceled, result: chosenChannel } = await os.select({
		title: i18n.ts.selectChannel,
		items: channels.map(x => ({
			value: x, text: x.name,
		})),
		default: props.column.channelId,
	});
	if (canceled || chosenChannel == null) return;
	updateColumn(props.column.id, {
		channelId: chosenChannel.id,
		name: chosenChannel.name,
	});
}

async function post() {
	if (props.column.channelId == null) return;
	if (!channel.value || channel.value.id !== props.column.channelId) {
		channel.value = await misskeyApi('channels/show', {
			channelId: props.column.channelId,
		});
	}

	os.post({
		channel: channel.value,
	});
}

function onNote() {
	sound.playMisskeySfxFile(soundSetting.value);
}

const menu: MenuItem[] = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.selectChannel,
	action: setChannel,
}, {
	icon: 'ti ti-bell',
	text: i18n.ts._deck.newNoteNotificationSettings,
	action: () => soundSettingsButton(soundSetting),
}];
</script>
