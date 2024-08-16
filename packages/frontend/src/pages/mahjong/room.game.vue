<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.taku">
		<div :class="$style.centerPanel">
			<div style="text-align: center;">
				<div :class="$style.centerPanelTickerToi">
					<div style="position: absolute; left: 10px; bottom: 5px;">
						<span :class="$style.centerPanelHouse">{{ Mmj.prevHouse(Mmj.prevHouse(mj.myHouse)) === 'e' ? i18n.ts._mahjong.east : Mmj.prevHouse(Mmj.prevHouse(mj.myHouse)) === 's' ? i18n.ts._mahjong.south : Mmj.prevHouse(Mmj.prevHouse(mj.myHouse)) === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</span>
						<span :class="$style.centerPanelPoint">{{ mj.points[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))] }}</span>
					</div>
				</div>
				<div :class="$style.centerPanelTickerKami">
					<div style="position: absolute; left: 10px; bottom: 5px;">
						<span :class="$style.centerPanelHouse">{{ Mmj.prevHouse(mj.myHouse) === 'e' ? i18n.ts._mahjong.east : Mmj.prevHouse(mj.myHouse) === 's' ? i18n.ts._mahjong.south : Mmj.prevHouse(mj.myHouse) === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</span>
						<span :class="$style.centerPanelPoint">{{ mj.points[Mmj.prevHouse(mj.myHouse)] }}</span>
					</div>
				</div>
				<div :class="$style.centerPanelTickerSimo">
					<div style="position: absolute; left: 10px; bottom: 5px;">
						<span :class="$style.centerPanelHouse">{{ Mmj.nextHouse(mj.myHouse) === 'e' ? i18n.ts._mahjong.east : Mmj.nextHouse(mj.myHouse) === 's' ? i18n.ts._mahjong.south : Mmj.nextHouse(mj.myHouse) === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</span>
						<span :class="$style.centerPanelPoint">{{ mj.points[Mmj.nextHouse(mj.myHouse)] }}</span>
					</div>
				</div>
				<div :class="$style.centerPanelTickerMe">
					<div style="position: absolute; left: 10px; bottom: 5px;">
						<span :class="$style.centerPanelHouse">{{ mj.myHouse === 'e' ? i18n.ts._mahjong.east : mj.myHouse === 's' ? i18n.ts._mahjong.south : mj.myHouse === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</span>
						<span :class="$style.centerPanelPoint">{{ mj.points[mj.myHouse] }}</span>
					</div>
				</div>
				<div :class="$style.centerPanelIndicatorContainerToi">
					<div style="position: absolute; left: 0; right: 0; bottom: 0;">
						<div :class="[$style.centerPanelIndicator, { [$style.centerPanelIndicatorIndicated]: mj.turn === Mmj.prevHouse(Mmj.prevHouse(mj.myHouse)) }]"></div>
					</div>
				</div>
				<div :class="$style.centerPanelIndicatorContainerKami">
					<div style="position: absolute; left: 0; right: 0; bottom: 0;">
						<div :class="[$style.centerPanelIndicator, { [$style.centerPanelIndicatorIndicated]: mj.turn === Mmj.prevHouse(mj.myHouse) }]"></div>
					</div>
				</div>
				<div :class="$style.centerPanelIndicatorContainerSimo">
					<div style="position: absolute; left: 0; right: 0; bottom: 0;">
						<div :class="[$style.centerPanelIndicator, { [$style.centerPanelIndicatorIndicated]: mj.turn === Mmj.nextHouse(mj.myHouse) }]"></div>
					</div>
				</div>
				<div :class="$style.centerPanelIndicatorContainerMe">
					<div style="position: absolute; left: 0; right: 0; bottom: 0;">
						<div :class="[$style.centerPanelIndicator, { [$style.centerPanelIndicatorIndicated]: mj.turn === mj.myHouse }]"></div>
					</div>
				</div>
				<div>
					<div>{{ mj.tilesCount }}</div>
				</div>
			</div>
		</div>

		<div :class="$style.handTilesOfToimen">
			<div v-for="tile in mj.handTiles[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" style="display: inline-block;">
				<img :src="`/client-assets/mahjong/tile-back.png`" :class="$style.handTileImgOfToimen"/>
			</div>
		</div>

		<div :class="$style.handTilesOfKamitya">
			<div v-for="tile in mj.handTiles[Mmj.prevHouse(mj.myHouse)]" :class="$style.sideTile">
				<img :src="`/client-assets/mahjong/tile-side.png`" style="display: inline-block; width: 32px;"/>
			</div>
		</div>

		<div :class="$style.handTilesOfSimotya">
			<div v-for="tile in mj.handTiles[Mmj.nextHouse(mj.myHouse)]" :class="$style.sideTile">
				<img :src="`/client-assets/mahjong/tile-side.png`" style="display: inline-block; width: 32px; scale: -1 1;"/>
			</div>
		</div>

		<div :class="$style.huroTilesOfToimen">
			<XHuro v-for="huro in mj.huros[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" :huro="huro" :variation="1" :doras="mj.doras"/>
		</div>

		<div :class="$style.huroTilesOfKamitya">
			<XHuro v-for="huro in mj.huros[Mmj.prevHouse(mj.myHouse)]" :huro="huro" :variation="1" :doras="mj.doras"/>
		</div>

		<div :class="$style.huroTilesOfSimotya">
			<XHuro v-for="huro in mj.huros[Mmj.nextHouse(mj.myHouse)]" :huro="huro" :variation="1" :doras="mj.doras"/>
		</div>

		<div :class="$style.huroTilesOfMe">
			<XHuro v-for="huro in mj.huros[mj.myHouse]" :huro="huro" :variation="1" :doras="mj.doras"/>
		</div>

		<div :class="$style.hoTilesContainer">
			<div :class="$style.hoTilesContainerOfToimen">
				<div :class="$style.hoTilesOfToimen">
					<div v-for="(tile, i) in mj.hoTiles[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" :class="$style.hoTile" :style="{ zIndex: mj.hoTiles[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))].length - i }">
						<XTile :tile="mj$(tile)" variation="2" :doras="mj.doras"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfKamitya">
				<div :class="$style.hoTilesOfKamitya">
					<div v-for="tile in mj.hoTiles[Mmj.prevHouse(mj.myHouse)]" :class="$style.hoTile">
						<XTile :tile="mj$(tile)" variation="4" :doras="mj.doras"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfSimotya">
				<div :class="$style.hoTilesOfSimotya">
					<div v-for="(tile, i) in mj.hoTiles[Mmj.nextHouse(mj.myHouse)]" :class="$style.hoTile" :style="{ zIndex: mj.hoTiles[Mmj.nextHouse(mj.myHouse)].length - i }">
						<XTile :tile="mj$(tile)" variation="5" :doras="mj.doras"/>
					</div>
				</div>
			</div>
			<div :class="$style.hoTilesContainerOfMe">
				<div :class="$style.hoTilesOfMe">
					<div v-for="tile in mj.hoTiles[mj.myHouse]" :class="$style.hoTile">
						<XTile :tile="mj$(tile)" variation="1" :doras="mj.doras"/>
					</div>
				</div>
			</div>
		</div>

		<div :class="$style.playersContainer">
			<div :class="[$style.playerOfToimen, $style.player]">
				<template v-if="users[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))] != null">
					<MkAvatar :user="users[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" style="width: 30px; height: 30px;"/>
				</template>
				<template v-else>
					CPU
				</template>
			</div>
			<div :class="[$style.playerOfKamitya, $style.player]">
				<template v-if="users[Mmj.prevHouse(mj.myHouse)] != null">
					<MkAvatar :user="users[Mmj.prevHouse(mj.myHouse)]" style="width: 30px; height: 30px;"/>
				</template>
				<template v-else>
					CPU
				</template>
			</div>
			<div :class="[$style.playerOfSimotya, $style.player]">
				<template v-if="users[Mmj.nextHouse(mj.myHouse)] != null">
					<MkAvatar :user="users[Mmj.nextHouse(mj.myHouse)]" style="width: 30px; height: 30px;"/>
				</template>
				<template v-else>
					CPU
				</template>
			</div>
		</div>

		<XHandTiles :class="$style.handTilesOfMe" :tiles="mj.myHandTiles" :doras="mj.doras" :selectableTiles="selectableTiles" :separateLast="isMyTurn && iTsumoed" @choose="chooseTile"/>

		<div :class="$style.serifContainer">
			<div :class="$style.serifContainerOfToimen">
				<Transition
					:enterActiveClass="$style.transition_serif_enterActive"
					:leaveActiveClass="$style.transition_serif_leaveActive"
					:enterFromClass="$style.transition_serif_enterFrom"
					:leaveToClass="$style.transition_serif_leaveTo"
				>
					<img v-if="ronSerifHouses[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" :src="`/client-assets/mahjong/ron.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ciiSerifHouses[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" :src="`/client-assets/mahjong/cii.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ponSerifHouses[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" :src="`/client-assets/mahjong/pon.png`" style="display: block; width: 100%;"/>
					<img v-else-if="kanSerifHouses[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" :src="`/client-assets/mahjong/kan.png`" style="display: block; width: 100%;"/>
					<img v-else-if="tsumoSerifHouses[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" :src="`/client-assets/mahjong/tsumo.png`" style="display: block; width: 100%;"/>
					<img v-else-if="riichiSerifHouses[Mmj.prevHouse(Mmj.prevHouse(mj.myHouse))]" :src="`/client-assets/mahjong/riichi.png`" style="display: block; width: 100%;"/>
				</Transition>
			</div>
			<div :class="$style.serifContainerOfKamitya">
				<Transition
					:enterActiveClass="$style.transition_serif_enterActive"
					:leaveActiveClass="$style.transition_serif_leaveActive"
					:enterFromClass="$style.transition_serif_enterFrom"
					:leaveToClass="$style.transition_serif_leaveTo"
				>
					<img v-if="ronSerifHouses[Mmj.prevHouse(mj.myHouse)]" :src="`/client-assets/mahjong/ron.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ciiSerifHouses[Mmj.prevHouse(mj.myHouse)]" :src="`/client-assets/mahjong/cii.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ponSerifHouses[Mmj.prevHouse(mj.myHouse)]" :src="`/client-assets/mahjong/pon.png`" style="display: block; width: 100%;"/>
					<img v-else-if="kanSerifHouses[Mmj.prevHouse(mj.myHouse)]" :src="`/client-assets/mahjong/kan.png`" style="display: block; width: 100%;"/>
					<img v-else-if="tsumoSerifHouses[Mmj.prevHouse(mj.myHouse)]" :src="`/client-assets/mahjong/tsumo.png`" style="display: block; width: 100%;"/>
					<img v-else-if="riichiSerifHouses[Mmj.prevHouse(mj.myHouse)]" :src="`/client-assets/mahjong/riichi.png`" style="display: block; width: 100%;"/>
				</Transition>
			</div>
			<div :class="$style.serifContainerOfSimotya">
				<Transition
					:enterActiveClass="$style.transition_serif_enterActive"
					:leaveActiveClass="$style.transition_serif_leaveActive"
					:enterFromClass="$style.transition_serif_enterFrom"
					:leaveToClass="$style.transition_serif_leaveTo"
				>
					<img v-if="ronSerifHouses[Mmj.nextHouse(mj.myHouse)]" :src="`/client-assets/mahjong/ron.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ciiSerifHouses[Mmj.nextHouse(mj.myHouse)]" :src="`/client-assets/mahjong/cii.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ponSerifHouses[Mmj.nextHouse(mj.myHouse)]" :src="`/client-assets/mahjong/pon.png`" style="display: block; width: 100%;"/>
					<img v-else-if="kanSerifHouses[Mmj.nextHouse(mj.myHouse)]" :src="`/client-assets/mahjong/kan.png`" style="display: block; width: 100%;"/>
					<img v-else-if="tsumoSerifHouses[Mmj.nextHouse(mj.myHouse)]" :src="`/client-assets/mahjong/tsumo.png`" style="display: block; width: 100%;"/>
					<img v-else-if="riichiSerifHouses[Mmj.nextHouse(mj.myHouse)]" :src="`/client-assets/mahjong/riichi.png`" style="display: block; width: 100%;"/>
				</Transition>
			</div>
			<div :class="$style.serifContainerOfMe">
				<Transition
					:enterActiveClass="$style.transition_serif_enterActive"
					:leaveActiveClass="$style.transition_serif_leaveActive"
					:enterFromClass="$style.transition_serif_enterFrom"
					:leaveToClass="$style.transition_serif_leaveTo"
				>
					<img v-if="ronSerifHouses[mj.myHouse]" :src="`/client-assets/mahjong/ron.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ciiSerifHouses[mj.myHouse]" :src="`/client-assets/mahjong/cii.png`" style="display: block; width: 100%;"/>
					<img v-else-if="ponSerifHouses[mj.myHouse]" :src="`/client-assets/mahjong/pon.png`" style="display: block; width: 100%;"/>
					<img v-else-if="kanSerifHouses[mj.myHouse]" :src="`/client-assets/mahjong/kan.png`" style="display: block; width: 100%;"/>
					<img v-else-if="tsumoSerifHouses[mj.myHouse]" :src="`/client-assets/mahjong/tsumo.png`" style="display: block; width: 100%;"/>
					<img v-else-if="riichiSerifHouses[mj.myHouse]" :src="`/client-assets/mahjong/riichi.png`" style="display: block; width: 100%;"/>
				</Transition>
			</div>
		</div>

		<div :class="$style.startTextContainer">
			<Transition
				:enterActiveClass="$style.transition_serif_enterActive"
				:leaveActiveClass="$style.transition_serif_leaveActive"
				:enterFromClass="$style.transition_serif_enterFrom"
				:leaveToClass="$style.transition_serif_leaveTo"
			>
				<img v-if="startTextShowing" :src="`/client-assets/mahjong/kaisi.png`" style="display: block; width: 100%;"/>
			</Transition>
		</div>

		<div :class="$style.ryuukyokuContainer">
			<Transition
				:enterActiveClass="$style.transition_serif_enterActive"
				:leaveActiveClass="$style.transition_serif_leaveActive"
				:enterFromClass="$style.transition_serif_enterFrom"
				:leaveToClass="$style.transition_serif_leaveTo"
			>
				<img v-if="ryuukyokued" :src="`/client-assets/mahjong/ryuukyoku.png`" style="display: block; width: 100%;"/>
			</Transition>
		</div>

		<div :class="$style.actions" class="_buttons">
			<MkButton v-if="mj.canRon != null" primary gradate @click="ron">Ron</MkButton>
			<MkButton v-if="mj.canPon != null" primary @click="pon">Pon</MkButton>
			<MkButton v-if="mj.canCii != null" primary @click="cii">Cii</MkButton>
			<MkButton v-if="mj.canKan != null" primary @click="kan">Kan</MkButton>
			<MkButton v-if="mj.canRon != null || mj.canPon != null || mj.canCii != null || mj.canKan != null" @click="skip">Skip</MkButton>
			<MkButton v-if="isMyTurn && mj.canAnkan()" @click="ankan">Ankan</MkButton>
			<MkButton v-if="isMyTurn && mj.canKakan()" @click="kakan">Kakan</MkButton>
			<MkButton v-if="isMyTurn && canHora" primary gradate @click="tsumoHora">Tsumo</MkButton>
			<MkButton v-if="isMyTurn && mj.canRiichi()" primary @click="riichi">Riichi</MkButton>
		</div>
	</div>
	<div v-if="showKyokuResults" :class="$style.kyokuResult">
		<div v-for="(res, house) in kyokuResults" :key="house">
			<div v-if="res != null">
				<div>
					<div>{{ house === 'e' ? i18n.ts._mahjong.east : house === 's' ? i18n.ts._mahjong.south : house === 'w' ? i18n.ts._mahjong.west : i18n.ts._mahjong.north }}</div>
					<template v-if="houseToUser(house) != null">
						<MkAvatar :user="houseToUser(house)" style="width: 30px; height: 30px;"/>
					</template>
					<template v-else>
						CPU
					</template>
				</div>
				<div v-for="yaku in res.yakus">
					<div>{{ i18n.ts._mahjong._yakus[yaku.name] }} {{ yaku.fan }}{{ i18n.ts._mahjong.fan }}</div>
				</div>
				<div>{{ i18n.ts._mahjong.dora }} {{ res.doraCount }}{{ i18n.ts._mahjong.fan }}</div>
				<div>{{ res.pointDeltas.e }} / {{ res.pointDeltas.s }} / {{ res.pointDeltas.w }} / {{ res.pointDeltas.n }}</div>
			</div>
		</div>
		<MkButton primary @click="confirmKyokuResult">OK</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import * as Misskey from 'misskey-js';
import * as Mmj from 'misskey-mahjong';
import XTile from './tile.vue';
import XHuro from './huro.vue';
import XHandTiles from './hand-tiles.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { deepClone } from '@/scripts/clone.js';
import { useInterval } from '@/scripts/use-interval.js';
import { signinRequired } from '@/account.js';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { userPage } from '@/filters/user.js';
import * as sound from '@/scripts/sound.js';
import * as os from '@/os.js';
import { confetti } from '@/scripts/confetti.js';

//#region syntax suger
function mj$(tid: Mmj.TileId): Mmj.TileInstance {
	return Mmj.findTileByIdOrFail(tid);
}

function mj$type(tid: Mmj.TileId): Mmj.TileType {
	return mj$(tid).t;
}
//#endregion

const $i = signinRequired();

const props = defineProps<{
	room: Misskey.entities.MahjongRoomDetailed;
	connection?: Misskey.ChannelConnection | null;
}>();

const room = ref<Misskey.entities.MahjongRoomDetailed>(deepClone(props.room));
const myUserNumber = computed(() => room.value.user1Id === $i.id ? 1 : room.value.user2Id === $i.id ? 2 : room.value.user3Id === $i.id ? 3 : 4);
const mj = shallowRef(new Mmj.PlayerGameEngine(myUserNumber.value, room.value.gameState));

const isMyTurn = computed(() => {
	return mj.value.turn === mj.value.myHouse;
});

const canHora = computed(() => {
	return Mmj.isAgarikei(mj.value.myHandTileTypes);
});

const users = computed(() => ({
	e: houseToUser('e'),
	s: houseToUser('s'),
	w: houseToUser('w'),
	n: houseToUser('n'),
}));

const selectableTiles = ref<Mmj.TileType[] | null>(null);
const ronSerifHouses = reactive<Record<Mmj.House, boolean>>({ e: false, s: false, w: false, n: false });
const ciiSerifHouses = reactive<Record<Mmj.House, boolean>>({ e: false, s: false, w: false, n: false });
const ponSerifHouses = reactive<Record<Mmj.House, boolean>>({ e: false, s: false, w: false, n: false });
const kanSerifHouses = reactive<Record<Mmj.House, boolean>>({ e: false, s: false, w: false, n: false });
const tsumoSerifHouses = reactive<Record<Mmj.House, boolean>>({ e: false, s: false, w: false, n: false });
const riichiSerifHouses = reactive<Record<Mmj.House, boolean>>({ e: false, s: false, w: false, n: false });
const iTsumoed = ref(false);
const showKyokuResults = ref(false);
const kyokuResults = ref<Record<Mmj.House, {
	yakus: {
		name: string;
		fan: number;
	}[];
	doraCount: number;
	pointDeltas: Record<Mmj.House, number>;
} | null>>({
	e: null,
	s: null,
	w: null,
	n: null,
});
const ryuukyokued = ref(false);
const startTextShowing = ref(false);

/*
if (room.value.isStarted && !room.value.isEnded) {
	useInterval(() => {
		if (room.value.isEnded) return;
		const crc32 = mj.value.calcCrc32();
		if (_DEV_) console.log('crc32', crc32);
		misskeyApi('reversi/verify', {
			roomId: room.value.id,
			crc32: crc32.toString(),
		}).then((res) => {
			if (res.desynced) {
				console.log('resynced');
				restoreRoom(res.room!);
			}
		});
	}, 10000, { immediate: false, afterMounted: true });
}
*/

const myTurnTimerRmain = ref<number>(room.value.timeLimitForEachTurn);

/*
const TIMER_INTERVAL_SEC = 3;
if (!props.room.isEnded) {
	useInterval(() => {
		if (myTurnTimerRmain.value > 0) {
			myTurnTimerRmain.value = Math.max(0, myTurnTimerRmain.value - TIMER_INTERVAL_SEC);
		}
		if (opTurnTimerRmain.value > 0) {
			opTurnTimerRmain.value = Math.max(0, opTurnTimerRmain.value - TIMER_INTERVAL_SEC);
		}

		if (iAmPlayer.value) {
			if ((isMyTurn.value && myTurnTimerRmain.value === 0) || (!isMyTurn.value && opTurnTimerRmain.value === 0)) {
			props.connection!.send('claimTimeIsUp', {});
			}
		}
	}, TIMER_INTERVAL_SEC * 1000, { immediate: false, afterMounted: true });
}
*/

function houseToUser(house: Mmj.House) {
	return mj.value.user1House === house ? room.value.user1 : mj.value.user2House === house ? room.value.user2 : mj.value.user3House === house ? room.value.user3 : room.value.user4;
}

let riichiSelect = false;
let ankanSelect = false;
let kakanSelect = false;
let ciiSelect = false;

function chooseTile(tile: Mmj.TileId, ev: MouseEvent) {
	if (!isMyTurn.value) return;

	iTsumoed.value = false;

	if (ankanSelect) {
		props.connection!.send('ankan', {
			tile: tile,
		});
		ankanSelect = false;
		selectableTiles.value = null;
		return;
	} else if (kakanSelect) {
		props.connection!.send('kakan', {
			tile: tile,
		});
		kakanSelect = false;
		selectableTiles.value = null;
		return;
	} else if (ciiSelect) {
		return;
	}

	props.connection!.send('dahai', {
		tile: tile,
		riichi: riichiSelect,
	});

	riichiSelect = false;
	selectableTiles.value = null;
}

function riichi() {
	if (!isMyTurn.value) return;

	riichiSelect = true;
	selectableTiles.value = Mmj.getTilesForRiichi(mj.value.myHandTileTypes);
	console.log(Mmj.getTilesForRiichi(mj.value.myHandTileTypes));
}

function ankan() {
	if (!isMyTurn.value) return;

	ankanSelect = true;
	selectableTiles.value = mj.value.getAnkanableTiles().map(id => mj$type(id));
}

function kakan() {
	if (!isMyTurn.value) return;

	kakanSelect = true;
	selectableTiles.value = mj.value.getKakanableTiles().map(id => mj$type(id));
}

function tsumoHora() {
	if (!isMyTurn.value) return;

	props.connection!.send('tsumoHora', {
	});
}

function ron() {
	props.connection!.send('ronHora', {
	});
}

function pon() {
	props.connection!.send('pon', {
	});
}

function cii(ev: MouseEvent) {
	const targetTile = mj.value.hoTiles[mj.value.canCii!.callee].at(-1)!;
	const patterns = Mmj.getAvailableCiiPatterns(mj.value.myHandTileTypes, mj$type(targetTile));
	os.popupMenu(patterns.map(pattern => ({
		text: pattern.join(' '),
		action: () => {
			const index = Mmj.sortTileTypes(pattern).indexOf(mj$type(targetTile));
			props.connection!.send('cii', {
				pattern: index === 0 ? 'x__' : index === 1 ? '_x_' : '__x',
			});
		},
	})), ev.currentTarget ?? ev.target);
}

function kan() {
	props.connection!.send('kan', {
	});
}

function skip() {
	mj.value.commit_nop(mj.value.myHouse);
	triggerRef(mj);

	props.connection!.send('nop', {});
}

function confirmKyokuResult() {
	props.connection!.send('confirmNextKyoku', {});
}

function onStreamDahai(log) {
	console.log('onStreamDahai', log);

	sound.playUrl('/client-assets/mahjong/dahai.mp3', {
		volume: 1,
		playbackRate: 1,
	});

	//if (log.house !== mj.value.state.turn) { // = desyncが発生している
	//	const _room = await misskeyApi('mahjong/show-room', {
	//		roomId: props.room.id,
	//	});
	//	restoreRoom(_room);
	//	return;
	//}

	mj.value.commit_dahai(log.house, log.tile, log.riichi);
	triggerRef(mj);

	riichiSerifHouses[log.house] = log.riichi;
	window.setTimeout(() => {
		riichiSerifHouses[log.house] = false;
	}, 2000);

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function onStreamTsumo(log) {
	console.log('onStreamTsumo', log);

	//if (log.house !== mj.value.state.turn) { // = desyncが発生している
	//	const _room = await misskeyApi('mahjong/show-room', {
	//		roomId: props.room.id,
	//	});
	//	restoreRoom(_room);
	//	return;
	//}

	mj.value.commit_tsumo(log.house, log.tile);
	triggerRef(mj);

	if (log.house === mj.value.myHouse) {
		iTsumoed.value = true;
	}

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function onStreamDahaiAndTsumo(log) {
	console.log('onStreamDahaiAndTsumo', log);

	//if (log.house !== mj.value.state.turn) { // = desyncが発生している
	//	const _room = await misskeyApi('mahjong/show-room', {
	//		roomId: props.room.id,
	//	});
	//	restoreRoom(_room);
	//	return;
	//}

	sound.playUrl('/client-assets/mahjong/dahai.mp3', {
		volume: 1,
		playbackRate: 1,
	});

	mj.value.commit_dahai(log.dahaiHouse, log.dahaiTile, log.riichi);
	triggerRef(mj);

	riichiSerifHouses[log.dahaiHouse] = log.riichi;
	window.setTimeout(() => {
		riichiSerifHouses[log.dahaiHouse] = false;
	}, 2000);

	window.setTimeout(() => {
		mj.value.commit_tsumo(Mmj.nextHouse(log.dahaiHouse), log.tsumoTile);
		triggerRef(mj);

		if (Mmj.nextHouse(log.dahaiHouse) === mj.value.myHouse) {
			iTsumoed.value = true;
		}
	}, 100);

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function onStreamPonned(log) {
	console.log('onStreamPonned', log);

	//if (log.house !== mj.value.state.turn) { // = desyncが発生している
	//	const _room = await misskeyApi('mahjong/show-room', {
	//		roomId: props.room.id,
	//	});
	//	restoreRoom(_room);
	//	return;
	//}

	mj.value.commit_pon(log.caller, log.callee, log.tiles);
	triggerRef(mj);

	ponSerifHouses[log.caller] = true;
	window.setTimeout(() => {
		ponSerifHouses[log.caller] = false;
	}, 2000);

	myTurnTimerRmain.value = room.value.timeLimitForEachTurn;
}

function onStreamKanned(log) {
	console.log('onStreamKanned', log);

	mj.value.commit_kan(log.caller, log.callee, log.tiles, log.rinsyan);
	triggerRef(mj);

	kanSerifHouses[log.caller] = true;
	window.setTimeout(() => {
		kanSerifHouses[log.caller] = false;
	}, 2000);
}

function onStreamKakanned(log) {
	console.log('onStreamKakanned', log);

	mj.value.commit_kakan(log.house, log.tiles, log.rinsyan);
	triggerRef(mj);

	kanSerifHouses[log.caller] = true;
	window.setTimeout(() => {
		kanSerifHouses[log.caller] = false;
	}, 2000);
}

function onStreamAnkanned(log) {
	console.log('onStreamAnkanned', log);

	mj.value.commit_ankan(log.house, log.tiles, log.rinsyan);
	triggerRef(mj);

	kanSerifHouses[log.caller] = true;
	window.setTimeout(() => {
		kanSerifHouses[log.caller] = false;
	}, 2000);
}

function onStreamCiied(log) {
	console.log('onStreamCiied', log);

	mj.value.commit_cii(log.caller, log.callee, log.tiles);
	triggerRef(mj);

	ciiSerifHouses[log.caller] = true;
	window.setTimeout(() => {
		ciiSerifHouses[log.caller] = false;
	}, 2000);
}

function onStreamRonned(log) {
	console.log('onStreamRonned', log);

	const res = mj.value.commit_ronHora(log.callers, log.callee, log.handTiles);
	triggerRef(mj);

	kyokuResults.value = res;

	window.setTimeout(() => {
		showKyokuResults.value = true;
	}, 1500);

	for (const caller of log.callers) {
		ronSerifHouses[caller] = true;

		window.setTimeout(() => {
			ronSerifHouses[caller] = false;
		}, 2000);
	}

	console.log('ronned', res);
}

function onStreamTsumoHora(log) {
	console.log('onStreamTsumoHora', log);

	const res = mj.value.commit_tsumoHora(log.house, log.handTiles, log.tsumoTile);
	triggerRef(mj);

	kyokuResults.value[log.house] = res;

	window.setTimeout(() => {
		showKyokuResults.value = true;
	}, 1500);

	tsumoSerifHouses[log.house] = true;
	window.setTimeout(() => {
		tsumoSerifHouses[log.house] = false;
	}, 2000);

	console.log('tsumohora', res);
}

function onStreamRyuukyoku(log) {
	console.log('onStreamRyuukyoku', log);

	ryuukyokued.value = true;

	window.setTimeout(() => {
		showKyokuResults.value = true;
	}, 1500);
}

function onStreamNextKyoku(log) {
	console.log('onStreamNextKyoku', log);

	const res = mj.value.commit_nextKyoku(log.state);
	triggerRef(mj);

	iTsumoed.value = false;
	showKyokuResults.value = false;
	kyokuResults.value = {
		e: null,
		s: null,
		w: null,
		n: null,
	};
	ryuukyokued.value = false;
}

function restoreRoom(_room) {
	room.value = deepClone(_room);

	mj.value = new Mmj.PlayerGameEngine(myUserNumber, room.value.gameState);
}

onMounted(() => {
	if (props.connection != null) {
		props.connection.on('dahai', onStreamDahai);
		props.connection.on('tsumo', onStreamTsumo);
		props.connection.on('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.on('ponned', onStreamPonned);
		props.connection.on('kanned', onStreamKanned);
		props.connection.on('kakanned', onStreamKakanned);
		props.connection.on('ankanned', onStreamAnkanned);
		props.connection.on('ciied', onStreamCiied);
		props.connection.on('ronned', onStreamRonned);
		props.connection.on('tsumoHora', onStreamTsumoHora);
		props.connection.on('ryuukyoku', onStreamRyuukyoku);
		props.connection.on('nextKyoku', onStreamNextKyoku);
	}
});

onActivated(() => {
	if (props.connection != null) {
		props.connection.on('dahai', onStreamDahai);
		props.connection.on('tsumo', onStreamTsumo);
		props.connection.on('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.on('ponned', onStreamPonned);
		props.connection.on('kanned', onStreamKanned);
		props.connection.on('kakanned', onStreamKakanned);
		props.connection.on('ankanned', onStreamAnkanned);
		props.connection.on('ciied', onStreamCiied);
		props.connection.on('ronned', onStreamRonned);
		props.connection.on('tsumoHora', onStreamTsumoHora);
		props.connection.on('ryuukyoku', onStreamRyuukyoku);
		props.connection.on('nextKyoku', onStreamNextKyoku);
	}
});

onDeactivated(() => {
	if (props.connection != null) {
		props.connection.off('dahai', onStreamDahai);
		props.connection.off('tsumo', onStreamTsumo);
		props.connection.off('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.off('ponned', onStreamPonned);
		props.connection.off('kanned', onStreamKanned);
		props.connection.off('kakanned', onStreamKakanned);
		props.connection.off('ankanned', onStreamAnkanned);
		props.connection.off('ciied', onStreamCiied);
		props.connection.off('ronned', onStreamRonned);
		props.connection.off('tsumoHora', onStreamTsumoHora);
		props.connection.off('ryuukyoku', onStreamRyuukyoku);
		props.connection.off('nextKyoku', onStreamNextKyoku);
	}
});

onUnmounted(() => {
	if (props.connection != null) {
		props.connection.off('dahai', onStreamDahai);
		props.connection.off('tsumo', onStreamTsumo);
		props.connection.off('dahaiAndTsumo', onStreamDahaiAndTsumo);
		props.connection.off('ponned', onStreamPonned);
		props.connection.off('kanned', onStreamKanned);
		props.connection.off('kakanned', onStreamKakanned);
		props.connection.off('ankanned', onStreamAnkanned);
		props.connection.off('ciied', onStreamCiied);
		props.connection.off('ronned', onStreamRonned);
		props.connection.off('tsumoHora', onStreamTsumoHora);
		props.connection.off('ryuukyoku', onStreamRyuukyoku);
		props.connection.off('nextKyoku', onStreamNextKyoku);
	}
});
</script>

<style lang="scss" module>
@keyframes shine {
	0% { translate: -30px; }
	100% { translate: -130px; }
}

.transition_serif_enterActive,
.transition_serif_leaveActive {
	transition: opacity 0.1s linear, scale 0.1s linear;
}
.transition_serif_enterFrom {
	scale: 1.25;
	opacity: 0;
}
.transition_serif_leaveTo {
	opacity: 0;
}

.root {
	background: #3C7A43;
	background-image: url('/client-assets/mahjong/bg.jpg');
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	padding: 30px;
}

.taku {
	position: relative;
	width: 100%;
	height: 100%;
	max-width: 600px;
	min-height: 600px;
	margin: auto;
	box-sizing: border-box;
}

.kyokuResult {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 1000;
	width: 100%;
	height: 100%;
	max-width: 800px;
	margin: auto;
	padding: 30px;
	box-sizing: border-box;
	background: #0009;
	color: #fff;
}

.centerPanel {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: grid;
	place-items: center;
	width: 150px;
	height: 150px;
	margin: auto;
	scale: 0.9;
	background: #333;
	border: solid 1px #888;
	border-radius: 10px;
	box-shadow: 0 4px 10px #000a;
}
.centerPanelTickerToi {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	rotate: 180deg;
}
.centerPanelTickerKami {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	rotate: 90deg;
}
.centerPanelTickerSimo {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	rotate: -90deg;
}
.centerPanelTickerMe {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
}
.centerPanelHouse {
	font-weight: bold;
}
.centerPanelPoint {
	margin-left: 10px;
}
.centerPanelIndicatorContainerToi {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	rotate: 180deg;
}
.centerPanelIndicatorContainerKami {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	rotate: 90deg;
}
.centerPanelIndicatorContainerSimo {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	rotate: -90deg;
}
.centerPanelIndicatorContainerMe {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	margin: auto;
}
.centerPanelIndicator {
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	width: 100px;
	height: 10px;
	border-radius: 999px;
}
.centerPanelIndicatorIndicated {
	background: #ff0;
}

.handTilesOfToimen {
	position: absolute;
	top: 0;
	right: 40px;
}
.handTileImgOfToimen {
	display: inline-block;
	vertical-align: bottom;
	width: 32px;
}

.handTilesOfKamitya {
	position: absolute;
	top: 80px;
	left: 0;
}

.handTilesOfSimotya {
	position: absolute;
	bottom: 80px;
	right: 0;
}

.handTilesOfMe {
	position: absolute;
	bottom: 0;
	left: 0px;
}

.huroTilesOfMe {
	position: absolute;
	bottom: 0;
	right: 80px;
}

.huroTilesOfToimen {
	position: absolute;
	top: 0;
	left: 80px;
}

.huroTilesOfKamitya {
	position: absolute;
	top: 80px;
	left: 0;
}

.huroTilesOfSimotya {
	position: absolute;
	top: 80px;
	right: 0;
}

.hoTilesContainer {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	transform-origin: center;
	scale: 0.8;
}

.hoTilesContainerOfToimen {
	position: absolute;
	bottom: calc(50% + 125px);
	left: 0;
	right: 0;
	margin: auto;
	width: min-content;
}
.hoTilesOfToimen {
	rotate: 180deg;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
}

.hoTilesContainerOfKamitya {
	position: absolute;
	right: calc(50% + 125px);
	top: 0;
	bottom: 0;
	margin: auto;
	height: min-content;
}
.hoTilesOfKamitya {
	rotate: 90deg;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
	grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
	aspect-ratio: 1;
}

.hoTilesContainerOfSimotya {
	position: absolute;
	left: calc(50% + 125px);
	top: 0;
	bottom: 0;
	margin: auto;
	height: min-content;
}
.hoTilesOfSimotya {
	rotate: -90deg;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
	grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
	aspect-ratio: 1;
}

.hoTilesContainerOfMe {
	position: absolute;
	top: calc(50% + 125px);
	left: 0;
	right: 0;
	margin: auto;
	width: min-content;
}
.hoTilesOfMe {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
}

.playersContainer {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 100;
	pointer-events: none;
}
.player {
	position: absolute;
	margin: auto;
	width: 180px;
	height: min-content;
	padding: 10px;
	box-sizing: border-box;
	background: #0009;
	color: #fff;
	border-radius: 5px;
	font-size: 90%;
}
.playerOfToimen {
	top: 0;
	left: 0;
	right: 0;
}
.playerOfKamitya {
	top: 0;
	left: 0;
	bottom: 0;
}
.playerOfSimotya {
	top: 0;
	right: 0;
	bottom: 0;
}

.serifContainer {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 100;
	pointer-events: none;
}
.serifContainerOfKamitya {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	margin: auto;
	width: 200px;
	height: min-content;
}
.serifContainerOfSimotya {
	position: absolute;
	top: 0;
	bottom: 0;
	right: 0;
	margin: auto;
	width: 200px;
	height: min-content;
}
.serifContainerOfToimen {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	margin: auto;
	width: 200px;
	height: min-content;
}
.serifContainerOfMe {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	margin: auto;
	width: 200px;
	height: min-content;
}

.ryuukyokuContainer {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	width: 200px;
	height: min-content;
	margin: auto;
	z-index: 100;
	pointer-events: none;
}

.sideTile {
	margin-bottom: -26px;
}

.hoTile {
	position: relative;
	display: inline-block;
	margin-bottom: -8px;
}

.actions {
	position: absolute;
	bottom: 80px;
	right: 50px;
}
</style>
