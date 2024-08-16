<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<MkSpacer :contentMax="600">
		<div class="_gaps">
			<div class="_panel">
				<MkAvatar v-if="room.user1" :user="room.user1" :class="$style.userAvatar"/>
				<div v-else-if="room.user1Ai">AI</div>
				<div v-if="room.user1Ready">OK</div>
			</div>
			<div class="_panel">
				<MkAvatar v-if="room.user2" :user="room.user2" :class="$style.userAvatar"/>
				<div v-else-if="room.user2Ai">AI</div>
				<div v-if="room.user2Ready">OK</div>
			</div>
			<div class="_panel">
				<MkAvatar v-if="room.user3" :user="room.user3" :class="$style.userAvatar"/>
				<div v-else-if="room.user3Ai">AI</div>
				<div v-if="room.user3Ready">OK</div>
			</div>
			<div class="_panel">
				<MkAvatar v-if="room.user4" :user="room.user4" :class="$style.userAvatar"/>
				<div v-else-if="room.user4Ai">AI</div>
				<div v-if="room.user4Ready">OK</div>
			</div>
		</div>
		<div>
			<MkButton rounded primary @click="addCpu">{{ i18n.ts._mahjong.addCpu }}</MkButton>
		</div>
	</MkSpacer>
	<template #footer>
		<div :class="$style.footer">
			<MkSpacer :contentMax="700" :marginMin="16" :marginMax="16">
				<div style="text-align: center;" class="_gaps_s">
					<div class="_buttonsCenter">
						<MkButton rounded danger @click="leave">{{ i18n.ts._mahjong.leave }}</MkButton>
						<MkButton v-if="!isReady" rounded primary @click="ready">{{ i18n.ts._mahjong.ready }}</MkButton>
						<MkButton v-if="isReady" rounded @click="unready">{{ i18n.ts._mahjong.cancelReady }}</MkButton>
					</div>
				</div>
			</MkSpacer>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref, onMounted, shallowRef, onUnmounted } from 'vue';
import * as Misskey from 'misskey-js';
import * as Mmj from 'misskey-mahjong';
import { i18n } from '@/i18n.js';
import { signinRequired } from '@/account.js';
import { deepClone } from '@/scripts/clone.js';
import MkButton from '@/components/MkButton.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os.js';
import { MenuItem } from '@/types/menu.js';
import { useRouter } from '@/router/supplier.js';

const $i = signinRequired();

const router = useRouter();

const props = defineProps<{
	room: Misskey.entities.MahjongRoomDetailed;
	connection: Misskey.ChannelConnection;
}>();

const room = ref<Misskey.entities.MahjongRoomDetailed>(deepClone(props.room));

const isReady = computed(() => {
	if (room.value.user1Id === $i.id && room.value.user1Ready) return true;
	if (room.value.user2Id === $i.id && room.value.user2Ready) return true;
	if (room.value.user3Id === $i.id && room.value.user3Ready) return true;
	if (room.value.user4Id === $i.id && room.value.user4Ready) return true;
	return false;
});

async function leave() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.areYouSure,
	});
	if (canceled) return;

	props.connection.send('leave', {});

	router.push('/mahjong');
}

function ready() {
	props.connection.send('ready', true);
}

function unready() {
	props.connection.send('ready', false);
}

function addCpu() {
	props.connection.send('addAi', {});
}

function onChangeReadyStates(states) {
	room.value.user1Ready = states.user1;
	room.value.user2Ready = states.user2;
	room.value.user3Ready = states.user3;
	room.value.user4Ready = states.user4;
}

function onJoined(x) {
	switch (x.index) {
		case 1:
			room.value.user1 = x.user;
			room.value.user1Ai = x.user == null;
			room.value.user1Ready = room.value.user1Ai;
			break;
		case 2:
			room.value.user2 = x.user;
			room.value.user2Ai = x.user == null;
			room.value.user2Ready = room.value.user2Ai;
			break;
		case 3:
			room.value.user3 = x.user;
			room.value.user3Ai = x.user == null;
			room.value.user3Ready = room.value.user3Ai;
			break;
		case 4:
			room.value.user4 = x.user;
			room.value.user4Ai = x.user == null;
			room.value.user4Ready = room.value.user4Ai;
			break;

		default:
			break;
	}
}

props.connection.on('changeReadyStates', onChangeReadyStates);
props.connection.on('joined', onJoined);

onUnmounted(() => {
	props.connection.off('changeReadyStates', onChangeReadyStates);
	props.connection.off('joined', onJoined);
});
</script>

<style lang="scss" module>
.userAvatar {
	width: 48px;
	height: 48px;
}

.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	background: var(--acrylicBg);
	border-top: solid 0.5px var(--divider);
}
</style>
