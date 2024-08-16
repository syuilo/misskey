<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="room == null || (!room.isEnded && connection == null)"><MkLoading/></div>
<RoomSetting v-else-if="!room.isStarted" :room="room" :connection="connection!"/>
<RoomGame v-else :room="room" :connection="connection"/>
</template>

<script lang="ts" setup>
import { computed, watch, ref, onMounted, shallowRef, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import RoomSetting from './room.setting.vue';
import RoomGame from './room.game.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useStream } from '@/stream.js';
import { signinRequired } from '@/account.js';
import { useRouter } from '@/router/supplier.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { useInterval } from '@/scripts/use-interval.js';

const $i = signinRequired();

const router = useRouter();

const props = defineProps<{
	roomId: string;
}>();

const room = shallowRef<Misskey.entities.MahjongRoomDetailed | null>(null);
const connection = shallowRef<Misskey.ChannelConnection | null>(null);
const shareWhenStart = ref(false);

watch(() => props.roomId, () => {
	fetchGame();
});

function start(_room: Misskey.entities.MahjongRoomDetailed) {
	if (room.value?.isStarted) return;

	room.value = _room;
}

async function fetchGame() {
	const _room = await misskeyApi('mahjong/show-room', {
		roomId: props.roomId,
	});

	room.value = _room;
	shareWhenStart.value = false;

	if (connection.value) {
		connection.value.dispose();
	}
	if (!room.value.isEnded) {
		connection.value = useStream().useChannel('mahjongRoom', {
			roomId: room.value.id,
		});
		connection.value.on('started', x => {
			start(x.room);
		});
		connection.value.on('canceled', x => {
			connection.value?.dispose();

			if (x.userId !== $i.id) {
				os.alert({
					type: 'warning',
					text: i18n.ts._mahjong.roomCanceled,
				});
				router.push('/mahjong');
			}
		});
	}
}

// 通信を取りこぼした場合の救済
useInterval(async () => {
	if (room.value == null) return;
	if (room.value.isStarted) return;

	const _room = await misskeyApi('mahjong/show-room', {
		roomId: props.roomId,
	});

	if (_room.isStarted) {
		start(_room);
	} else {
		room.value = _room;
	}
}, 1000 * 10, {
	immediate: false,
	afterMounted: true,
});

onMounted(() => {
	fetchGame();
});

onUnmounted(() => {
	if (connection.value) {
		connection.value.dispose();
	}
});

definePageMetadata(computed(() => ({
	title: i18n.ts._mahjong.mahjong,
	icon: 'ti ti-device-roompad',
})));
</script>
