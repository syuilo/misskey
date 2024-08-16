<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="600">
	<div class="_gaps">
		<div>
			<img src="/client-assets/mahjong/logo.png" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
		</div>

		<div class="_panel _gaps" style="padding: 16px;">
			<div class="_buttonsCenter">
				<MkButton primary gradate rounded @click="joinRoom">{{ i18n.ts._mahjong.joinRoom }}</MkButton>
				<MkButton primary gradate rounded @click="createRoom">{{ i18n.ts._mahjong.createRoom }}</MkButton>
			</div>
			<div style="font-size: 90%; opacity: 0.7; text-align: center;"><i class="ti ti-music"></i> {{ i18n.ts.soundWillBePlayed }}</div>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, onDeactivated, onMounted, onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { useStream } from '@/stream.js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import MkPagination from '@/components/MkPagination.vue';
import { useRouter } from '@/router/supplier.js';
import * as os from '@/os.js';
import { useInterval } from '@/scripts/use-interval.js';
import * as sound from '@/scripts/sound.js';

const myGamesPagination = {
	endpoint: 'mahjong/games' as const,
	limit: 10,
	params: {
		my: true,
	},
};

const gamesPagination = {
	endpoint: 'mahjong/games' as const,
	limit: 10,
};

const router = useRouter();

const invitations = ref<Misskey.entities.UserLite[]>([]);
const matchingUser = ref<Misskey.entities.UserLite | null>(null);
const matchingAny = ref<boolean>(false);
const noIrregularRules = ref<boolean>(false);

async function joinRoom() {
	const { canceled, result } = await os.inputText({
		title: 'roomId',
	});
	if (canceled) return;
	const room = await misskeyApi('mahjong/join-room', {
		roomId: result,
	});
	router.push(`/mahjong/g/${room.id}`);
}

async function createRoom(ev: MouseEvent) {
	const room = await misskeyApi('mahjong/create-room', {
	});
	router.push(`/mahjong/g/${room.id}`);
}

definePageMetadata(computed(() => ({
	title: i18n.ts._mahjong.mahjong,
	icon: 'ti ti-device-gamepad',
})));
</script>

<style lang="scss" module>
@keyframes blink {
	0% { opacity: 1; }
	50% { opacity: 0.2; }
}

.invitation {
	display: flex;
	box-sizing: border-box;
	width: 100%;
	padding: 16px;
	line-height: 32px;
	text-align: left;
}

.gamePreviews {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: var(--margin);
}

.gamePreview {
	font-size: 90%;
	border-radius: 8px;
	overflow: clip;
}

.gamePreviewActive {
	box-shadow: inset 0 0 8px 0px var(--accent);
}

.gamePreviewWaiting {
	box-shadow: inset 0 0 8px 0px var(--warn);
}

.gamePreviewPlayers {
	text-align: center;
	padding: 16px;
	line-height: 32px;
}

.gamePreviewPlayersAvatar {
	width: 32px;
	height: 32px;

	&:first-child {
		margin-right: 8px;
	}

	&:last-child {
		margin-left: 8px;
	}
}

.gamePreviewFooter {
	display: flex;
	align-items: baseline;
	border-top: solid 0.5px var(--divider);
	padding: 6px 10px;
	font-size: 0.9em;
}

.gamePreviewStatusActive {
	color: var(--accent);
	font-weight: bold;
	animation: blink 2s infinite;
}

.gamePreviewStatusWaiting {
	color: var(--warn);
	font-weight: bold;
	animation: blink 2s infinite;
}

.waitingScreen {
	text-align: center;
}

.waitingScreenTitle {
	font-size: 1.5em;
	margin-bottom: 16px;
	margin-top: 32px;
}
</style>
