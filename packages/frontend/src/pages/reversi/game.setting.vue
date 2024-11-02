<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<MkSpacer :contentMax="600">
		<div style="text-align: center;"><b><MkUserName :user="game.user1"/></b> vs <b><MkUserName :user="game.user2"/></b></div>

		<div :class="{ [$style.disallow]: isReady }">
			<div class="_gaps" :class="{ [$style.disallowInner]: isReady }">
				<div style="font-size: 1.5em; text-align: center;">{{ i18n.ts._reversi.gameSettings }}</div>

				<template v-if="game.noIrregularRules">
					<div>{{ i18n.ts._reversi.disallowIrregularRules }}</div>
				</template>
				<template v-else>
					<div class="_panel">
						<div style="display: flex; align-items: center; padding: 16px; border-bottom: solid 1px var(--MI_THEME-divider);">
							<div>{{ mapName }}</div>
							<MkButton style="margin-left: auto;" @click="chooseMap">{{ i18n.ts._reversi.chooseBoard }}</MkButton>
						</div>

						<div style="padding: 16px;">
							<div v-if="game.map == null"><i class="ti ti-dice"></i></div>
							<div v-else :class="$style.board" :style="{ 'grid-template-rows': `repeat(${ game.map.length }, 1fr)`, 'grid-template-columns': `repeat(${ game.map[0].length }, 1fr)` }">
								<div v-for="(x, i) in game.map.join('')" :class="[$style.boardCell, { [$style.boardCellNone]: x == ' ' }]" @click="onMapCellClick(i, x)">
									<i v-if="x === 'b' || x === 'w'" style="pointer-events: none; user-select: none;" :class="x === 'b' ? 'ti ti-circle-filled' : 'ti ti-circle'"></i>
								</div>
							</div>
						</div>
					</div>

					<MkFolder :defaultOpen="true">
						<template #label>{{ i18n.ts._reversi.blackOrWhite }}</template>

						<MkRadios v-model="game.bw">
							<option value="random">{{ i18n.ts.random }}</option>
							<option :value="'1'">
								<I18n :src="i18n.ts._reversi.blackIs" tag="span">
									<template #name>
										<b><MkUserName :user="game.user1"/></b>
									</template>
								</I18n>
							</option>
							<option :value="'2'">
								<I18n :src="i18n.ts._reversi.blackIs" tag="span">
									<template #name>
										<b><MkUserName :user="game.user2"/></b>
									</template>
								</I18n>
							</option>
						</MkRadios>
					</MkFolder>

					<MkFolder :defaultOpen="true">
						<template #label>{{ i18n.ts._reversi.timeLimitForEachTurn }}</template>
						<template #suffix>{{ game.timeLimitForEachTurn }}{{ i18n.ts._time.second }}</template>

						<MkRadios v-model="game.timeLimitForEachTurn">
							<option :value="5">5{{ i18n.ts._time.second }}</option>
							<option :value="10">10{{ i18n.ts._time.second }}</option>
							<option :value="30">30{{ i18n.ts._time.second }}</option>
							<option :value="60">60{{ i18n.ts._time.second }}</option>
							<option :value="90">90{{ i18n.ts._time.second }}</option>
							<option :value="120">120{{ i18n.ts._time.second }}</option>
							<option :value="180">180{{ i18n.ts._time.second }}</option>
							<option :value="3600">3600{{ i18n.ts._time.second }}</option>
						</MkRadios>
					</MkFolder>

					<MkFolder :defaultOpen="true">
						<template #label>{{ i18n.ts._reversi.rules }}</template>

						<div class="_gaps_s">
							<MkSwitch v-model="game.isLlotheo" @update:modelValue="updateSettings('isLlotheo')">{{ i18n.ts._reversi.isLlotheo }}</MkSwitch>
							<MkSwitch v-model="game.loopedBoard" @update:modelValue="updateSettings('loopedBoard')">{{ i18n.ts._reversi.loopedMap }}</MkSwitch>
							<MkSwitch v-model="game.canPutEverywhere" @update:modelValue="updateSettings('canPutEverywhere')">{{ i18n.ts._reversi.canPutEverywhere }}</MkSwitch>
						</div>
					</MkFolder>
				</template>
			</div>
		</div>
	</MkSpacer>
	<template #footer>
		<div :class="$style.footer">
			<MkSpacer :contentMax="700" :marginMin="16" :marginMax="16">
				<div style="text-align: center;" class="_gaps_s">
					<div v-if="opponentHasSettingsChanged" style="color: var(--MI_THEME-warn);">{{ i18n.ts._reversi.opponentHasSettingsChanged }}</div>
					<div>
						<template v-if="isReady && isOpReady">{{ i18n.ts._reversi.thisGameIsStartedSoon }}<MkEllipsis/></template>
						<template v-if="isReady && !isOpReady">{{ i18n.ts._reversi.waitingForOther }}<MkEllipsis/></template>
						<template v-if="!isReady && isOpReady">{{ i18n.ts._reversi.waitingForMe }}</template>
						<template v-if="!isReady && !isOpReady">{{ i18n.ts._reversi.waitingBoth }}<MkEllipsis/></template>
					</div>
					<div class="_buttonsCenter">
						<MkButton rounded danger @click="cancel">{{ i18n.ts.cancel }}</MkButton>
						<MkButton v-if="!isReady" rounded primary @click="ready">{{ i18n.ts._reversi.ready }}</MkButton>
						<MkButton v-if="isReady" rounded @click="unready">{{ i18n.ts._reversi.cancelReady }}</MkButton>
					</div>
					<div>
						<MkSwitch v-model="shareWhenStart">{{ i18n.ts._reversi.shareToTlTheGameWhenStart }}</MkSwitch>
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
import * as Reversi from 'misskey-reversi';
import { i18n } from '@/i18n.js';
import { signinRequired } from '@/account.js';
import { deepClone } from '@/scripts/clone.js';
import MkButton from '@/components/MkButton.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os.js';
import type { MenuItem } from '@/types/menu.js';
import { useRouter } from '@/router/supplier.js';

const $i = signinRequired();

const router = useRouter();

const mapCategories = Array.from(new Set(Object.values(Reversi.maps).map(x => x.category)));

const props = defineProps<{
	game: Misskey.entities.ReversiGameDetailed;
	connection: Misskey.ChannelConnection<Misskey.Channels['reversiGame']>;
}>();

const shareWhenStart = defineModel<boolean>('shareWhenStart', { default: false });

const game = ref<Misskey.entities.ReversiGameDetailed>(deepClone(props.game));

const mapName = computed(() => {
	if (game.value.map == null) return 'Random';
	const found = Object.values(Reversi.maps).find(x => x.data.join('') === game.value.map.join(''));
	return found ? found.name! : '-Custom-';
});
const isReady = computed(() => {
	if (game.value.user1Id === $i.id && game.value.user1Ready) return true;
	if (game.value.user2Id === $i.id && game.value.user2Ready) return true;
	return false;
});
const isOpReady = computed(() => {
	if (game.value.user1Id !== $i.id && game.value.user1Ready) return true;
	if (game.value.user2Id !== $i.id && game.value.user2Ready) return true;
	return false;
});

const opponentHasSettingsChanged = ref(false);

watch(() => game.value.bw, () => {
	updateSettings('bw');
});

watch(() => game.value.timeLimitForEachTurn, () => {
	updateSettings('timeLimitForEachTurn');
});

function chooseMap(ev: MouseEvent) {
	const menu: MenuItem[] = [];

	for (const c of mapCategories) {
		const maps = Object.values(Reversi.maps).filter(x => x.category === c);
		if (maps.length === 0) continue;
		if (c != null) {
			menu.push({
				type: 'label',
				text: c,
			});
		}
		for (const m of maps) {
			menu.push({
				text: m.name!,
				action: () => {
					game.value.map = m.data;
					updateSettings('map');
				},
			});
		}
	}

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

async function cancel() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.areYouSure,
	});
	if (canceled) return;

	props.connection.send('cancel', {});

	router.push('/reversi');
}

function ready() {
	props.connection.send('ready', true);
	opponentHasSettingsChanged.value = false;
}

function unready() {
	props.connection.send('ready', false);
}

function onChangeReadyStates(states) {
	game.value.user1Ready = states.user1;
	game.value.user2Ready = states.user2;
}

function updateSettings(key: typeof Misskey.reversiUpdateKeys[number]) {
	props.connection.send('updateSettings', {
		key: key,
		value: game.value[key],
	});
}

function onUpdateSettings<K extends typeof Misskey.reversiUpdateKeys[number]>({ userId, key, value }: { userId: string; key: K; value: Misskey.entities.ReversiGameDetailed[K]; }) {
	if (userId === $i.id) return;
	if (game.value[key] === value) return;
	game.value[key] = value;
	if (isReady.value) {
		opponentHasSettingsChanged.value = true;
		unready();
	}
}

function onMapCellClick(pos: number, pixel: string) {
	const x = pos % game.value.map[0].length;
	const y = Math.floor(pos / game.value.map[0].length);
	const newPixel =
		pixel === ' ' ? '-' :
		pixel === '-' ? 'b' :
		pixel === 'b' ? 'w' :
		' ';
	const line = game.value.map[y].split('');
	line[x] = newPixel;
	game.value.map[y] = line.join('');
	updateSettings('map');
}

props.connection.on('changeReadyStates', onChangeReadyStates);
props.connection.on('updateSettings', onUpdateSettings);

onUnmounted(() => {
	props.connection.off('changeReadyStates', onChangeReadyStates);
	props.connection.off('updateSettings', onUpdateSettings);
});
</script>

<style lang="scss" module>
.disallow {
	cursor: not-allowed;
}
.disallowInner {
	pointer-events: none;
	user-select: none;
	opacity: 0.7;
}

.board {
	display: grid;
	grid-gap: 4px;
	width: 300px;
	height: 300px;
	margin: 0 auto;
	color: var(--MI_THEME-fg);
}

.boardCell {
	display: grid;
	place-items: center;
	background: transparent;
	border: solid 2px var(--MI_THEME-divider);
	border-radius: 6px;
	overflow: clip;
	cursor: pointer;
}
.boardCellNone {
	border-color: transparent;
}

.footer {
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	background: var(--MI_THEME-acrylicBg);
	border-top: solid 0.5px var(--MI_THEME-divider);
}
</style>
