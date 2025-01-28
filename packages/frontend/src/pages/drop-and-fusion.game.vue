<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="800">
	<div :class="$style.root">
		<div v-if="!gameLoaded" :class="$style.loadingScreen">
			<div>{{ i18n.ts.loading }}<MkEllipsis/></div>
		</div>
		<!-- ↓に対してTransitionコンポーネントを使うと何故かkeyを指定していてもキャッシュが効かず様々なコンポーネントが都度再評価されてパフォーマンスが低下する -->
		<div v-show="gameLoaded" class="_gaps_s">
			<div v-if="readyGo === 'ready'" :class="$style.readyGo_bg">
			</div>
			<Transition
				:enterActiveClass="$style.transition_zoom_enterActive"
				:leaveActiveClass="$style.transition_zoom_leaveActive"
				:enterFromClass="$style.transition_zoom_enterFrom"
				:leaveToClass="$style.transition_zoom_leaveTo"
				:moveClass="$style.transition_zoom_move"
				mode="default"
			>
				<div v-if="readyGo === 'ready'" :class="$style.readyGo_ready">
					<img src="/client-assets/drop-and-fusion/ready.png" :class="$style.readyGo_img"/>
				</div>
				<div v-else-if="readyGo === 'go'" :class="$style.readyGo_go">
					<img src="/client-assets/drop-and-fusion/go.png" :class="$style.readyGo_img"/>
				</div>
			</Transition>

			<div :class="$style.header">
				<div class="_woodenFrame" :class="[$style.headerTitle]">
					<div class="_woodenFrameInner">
						<b>{{ i18n.ts.bubbleGame }}</b>
						<div>- {{ gameMode.toUpperCase() }} -</div>
					</div>
				</div>
				<div class="_woodenFrame _woodenFrameH">
					<div class="_woodenFrameInner">
						<MkButton inline small @click="hold">{{ i18n.ts._bubbleGame.hold }}</MkButton>
						<img v-if="holdingStock" :src="getTextureImageUrl(holdingStock.mono)" style="width: 32px; margin-left: 8px; vertical-align: bottom;"/>
					</div>
					<div class="_woodenFrameInner" :class="$style.stock" style="text-align: center;">
						<TransitionGroup
							:enterActiveClass="$style.transition_stock_enterActive"
							:leaveActiveClass="$style.transition_stock_leaveActive"
							:enterFromClass="$style.transition_stock_enterFrom"
							:leaveToClass="$style.transition_stock_leaveTo"
							:moveClass="$style.transition_stock_move"
						>
							<img v-for="x in stock" :key="x.id" :src="getTextureImageUrl(x.mono)" style="width: 32px; vertical-align: bottom;"/>
						</TransitionGroup>
					</div>
				</div>
			</div>

			<div ref="containerEl" :class="[$style.gameContainer, { [$style.gameOver]: isGameOver && !replaying }]" @contextmenu.stop.prevent @click.stop.prevent="onClick" @touchmove.stop.prevent="onTouchmove" @touchend="onTouchend" @mousemove="onMousemove">
				<img v-if="defaultStore.state.darkMode" src="/client-assets/drop-and-fusion/frame-dark.svg" :class="$style.mainFrameImg"/>
				<img v-else src="/client-assets/drop-and-fusion/frame-light.svg" :class="$style.mainFrameImg"/>
				<canvas ref="canvasEl" :class="$style.canvas"/>
				<Transition
					:enterActiveClass="$style.transition_combo_enterActive"
					:leaveActiveClass="$style.transition_combo_leaveActive"
					:enterFromClass="$style.transition_combo_enterFrom"
					:leaveToClass="$style.transition_combo_leaveTo"
					:moveClass="$style.transition_combo_move"
				>
					<div v-show="combo > 1" :class="$style.combo" :style="{ fontSize: `${100 + ((comboPrev - 2) * 15)}%` }">{{ comboPrev }} Chain!</div>
				</Transition>
				<div v-if="!isGameOver && !replaying && readyGo !== 'ready'" :class="$style.dropperContainer" :style="{ left: dropperX + 'px' }">
					<!--<img v-if="currentPick" src="/client-assets/drop-and-fusion/dropper.png" :class="$style.dropper" :style="{ left: dropperX + 'px' }"/>-->
					<Transition
						:enterActiveClass="$style.transition_picked_enterActive"
						:leaveActiveClass="$style.transition_picked_leaveActive"
						:enterFromClass="$style.transition_picked_enterFrom"
						:leaveToClass="$style.transition_picked_leaveTo"
						:moveClass="$style.transition_picked_move"
						mode="out-in"
					>
						<img v-if="currentPick" :key="currentPick.id" :src="getTextureImageUrl(currentPick.mono)" :class="$style.currentMono" :style="{ marginBottom: -((currentPick?.mono.sizeY * viewScale) / 2) + 'px', left: -((currentPick?.mono.sizeX * viewScale) / 2) + 'px', width: `${currentPick?.mono.sizeX * viewScale}px` }"/>
					</Transition>
					<template v-if="dropReady && currentPick">
						<img src="/client-assets/drop-and-fusion/drop-arrow.svg" :class="$style.currentMonoArrow"/>
						<div :class="$style.dropGuide"/>
					</template>
				</div>
				<div v-if="isGameOver && !replaying" :class="$style.gameOverLabel">
					<div class="_gaps_s">
						<img src="/client-assets/drop-and-fusion/gameover.png" style="width: 200px; max-width: 100%; display: block; margin: auto; margin-bottom: -5px;"/>
						<div>{{ i18n.ts._bubbleGame._score.score }}: <MkNumber :value="score"/>{{ getScoreUnit(gameMode) }}</div>
						<div>{{ i18n.ts._bubbleGame._score.maxChain }}: <MkNumber :value="maxCombo"/></div>
						<div v-if="gameMode === 'yen'">
							{{ i18n.ts._bubbleGame._score.scoreYen }}:
							<I18n :src="i18n.ts._bubbleGame._score.yen" tag="b">
								<template #yen><MkNumber :value="yenTotal ?? score"/></template>
							</I18n>
						</div>
						<I18n v-if="gameMode === 'sweets'" :src="i18n.ts._bubbleGame._score.scoreSweets" tag="div">
							<template #onigiriQtyWithUnit>
								<I18n :src="i18n.ts._bubbleGame._score.estimatedQty" tag="b">
									<template #qty><MkNumber :value="score / 130"/></template>
								</I18n>
							</template>
						</I18n>
					</div>
				</div>
				<div v-if="replaying" :class="$style.replayIndicator"><span :class="$style.replayIndicatorText"><i class="ti ti-player-play"></i> {{ i18n.ts.replaying }}</span></div>
			</div>

			<div v-if="replaying" class="_woodenFrame">
				<div class="_woodenFrameInner">
					<div style="background: #0004;">
						<div style="height: 10px; background: var(--MI_THEME-accent); will-change: width;" :style="{ width: `${(currentFrame / endedAtFrame) * 100}%` }"></div>
					</div>
				</div>
				<div class="_woodenFrameInner">
					<div class="_buttonsCenter">
						<MkButton @click="endReplay"><i class="ti ti-player-stop"></i> {{ i18n.ts.endReplay }}</MkButton>
						<MkButton :primary="replayPlaybackRate === 4" @click="replayPlaybackRate = replayPlaybackRate === 4 ? 1 : 4"><i class="ti ti-player-track-next"></i> x4</MkButton>
						<MkButton :primary="replayPlaybackRate === 16" @click="replayPlaybackRate = replayPlaybackRate === 16 ? 1 : 16"><i class="ti ti-player-track-next"></i> x16</MkButton>
					</div>
				</div>
			</div>

			<div v-if="isGameOver" class="_woodenFrame">
				<div class="_woodenFrameInner">
					<div class="_buttonsCenter">
						<MkButton primary rounded @click="backToTitle">{{ i18n.ts.backToTitle }}</MkButton>
						<MkButton primary rounded @click="replay">{{ i18n.ts.showReplay }}</MkButton>
						<MkButton primary rounded @click="share">{{ i18n.ts.share }}</MkButton>
						<MkButton rounded @click="exportLog">{{ i18n.ts.copyReplayData }}</MkButton>
					</div>
				</div>
			</div>

			<div style="display: flex;">
				<div class="_woodenFrame" style="flex: 1; margin-right: 10px;">
					<div class="_woodenFrameInner">
						<div>{{ i18n.ts._bubbleGame._score.score }}: <MkNumber :value="score"/>{{ getScoreUnit(gameMode) }}</div>
						<div>{{ i18n.ts._bubbleGame._score.highScore }}: <b v-if="highScore"><MkNumber :value="highScore"/>{{ getScoreUnit(gameMode) }}</b><b v-else>-</b></div>
						<div v-if="gameMode === 'yen'">
							{{ i18n.ts._bubbleGame._score.scoreYen }}:
							<I18n :src="i18n.ts._bubbleGame._score.yen" tag="b">
								<template #yen><MkNumber :value="yenTotal ?? score"/></template>
							</I18n>
						</div>
					</div>
				</div>
				<div class="_woodenFrame" style="margin-left: auto;">
					<div class="_woodenFrameInner" style="text-align: center;">
						<div @click="showConfig = !showConfig"><i class="ti ti-settings"></i></div>
					</div>
				</div>
			</div>

			<div v-if="showConfig" class="_woodenFrame">
				<div class="_woodenFrameInner">
					<div class="_gaps">
						<MkRange v-model="bgmVolume" :min="0" :max="1" :step="0.01" :textConverter="(v) => `${Math.floor(v * 100)}%`" :continuousUpdate="true" @dragEnded="(v) => updateSettings('bgmVolume', v)">
							<template #label>BGM {{ i18n.ts.volume }}</template>
						</MkRange>
						<MkRange v-model="sfxVolume" :min="0" :max="1" :step="0.01" :textConverter="(v) => `${Math.floor(v * 100)}%`" :continuousUpdate="true" @dragEnded="(v) => updateSettings('sfxVolume', v)">
							<template #label>{{ i18n.ts.sfx }} {{ i18n.ts.volume }}</template>
						</MkRange>
					</div>
				</div>
			</div>

			<div class="_woodenFrame">
				<div class="_woodenFrameInner">
					<div>FUSION RECIPE</div>
					<div>
						<div v-for="(mono, i) in game.monoDefinitions.sort((a, b) => a.level - b.level)" :key="mono.id" style="display: inline-block;">
							<img :src="getTextureImageUrl(mono)" style="width: 32px; vertical-align: bottom;"/>
							<div v-if="i < game.monoDefinitions.length - 1" style="display: inline-block; margin-left: 4px; vertical-align: bottom;"><i class="ti ti-arrow-big-right"></i></div>
						</div>
					</div>
				</div>
			</div>

			<div class="_woodenFrame">
				<div class="_woodenFrameInner">
					<MkButton v-if="!isGameOver && !replaying" full danger @click="surrender">{{ i18n.ts.surrender }}</MkButton>
					<MkButton v-else full @click="restart">{{ i18n.ts.gameRetry }}</MkButton>
				</div>
			</div>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed, onDeactivated, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import * as Matter from 'matter-js';
import * as Misskey from 'misskey-js';
import { DropAndFusionGame } from 'misskey-bubble-game';
import type { Mono } from 'misskey-bubble-game';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import * as os from '@/os.js';
import MkNumber from '@/components/MkNumber.vue';
import MkPlusOneEffect from '@/components/MkPlusOneEffect.vue';
import MkButton from '@/components/MkButton.vue';
import { claimAchievement } from '@/scripts/achievements.js';
import { defaultStore } from '@/store.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { useInterval } from '@@/js/use-interval.js';
import { apiUrl } from '@@/js/config.js';
import { $i } from '@/account.js';
import * as sound from '@/scripts/sound.js';
import MkRange from '@/components/MkRange.vue';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';

type FrontendMonoDefinition = {
	id: string;
	img: string;
	imgSizeX: number;
	imgSizeY: number;
	spriteScale: number;
	sfxPitch: number;
};

const NORAML_MONOS: FrontendMonoDefinition[] = [{
	id: '9377076d-c980-4d83-bdaf-175bc58275b7',
	sfxPitch: 0.25,
	img: '/client-assets/drop-and-fusion/normal_monos/exploding_head.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: 'be9f38d2-b267-4b1a-b420-904e22e80568',
	sfxPitch: 0.5,
	img: '/client-assets/drop-and-fusion/normal_monos/face_with_symbols_on_mouth.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: 'beb30459-b064-4888-926b-f572e4e72e0c',
	sfxPitch: 0.75,
	img: '/client-assets/drop-and-fusion/normal_monos/cold_face.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: 'feab6426-d9d8-49ae-849c-048cdbb6cdf0',
	sfxPitch: 1,
	img: '/client-assets/drop-and-fusion/normal_monos/zany_face.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: 'd6d8fed6-6d18-4726-81a1-6cf2c974df8a',
	sfxPitch: 1.5,
	img: '/client-assets/drop-and-fusion/normal_monos/pleading_face.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '249c728e-230f-4332-bbbf-281c271c75b2',
	sfxPitch: 2,
	img: '/client-assets/drop-and-fusion/normal_monos/face_with_open_mouth.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '23d67613-d484-4a93-b71e-3e81b19d6186',
	sfxPitch: 2.5,
	img: '/client-assets/drop-and-fusion/normal_monos/smiling_face_with_sunglasses.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '3cbd0add-ad7d-4685-bad0-29f6dddc0b99',
	sfxPitch: 3,
	img: '/client-assets/drop-and-fusion/normal_monos/grinning_squinting_face.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '8f86d4f4-ee02-41bf-ad38-1ce0ae457fb5',
	sfxPitch: 3.5,
	img: '/client-assets/drop-and-fusion/normal_monos/smiling_face_with_hearts.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '64ec4add-ce39-42b4-96cb-33908f3f118d',
	sfxPitch: 4,
	img: '/client-assets/drop-and-fusion/normal_monos/heart_suit.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}];

const YEN_MONOS: FrontendMonoDefinition[] = [{
	id: '880f9bd9-802f-4135-a7e1-fd0e0331f726',
	sfxPitch: 0.25,
	img: '/client-assets/drop-and-fusion/yen_monos/10000yen.png',
	imgSizeX: 512,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: 'e807beb6-374a-4314-9cc2-aa5f17d96b6b',
	sfxPitch: 0.5,
	img: '/client-assets/drop-and-fusion/yen_monos/5000yen.png',
	imgSizeX: 512,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: '033445b7-8f90-4fc9-beca-71a9e87cb530',
	sfxPitch: 0.75,
	img: '/client-assets/drop-and-fusion/yen_monos/2000yen.png',
	imgSizeX: 512,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: '410a09ec-5f7f-46f6-b26f-cbca4ccbd091',
	sfxPitch: 1,
	img: '/client-assets/drop-and-fusion/yen_monos/1000yen.png',
	imgSizeX: 512,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: '2aae82bc-3fa4-49ad-a6b5-94d888e809f5',
	sfxPitch: 1.5,
	img: '/client-assets/drop-and-fusion/yen_monos/500yen.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: 'a619bd67-d08f-4cc0-8c7e-c8072a4950cd',
	sfxPitch: 2,
	img: '/client-assets/drop-and-fusion/yen_monos/100yen.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: 'c1c5d8e4-17d6-4455-befd-12154d731faa',
	sfxPitch: 2.5,
	img: '/client-assets/drop-and-fusion/yen_monos/50yen.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: '7082648c-e428-44c4-887a-25c07a8ebdd5',
	sfxPitch: 3,
	img: '/client-assets/drop-and-fusion/yen_monos/10yen.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: '0d8d40d5-e6e0-4d26-8a95-b8d842363379',
	sfxPitch: 3.5,
	img: '/client-assets/drop-and-fusion/yen_monos/5yen.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 0.97,
}, {
	id: '9dec1b38-d99d-40de-8288-37367b983d0d',
	sfxPitch: 4,
	img: '/client-assets/drop-and-fusion/yen_monos/1yen.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 0.97,
}];

const SQUARE_MONOS: FrontendMonoDefinition[] = [{
	id: 'f75fd0ba-d3d4-40a4-9712-b470e45b0525',
	sfxPitch: 0.25,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_10.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '7b70f4af-1c01-45fd-af72-61b1f01e03d1',
	sfxPitch: 0.5,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_9.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '41607ef3-b6d6-4829-95b6-3737bf8bb956',
	sfxPitch: 0.75,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_8.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '8a8310d2-0374-460f-bb50-ca9cd3ee3416',
	sfxPitch: 1,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_7.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '1092e069-fe1a-450b-be97-b5d477ec398c',
	sfxPitch: 1.5,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_6.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '2294734d-7bb8-4781-bb7b-ef3820abf3d0',
	sfxPitch: 2,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_5.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: 'ea8a61af-e350-45f7-ba6a-366fcd65692a',
	sfxPitch: 2.5,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_4.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: 'd0c74815-fc1c-4fbe-9953-c92e4b20f919',
	sfxPitch: 3,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_3.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: 'd8fbd70e-611d-402d-87da-1a7fd8cd2c8d',
	sfxPitch: 3.5,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_2.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}, {
	id: '35e476ee-44bd-4711-ad42-87be245d3efd',
	sfxPitch: 4,
	img: '/client-assets/drop-and-fusion/square_monos/keycap_1.png',
	imgSizeX: 256,
	imgSizeY: 256,
	spriteScale: 1.12,
}];

const SWEETS_MONOS: FrontendMonoDefinition[] = [{
	id: '77f724c0-88be-4aeb-8e1a-a00ed18e3844',
	sfxPitch: 0.25,
	img: '/client-assets/drop-and-fusion/sweets_monos/shortcake_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: 'f3468ef4-2e1e-4906-8795-f147f39f7e1f',
	sfxPitch: 0.5,
	img: '/client-assets/drop-and-fusion/sweets_monos/pancakes_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: 'bcb41129-6f2d-44ee-89d3-86eb2df564ba',
	sfxPitch: 0.75,
	img: '/client-assets/drop-and-fusion/sweets_monos/shaved_ice_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: 'f058e1ad-1981-409b-b3a7-302de0a43744',
	sfxPitch: 1,
	img: '/client-assets/drop-and-fusion/sweets_monos/soft_ice_cream_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: 'd22cfe38-5a3b-4b9c-a1a6-907930a3d732',
	sfxPitch: 1.5,
	img: '/client-assets/drop-and-fusion/sweets_monos/doughnut_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: '79867083-a073-427e-ae82-07a70d9f3b4f',
	sfxPitch: 2,
	img: '/client-assets/drop-and-fusion/sweets_monos/custard_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: '2e152a12-a567-4100-b4d4-d15d81ba47b1',
	sfxPitch: 2.5,
	img: '/client-assets/drop-and-fusion/sweets_monos/chocolate_bar_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: '12250376-2258-4716-8eec-b3a7239461fc',
	sfxPitch: 3,
	img: '/client-assets/drop-and-fusion/sweets_monos/lollipop_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: '4d4f2668-4be7-44a3-aa3a-856df6e25aa6',
	sfxPitch: 3.5,
	img: '/client-assets/drop-and-fusion/sweets_monos/candy_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}, {
	id: 'c9984b40-4045-44c3-b260-d47b7b4625b2',
	sfxPitch: 4,
	img: '/client-assets/drop-and-fusion/sweets_monos/cookie_color.svg',
	imgSizeX: 32,
	imgSizeY: 32,
	spriteScale: 1,
}];

const props = defineProps<{
	gameMode: 'normal' | 'square' | 'yen' | 'sweets' | 'space';
	mute: boolean;
}>();

const emit = defineEmits<{
	(ev: 'end'): void;
}>();

const monoDefinitions = computed(() => {
	return props.gameMode === 'normal' ? NORAML_MONOS :
		props.gameMode === 'square' ? SQUARE_MONOS :
		props.gameMode === 'yen' ? YEN_MONOS :
		props.gameMode === 'sweets' ? SWEETS_MONOS :
		props.gameMode === 'space' ? NORAML_MONOS :
		[] as never;
});

function getScoreUnit(gameMode: string) {
	return gameMode === 'normal' ? 'pt' :
		gameMode === 'square' ? 'pt' :
		gameMode === 'yen' ? '円' :
		gameMode === 'sweets' ? 'kcal' :
		'' as never;
}

function getMonoRenderOptions(mono: Mono) {
	const def = monoDefinitions.value.find(x => x.id === mono.id)!;
	return {

		sprite: {
			texture: def.img,
			xScale: (mono.sizeX / def.imgSizeX) * def.spriteScale,
			yScale: (mono.sizeY / def.imgSizeY) * def.spriteScale,
		},

	};
}

let viewScale = 1;
let seed: string = Date.now().toString();
let containerElRect: DOMRect | null = null;
let logs: ReturnType<DropAndFusionGame['getLogs']> | null = null;
let endedAtFrame = 0;
let bgmNodes: ReturnType<typeof sound.createSourceNode> | null = null;
let renderer: Matter.Render | null = null;
let monoTextures: Record<string, Blob> = {};
let monoTextureUrls: Record<string, string> = {};
let tickRaf: number | null = null;
let game = new DropAndFusionGame({
	seed: seed,
	gameMode: props.gameMode,
	getMonoRenderOptions,
});
attachGameEvents();

const containerEl = shallowRef<HTMLElement>();
const canvasEl = shallowRef<HTMLCanvasElement>();
const dropperX = ref(0);
const currentPick = shallowRef<{ id: string; mono: Mono } | null>(null);
const stock = shallowRef<{ id: string; mono: Mono }[]>([]);
const holdingStock = shallowRef<{ id: string; mono: Mono } | null>(null);
const score = ref(0);
const combo = ref(0);
const comboPrev = ref(0);
const maxCombo = ref(0);
const dropReady = ref(true);
const isGameOver = ref(false);
const gameLoaded = ref(false);
const readyGo = ref<'ready' | 'go' | null>('ready');
const highScore = ref<number | null>(null);
const yenTotal = ref<number | null>(null);
const showConfig = ref(false);
const replaying = ref(false);
const replayPlaybackRate = ref(1);
const currentFrame = ref(0);
const bgmVolume = ref(defaultStore.state.dropAndFusion.bgmVolume);
const sfxVolume = ref(defaultStore.state.dropAndFusion.sfxVolume);

watch(replayPlaybackRate, (newValue) => {
	game.replayPlaybackRate = newValue;
});

watch(bgmVolume, (newValue) => {
	if (bgmNodes) {
		bgmNodes.gainNode.gain.value = props.mute ? 0 : newValue;
	}
});

function createRendererInstance(game: DropAndFusionGame) {
	return Matter.Render.create({
		engine: game.engine,
		canvas: canvasEl.value!,
		options: {
			width: game.GAME_WIDTH,
			height: game.GAME_HEIGHT,
			background: 'transparent', // transparent to hide
			wireframeBackground: 'transparent', // transparent to hide
			wireframes: false,
			showSleeping: false,
			pixelRatio: Math.max(2, window.devicePixelRatio),
		},
	});
}

function loadMonoTextures() {
	async function loadSingleMonoTexture(mono: FrontendMonoDefinition) {
		if (renderer == null) return;

		// Matter-js内にキャッシュがある場合はスキップ
		if (renderer.textures[mono.img]) return;

		let src = mono.img;
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (monoTextureUrls[mono.img]) {
			src = monoTextureUrls[mono.img];
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		} else if (monoTextures[mono.img]) {
			src = URL.createObjectURL(monoTextures[mono.img]);
			monoTextureUrls[mono.img] = src;
		} else {
			const res = await fetch(mono.img);
			const blob = await res.blob();
			monoTextures[mono.img] = blob;
			src = URL.createObjectURL(blob);
			monoTextureUrls[mono.img] = src;
		}

		const image = new Image();
		image.src = src;
		renderer.textures[mono.img] = image;
	}

	return Promise.all(monoDefinitions.value.map(x => loadSingleMonoTexture(x)));
}

function getTextureImageUrl(mono: Mono) {
	const def = monoDefinitions.value.find(x => x.id === mono.id)!;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (monoTextureUrls[def.img]) {
		return monoTextureUrls[def.img];

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	} else if (monoTextures[def.img]) {
		// Gameクラス内にキャッシュがある場合はそれを使う
		const out = URL.createObjectURL(monoTextures[def.img]);
		monoTextureUrls[def.img] = out;
		return out;
	} else {
		return def.img;
	}
}

function tick() {
	const hasNextTick = game.tick();
	if (hasNextTick) {
		tickRaf = window.requestAnimationFrame(tick);
	} else {
		tickRaf = null;
	}
}

function tickReplay() {
	let hasNextTick;
	for (let i = 0; i < replayPlaybackRate.value; i++) {
		const log = logs!.find(x => x.frame === game.frame);
		if (log) {
			switch (log.operation) {
				case 'drop': {
					game.drop(log.x);
					break;
				}
				case 'hold': {
					game.hold();
					break;
				}
				case 'surrender': {
					game.surrender();
					break;
				}
				default:
					break;
			}
		}

		hasNextTick = game.tick();
		currentFrame.value = game.frame;
		if (!hasNextTick) break;
	}

	if (hasNextTick) {
		tickRaf = window.requestAnimationFrame(tickReplay);
	} else {
		tickRaf = null;
	}
}

async function start() {
	renderer = createRendererInstance(game);
	await loadMonoTextures();
	Matter.Render.lookAt(renderer, {
		min: { x: 0, y: 0 },
		max: { x: game.GAME_WIDTH, y: game.GAME_HEIGHT },
	});
	Matter.Render.run(renderer);
	game.start();
	window.requestAnimationFrame(tick);

	gameLoaded.value = true;

	window.setTimeout(() => {
		readyGo.value = 'go';
		window.setTimeout(() => {
			readyGo.value = null;
		}, 1000);
	}, 1500);
}

function onClick(ev: MouseEvent) {
	if (!containerElRect) return;
	if (replaying.value) return;
	const x = (ev.clientX - containerElRect.left) / viewScale;
	game.drop(x);
}

function onTouchend(ev: TouchEvent) {
	if (!containerElRect) return;
	if (replaying.value) return;
	const x = (ev.changedTouches[0].clientX - containerElRect.left) / viewScale;
	game.drop(x);
}

function onMousemove(ev: MouseEvent) {
	if (!containerElRect) return;
	const x = (ev.clientX - containerElRect.left);
	moveDropper(containerElRect, x);
}

function onTouchmove(ev: TouchEvent) {
	if (!containerElRect) return;
	const x = (ev.touches[0].clientX - containerElRect.left);
	moveDropper(containerElRect, x);
}

function moveDropper(rect: DOMRect, x: number) {
	dropperX.value = Math.min(rect.width * ((game.GAME_WIDTH - game.PLAYAREA_MARGIN) / game.GAME_WIDTH), Math.max(rect.width * (game.PLAYAREA_MARGIN / game.GAME_WIDTH), x));
}

function hold() {
	game.hold();
}

async function surrender() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.areYouSure,
	});
	if (canceled) return;
	game.surrender();
}

async function restart() {
	reset();
	game = new DropAndFusionGame({
		seed: seed,
		gameMode: props.gameMode,
		getMonoRenderOptions,
	});
	attachGameEvents();
	await start();
}

function reset() {
	dispose();
	seed = Date.now().toString();
	isGameOver.value = false;
	replaying.value = false;
	replayPlaybackRate.value = 1;
	currentPick.value = null;
	dropReady.value = true;
	stock.value = [];
	holdingStock.value = null;
	score.value = 0;
	combo.value = 0;
	comboPrev.value = 0;
	maxCombo.value = 0;
	gameLoaded.value = false;
	readyGo.value = null;
}

function dispose() {
	game.dispose();
	if (renderer) Matter.Render.stop(renderer);
	if (tickRaf) {
		window.cancelAnimationFrame(tickRaf);
	}
}

function backToTitle() {
	emit('end');
}

function replay() {
	replaying.value = true;
	dispose();
	game = new DropAndFusionGame({
		seed: seed,
		gameMode: props.gameMode,
		getMonoRenderOptions,
	});
	attachGameEvents();
	os.promiseDialog(loadMonoTextures(), async () => {
		renderer = createRendererInstance(game);
		Matter.Render.lookAt(renderer, {
			min: { x: 0, y: 0 },
			max: { x: game.GAME_WIDTH, y: game.GAME_HEIGHT },
		});
		Matter.Render.run(renderer);
		game.start();
		window.requestAnimationFrame(tickReplay);
	});
}

function endReplay() {
	replaying.value = false;
	dispose();
}

function exportLog() {
	if (!logs) return;
	const data = JSON.stringify({
		v: game.GAME_VERSION,
		m: props.gameMode,
		s: seed,
		d: new Date().toISOString(),
		l: DropAndFusionGame.serializeLogs(logs),
	});
	copyToClipboard(data);
	os.success();
}

function updateSettings<
	K extends keyof typeof defaultStore.state.dropAndFusion,
	V extends typeof defaultStore.state.dropAndFusion[K],
>(key: K, value: V) {
	const changes: { [P in K]?: V } = {};
	changes[key] = value;
	defaultStore.set('dropAndFusion', {
		...defaultStore.state.dropAndFusion,
		...changes,
	});
}

function loadImage(url: string) {
	return new Promise<HTMLImageElement>(res => {
		const img = new Image();
		img.src = url;
		img.addEventListener('load', () => {
			res(img);
		});
	});
}

function getGameImageDriveFile() {
	return new Promise<Misskey.entities.DriveFile | null>(res => {
		const dcanvas = document.createElement('canvas');
		dcanvas.width = game.GAME_WIDTH;
		dcanvas.height = game.GAME_HEIGHT;
		const ctx = dcanvas.getContext('2d');
		if (!ctx || !canvasEl.value) return res(null);
		Promise.all([
			loadImage('/client-assets/drop-and-fusion/frame-light.svg'),
			loadImage('/client-assets/drop-and-fusion/logo.png'),
		]).then((images) => {
			const [frame, logo] = images;
			ctx.fillStyle = '#fff';
			ctx.fillRect(0, 0, game.GAME_WIDTH, game.GAME_HEIGHT);

			ctx.drawImage(frame, 0, 0, game.GAME_WIDTH, game.GAME_HEIGHT);
			ctx.drawImage(canvasEl.value!, 0, 0, game.GAME_WIDTH, game.GAME_HEIGHT);

			ctx.fillStyle = '#000';
			ctx.font = '16px bold sans-serif';
			ctx.textBaseline = 'top';
			ctx.fillText(`SCORE: ${score.value.toLocaleString()}${getScoreUnit(props.gameMode)}`, 10, 10);

			ctx.globalAlpha = 0.7;
			ctx.drawImage(logo, game.GAME_WIDTH * 0.55, 6, game.GAME_WIDTH * 0.45, game.GAME_WIDTH * 0.45 * (logo.height / logo.width));
			ctx.globalAlpha = 1;

			dcanvas.toBlob(blob => {
				if (!blob) return res(null);
				if ($i == null) return res(null);
				const formData = new FormData();
				formData.append('file', blob);
				formData.append('name', `bubble-game-${Date.now()}.png`);
				formData.append('isSensitive', 'false');
				formData.append('i', $i.token);
				if (defaultStore.state.uploadFolder) {
					formData.append('folderId', defaultStore.state.uploadFolder);
				}

				window.fetch(apiUrl + '/drive/files/create', {
					method: 'POST',
					body: formData,
				})
					.then(response => response.json())
					.then(f => {
						res(f);
					});
			}, 'image/png');

			dcanvas.remove();
		});
	});
}

async function share() {
	const uploading = getGameImageDriveFile();
	os.promiseDialog(uploading);
	const file = await uploading;
	if (!file) return;
	os.post({
		initialText: `#BubbleGame (${props.gameMode})
SCORE: ${score.value.toLocaleString()}${getScoreUnit(props.gameMode)}`,
		initialFiles: [file],
		instant: true,
	});
}

function attachGameEvents() {
	game.addListener('changeScore', value => {
		score.value = value;
	});

	game.addListener('changeCombo', value => {
		if (value === 0) {
			comboPrev.value = combo.value;
		} else {
			comboPrev.value = value;
		}
		maxCombo.value = Math.max(maxCombo.value, value);
		combo.value = value;
	});

	game.addListener('changeStock', value => {
		currentPick.value = JSON.parse(JSON.stringify(value[0]));
		stock.value = JSON.parse(JSON.stringify(value.slice(1)));
	});

	game.addListener('changeHolding', value => {
		holdingStock.value = value;

		if (!props.mute) {
			sound.playUrl('/client-assets/drop-and-fusion/hold.mp3', {
				volume: 0.5 * sfxVolume.value,
				playbackRate: replayPlaybackRate.value,
			});
		}
	});

	game.addListener('dropped', (x) => {
		if (!props.mute) {
			const panV = x - game.PLAYAREA_MARGIN;
			const panW = game.GAME_WIDTH - game.PLAYAREA_MARGIN - game.PLAYAREA_MARGIN;
			const pan = ((panV / panW) - 0.5) * 2;
			if (props.gameMode === 'yen') {
				sound.playUrl('/client-assets/drop-and-fusion/drop_yen.mp3', {
					volume: sfxVolume.value,
					pan,
					playbackRate: replayPlaybackRate.value,
				});
			} else {
				sound.playUrl('/client-assets/drop-and-fusion/drop.mp3', {
					volume: sfxVolume.value,
					pan,
					playbackRate: replayPlaybackRate.value,
				});
			}
		}

		if (replaying.value) return;

		dropReady.value = false;
		window.setTimeout(() => {
			if (!isGameOver.value) {
				dropReady.value = true;
			}
		}, game.frameToMs(game.DROP_COOLTIME));
	});

	game.addListener('fusioned', (x, y, nextMono, scoreDelta) => {
		if (!canvasEl.value) return;

		const rect = canvasEl.value.getBoundingClientRect();
		const domX = rect.left + (x * viewScale);
		const domY = rect.top + (y * viewScale);
		const scoreUnit = getScoreUnit(props.gameMode);

		{
			const { dispose } = os.popup(MkRippleEffect, { x: domX, y: domY }, {
				end: () => dispose(),
			});
		}

		{
			const { dispose } = os.popup(MkPlusOneEffect, { x: domX, y: domY, value: scoreDelta + (scoreUnit === 'pt' ? '' : scoreUnit) }, {
				end: () => dispose(),
			});
		}

		if (nextMono) {
			const def = monoDefinitions.value.find(x => x.id === nextMono.id)!;
			if (!props.mute) {
				const panV = x - game.PLAYAREA_MARGIN;
				const panW = game.GAME_WIDTH - game.PLAYAREA_MARGIN - game.PLAYAREA_MARGIN;
				const pan = ((panV / panW) - 0.5) * 2;
				const pitch = def.sfxPitch;
				if (props.gameMode === 'yen') {
					sound.playUrl('/client-assets/drop-and-fusion/fusion_yen.mp3', {
						volume: 0.25 * sfxVolume.value,
						pan: pan,
						playbackRate: (pitch / 4) * replayPlaybackRate.value,
					});
				} else {
					sound.playUrl('/client-assets/drop-and-fusion/fusion.mp3', {
						volume: sfxVolume.value,
						pan: pan,
						playbackRate: pitch * replayPlaybackRate.value,
					});
				}
			}
		} else {
			if (!props.mute) {
				// TODO: 融合後のモノがない場合でも何らかの効果音を再生
			}
		}
	});

	const minCollisionEnergyForSound = 2.5;
	const maxCollisionEnergyForSound = 9;
	const soundPitchMax = 4;
	const soundPitchMin = 0.5;

	game.addListener('collision', (energy, bodyA, bodyB) => {
		if (!props.mute && (energy > minCollisionEnergyForSound)) {
			const volume = (Math.min(maxCollisionEnergyForSound, energy - minCollisionEnergyForSound) / maxCollisionEnergyForSound) / 4;
			const panV =
				bodyA.label === '_wall_' ? bodyB.position.x - game.PLAYAREA_MARGIN :
				bodyB.label === '_wall_' ? bodyA.position.x - game.PLAYAREA_MARGIN :
				((bodyA.position.x + bodyB.position.x) / 2) - game.PLAYAREA_MARGIN;
			const panW = game.GAME_WIDTH - game.PLAYAREA_MARGIN - game.PLAYAREA_MARGIN;
			const pan = ((panV / panW) - 0.5) * 2;
			const pitch = soundPitchMin + ((soundPitchMax - soundPitchMin) * (1 - (Math.min(10, energy) / 10)));

			if (props.gameMode === 'yen') {
				sound.playUrl('/client-assets/drop-and-fusion/collision_yen.mp3', {
					volume: volume * sfxVolume.value,
					pan: pan,
					playbackRate: Math.max(1, pitch) * replayPlaybackRate.value,
				});
			} else {
				sound.playUrl('/client-assets/drop-and-fusion/collision.mp3', {
					volume: volume * sfxVolume.value,
					pan: pan,
					playbackRate: pitch * replayPlaybackRate.value,
				});
			}
		}
	});

	game.addListener('monoAdded', (mono) => {
		if (replaying.value) return;

		// 実績関連
		if (mono.level === 10) {
			claimAchievement('bubbleGameExplodingHead');

			const monos = game.getActiveMonos();
			if (monos.filter(x => x.level === 10).length >= 2) {
				claimAchievement('bubbleGameDoubleExplodingHead');
			}
		}
	});

	game.addListener('gameOver', () => {
		if (!props.mute) {
			if (props.gameMode === 'yen') {
				sound.playUrl('/client-assets/drop-and-fusion/gameover_yen.mp3', {
					volume: 0.5 * sfxVolume.value,
				});
			} else {
				sound.playUrl('/client-assets/drop-and-fusion/gameover.mp3', {
					volume: sfxVolume.value,
				});
			}
		}

		if (replaying.value) {
			endReplay();
			return;
		}

		logs = game.getLogs();
		endedAtFrame = game.frame;
		currentPick.value = null;
		dropReady.value = false;
		isGameOver.value = true;

		misskeyApi('bubble-game/register', {
			seed,
			score: score.value,
			gameMode: props.gameMode,
			gameVersion: game.GAME_VERSION,
			logs: DropAndFusionGame.serializeLogs(logs),
		});

		if (props.gameMode === 'yen') {
			yenTotal.value = (yenTotal.value ?? 0) + score.value;
			misskeyApi('i/registry/set', {
				scope: ['dropAndFusionGame'],
				key: 'yenTotal',
				value: yenTotal.value,
			});
		}

		if (score.value > (highScore.value ?? 0)) {
			highScore.value = score.value;

			misskeyApi('i/registry/set', {
				scope: ['dropAndFusionGame'],
				key: 'highScore:' + props.gameMode,
				value: highScore.value,
			});
		}
	});
}

useInterval(() => {
	if (!canvasEl.value) return;
	const actualCanvasWidth = canvasEl.value.getBoundingClientRect().width;
	if (actualCanvasWidth === 0) return;
	viewScale = actualCanvasWidth / game.GAME_WIDTH;
	containerElRect = containerEl.value?.getBoundingClientRect() ?? null;
}, 1000, { immediate: false, afterMounted: true });

onMounted(async () => {
	try {
		highScore.value = await misskeyApi('i/registry/get', {
			scope: ['dropAndFusionGame'],
			key: 'highScore:' + props.gameMode,
		});
	} catch (err) {
		highScore.value = null;
	}

	if (props.gameMode === 'yen') {
		try {
			yenTotal.value = await misskeyApi('i/registry/get', {
				scope: ['dropAndFusionGame'],
				key: 'yenTotal',
			});
		} catch (err: any) {
			if (err.code === 'NO_SUCH_KEY') {
				// nop
			} else {
				os.alert({
					type: 'error',
					text: i18n.ts.cannotLoad,
				});
				return;
			}
		}
	}

	/*
	const getVerticesFromSvg = async (path: string) => {
		const svgDoc = await fetch(path)
			.then((response) => response.text())
			.then((svgString) => {
				const parser = new DOMParser();
				return parser.parseFromString(svgString, 'image/svg+xml');
			});
		const pathDatas = svgDoc.querySelectorAll('path');
		if (!pathDatas) return;
		const vertices = Array.from(pathDatas).map((pathData) => {
			return Matter.Svg.pathToVertices(pathData);
		});
		return vertices;
	};

	getVerticesFromSvg('/client-assets/drop-and-fusion/sweets_monos/verts/doughnut_color.svg').then((vertices) => {
		console.log('doughnut_color', vertices);
	});
	*/

	await start();

	const bgmBuffer = await sound.loadAudio('/client-assets/drop-and-fusion/bgm_1.mp3');
	if (!bgmBuffer) return;
	bgmNodes = sound.createSourceNode(bgmBuffer, {
		volume: props.mute ? 0 : bgmVolume.value,
	});
	if (!bgmNodes) return;
	bgmNodes.soundSource.loop = true;
	bgmNodes.soundSource.start();
});

onUnmounted(() => {
	dispose();
	bgmNodes?.soundSource.stop();
});

onDeactivated(() => {
	dispose();
	bgmNodes?.soundSource.stop();
});

definePageMetadata(() => ({
	title: i18n.ts.bubbleGame,
	icon: 'ti ti-apple',
}));
</script>

<style lang="scss" module>
.transition_zoom_move,
.transition_zoom_enterActive,
.transition_zoom_leaveActive {
	transition: opacity 0.5s cubic-bezier(0,.5,.5,1), transform 0.5s cubic-bezier(0,.5,.5,1) !important;
}
.transition_zoom_enterFrom,
.transition_zoom_leaveTo {
	opacity: 0;
	transform: scale(0.8);
}

.transition_stock_move,
.transition_stock_enterActive,
.transition_stock_leaveActive {
	transition: opacity 0.4s cubic-bezier(0,.5,.5,1), transform 0.4s cubic-bezier(0,.5,.5,1) !important;
}
.transition_stock_enterFrom,
.transition_stock_leaveTo {
	opacity: 0;
	transform: scale(0.7);
}
.transition_stock_leaveActive {
	position: absolute;
}

.transition_picked_move,
.transition_picked_enterActive {
	transition: opacity 0.5s cubic-bezier(0,.5,.5,1), transform 0.5s cubic-bezier(0,.5,.5,1) !important;
}
.transition_picked_leaveActive {
	transition: all 0s !important;
}
.transition_picked_enterFrom,
.transition_picked_leaveTo {
	opacity: 0;
	transform: translateY(-50px);
}
.transition_picked_leaveActive {
	position: absolute;
}

.transition_combo_move,
.transition_combo_enterActive {
	transition: all 0s !important;
}
.transition_combo_leaveActive {
	transition: opacity 0.4s cubic-bezier(0,.5,.5,1), transform 0.4s cubic-bezier(0,.5,.5,1) !important;
}
.transition_combo_enterFrom,
.transition_combo_leaveTo {
	opacity: 0;
	transform: scale(0.7);
}
.transition_combo_leaveActive {
	position: absolute;
}

.root {
	margin: 0 auto;
	max-width: 600px;
	user-select: none;

	* {
		user-select: none;
	}
}

.loadingScreen {
	text-align: center;
	padding: 32px;
}

.readyGo_bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 100;
	backdrop-filter: blur(4px);
}

.readyGo_ready,
.readyGo_go {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 101;
	pointer-events: none;
}

.readyGo_img {
	display: block;
	width: 250px;
	max-width: 100%;
}

.header {
	position: relative;
	z-index: 10;
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: auto auto;
	gap: 8px;

	> .headerTitle {
		text-align: center;
	}

	@media (min-width: 500px) {
		grid-template-columns: 1fr auto;
		grid-template-rows: auto;

		> .headerTitle {
			text-align: start;
		}
	}
}

.mainFrameImg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	// なんかiOSでちらつく
	//filter: drop-shadow(0 6px 16px #0007);
	pointer-events: none;
	user-select: none;
}

.canvas {
	position: relative;
	display: block;
	z-index: 1;
	width: 100% !important;
	height: auto !important;
	pointer-events: none;
	user-select: none;
}

.gameContainer {
	position: relative;
	margin-top: -20px;
}

.stock {
	pointer-events: none;
	user-select: none;
}

.combo {
	position: absolute;
	z-index: 3;
	top: 50%;
	width: 100%;
	text-align: center;
	font-weight: bold;
	font-style: oblique;
	color: #fff;
	-webkit-text-stroke: 1px rgb(255, 145, 0);
	text-shadow: 0 0 6px #0005;
	pointer-events: none;
	user-select: none;
}

.dropperContainer {
	position: absolute;
	top: 0;
	height: 100%;
	z-index: 2;
	pointer-events: none;
	user-select: none;
	will-change: left;
}

.currentMono {
	position: absolute;
	display: block;
	bottom: 88%;
	z-index: 2;
	filter: drop-shadow(0 6px 16px #0007);
}

.dropper {
	position: relative;
	top: 0;
	width: 70px;
	margin-top: -10px;
	margin-left: -30px;
	z-index: 2;
	filter: drop-shadow(0 6px 16px #0007);
}

.currentMonoArrow {
	position: absolute;
	width: 20px;
	bottom: 80%;
	left: -10px;
	z-index: 3;
	animation: currentMonoArrow 2s ease infinite;
}

.dropGuide {
	position: absolute;
	z-index: 3;
	bottom: 0;
	width: 3px;
	margin-left: -2px;
	height: 85%;
	background: #f002;
}

.gameOverLabel {
	position: absolute;
	z-index: 10;
	top: 50%;
	left: 0;
	right: 0;
	margin: auto;
	width: calc(100% - 50px);
	max-width: 320px;
	padding: 16px;
	box-sizing: border-box;
	background: #0007;
	border-radius: 16px;
	color: #fff;
	text-align: center;
	font-weight: bold;
}

.gameOver {
	.canvas {
		filter: grayscale(1);
	}
}

.replayIndicator {
	position: absolute;
	z-index: 10;
	left: 10px;
	bottom: 10px;
	padding: 6px 8px;
	color: #f00;
	font-weight: bold;
	background: #0008;
	border-radius: 6px;
	pointer-events: none;
}

.replayIndicatorText {
	animation: replayIndicator-blink 2s infinite;
}

@keyframes replayIndicator-blink {
	0% { opacity: 1; }
	50% { opacity: 0; }
	100% { opacity: 1; }
}

@keyframes currentMonoArrow {
	0% { transform: translateY(0); }
	25% { transform: translateY(-8px); }
	50% { transform: translateY(0); }
	75% { transform: translateY(-8px); }
	100% { transform: translateY(0); }
}
</style>
