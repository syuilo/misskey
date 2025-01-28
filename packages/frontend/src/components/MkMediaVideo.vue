<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="playerEl"
	v-hotkey="keymap"
	tabindex="0"
	:class="[
		$style.videoContainer,
		controlsShowing && $style.active,
		(video.isSensitive && defaultStore.state.highlightSensitiveMedia) && $style.sensitive,
	]"
	@mouseover="onMouseOver"
	@mouseleave="onMouseLeave"
	@contextmenu.stop
	@keydown.stop
>
	<button v-if="hide" :class="$style.hidden" @click="show">
		<div :class="$style.hiddenTextWrapper">
			<b v-if="video.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ defaultStore.state.dataSaver.media ? ` (${i18n.ts.video}${video.size ? ' ' + bytes(video.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-movie"></i> {{ defaultStore.state.dataSaver.media && video.size ? bytes(video.size) : i18n.ts.video }}</b>
			<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
		</div>
	</button>

	<div v-else-if="defaultStore.reactiveState.useNativeUIForVideoAudioPlayer.value" :class="$style.videoRoot">
		<video
			ref="videoEl"
			:class="$style.video"
			:poster="video.thumbnailUrl ?? undefined"
			:title="video.comment ?? undefined"
			:alt="video.comment"
			preload="metadata"
			controls
			@keydown.prevent
		>
			<source :src="video.url">
		</video>
		<i class="ti ti-eye-off" :class="$style.hide" @click="hide = true"></i>
		<div :class="$style.indicators">
			<div v-if="video.comment" :class="$style.indicator">ALT</div>
			<div v-if="video.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="i18n.ts.sensitive"><i class="ti ti-eye-exclamation"></i></div>
		</div>
	</div>

	<div v-else :class="$style.videoRoot">
		<video
			ref="videoEl"
			:class="$style.video"
			:poster="video.thumbnailUrl ?? undefined"
			:title="video.comment ?? undefined"
			:alt="video.comment"
			preload="metadata"
			playsinline
			@keydown.prevent
			@click.self="togglePlayPause"
		>
			<source :src="video.url">
		</video>
		<button v-if="isReady && !isPlaying" class="_button" :class="$style.videoOverlayPlayButton" @click="togglePlayPause"><i class="ti ti-player-play-filled"></i></button>
		<div v-else-if="!isActuallyPlaying" :class="$style.videoLoading">
			<MkLoading/>
		</div>
		<i class="ti ti-eye-off" :class="$style.hide" @click="hide = true"></i>
		<div :class="$style.indicators">
			<div v-if="video.comment" :class="$style.indicator">ALT</div>
			<div v-if="video.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="i18n.ts.sensitive"><i class="ti ti-eye-exclamation"></i></div>
		</div>
		<div :class="$style.videoControls" @click.self="togglePlayPause">
			<div :class="[$style.controlsChild, $style.controlsLeft]">
				<button class="_button" :class="$style.controlButton" @click="togglePlayPause">
					<i v-if="isPlaying" class="ti ti-player-pause-filled"></i>
					<i v-else class="ti ti-player-play-filled"></i>
				</button>
			</div>
			<div :class="[$style.controlsChild, $style.controlsRight]">
				<button class="_button" :class="$style.controlButton" @click="showMenu">
					<i class="ti ti-settings"></i>
				</button>
				<button class="_button" :class="$style.controlButton" @click="toggleFullscreen">
					<i v-if="isFullscreen" class="ti ti-arrows-minimize"></i>
					<i v-else class="ti ti-arrows-maximize"></i>
				</button>
			</div>
			<div :class="[$style.controlsChild, $style.controlsTime]">{{ hms(elapsedTimeMs) }}</div>
			<div :class="[$style.controlsChild, $style.controlsVolume]">
				<button class="_button" :class="$style.controlButton" @click="toggleMute">
					<i v-if="volume === 0" class="ti ti-volume-3"></i>
					<i v-else class="ti ti-volume"></i>
				</button>
				<MkMediaRange
					v-model="volume"
					:sliderBgWhite="true"
					:class="$style.volumeSeekbar"
				/>
			</div>
			<MkMediaRange
				v-model="rangePercent"
				:sliderBgWhite="true"
				:class="$style.seekbarRoot"
				:buffer="bufferedDataRatio"
			/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, watch, onDeactivated, onActivated, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@/types/menu.js';
import type { Keymap } from '@/scripts/hotkey.js';
import bytes from '@/filters/bytes.js';
import { hms } from '@/filters/hms.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { exitFullscreen, requestFullscreen } from '@/scripts/fullscreen.js';
import hasAudio from '@/scripts/media-has-audio.js';
import MkMediaRange from '@/components/MkMediaRange.vue';
import { $i, iAmModerator } from '@/account.js';

const props = defineProps<{
	video: Misskey.entities.DriveFile;
}>();

const keymap = {
	'up': {
		allowRepeat: true,
		callback: () => {
			if (hasFocus() && videoEl.value) {
				volume.value = Math.min(volume.value + 0.1, 1);
			}
		},
	},
	'down': {
		allowRepeat: true,
		callback: () => {
			if (hasFocus() && videoEl.value) {
				volume.value = Math.max(volume.value - 0.1, 0);
			}
		},
	},
	'left': {
		allowRepeat: true,
		callback: () => {
			if (hasFocus() && videoEl.value) {
				videoEl.value.currentTime = Math.max(videoEl.value.currentTime - 5, 0);
			}
		},
	},
	'right': {
		allowRepeat: true,
		callback: () => {
			if (hasFocus() && videoEl.value) {
				videoEl.value.currentTime = Math.min(videoEl.value.currentTime + 5, videoEl.value.duration);
			}
		},
	},
	'space': () => {
		if (hasFocus()) {
			togglePlayPause();
		}
	},
} as const satisfies Keymap;

// PlayerElもしくはその子要素にフォーカスがあるかどうか
function hasFocus() {
	if (!playerEl.value) return false;
	return playerEl.value === document.activeElement || playerEl.value.contains(document.activeElement);
}

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const hide = ref((defaultStore.state.nsfw === 'force' || defaultStore.state.dataSaver.media) ? true : (props.video.isSensitive && defaultStore.state.nsfw !== 'ignore'));

async function show() {
	if (props.video.isSensitive && defaultStore.state.confirmWhenRevealingSensitiveMedia) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts.sensitiveMediaRevealConfirm,
		});
		if (canceled) return;
	}

	hide.value = false;
}

// Menu
const menuShowing = ref(false);

function showMenu(ev: MouseEvent) {
	const menu: MenuItem[] = [
		// TODO: 再生キューに追加
		{
			type: 'switch',
			text: i18n.ts._mediaControls.loop,
			icon: 'ti ti-repeat',
			ref: loop,
		},
		{
			type: 'radio',
			text: i18n.ts._mediaControls.playbackRate,
			icon: 'ti ti-clock-play',
			ref: speed,
			options: {
				'0.25x': 0.25,
				'0.5x': 0.5,
				'0.75x': 0.75,
				'1.0x': 1,
				'1.25x': 1.25,
				'1.5x': 1.5,
				'2.0x': 2,
			},
		},
		...(document.pictureInPictureEnabled ? [{
			text: i18n.ts._mediaControls.pip,
			icon: 'ti ti-picture-in-picture',
			action: togglePictureInPicture,
		}] : []),
		{
			type: 'divider',
		},
		{
			text: i18n.ts.hide,
			icon: 'ti ti-eye-off',
			action: () => {
				hide.value = true;
			},
		},
	];

	if (iAmModerator) {
		menu.push({
			text: props.video.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
			icon: props.video.isSensitive ? 'ti ti-eye' : 'ti ti-eye-exclamation',
			danger: true,
			action: () => toggleSensitive(props.video),
		});
	}

	if ($i?.id === props.video.userId) {
		menu.push({
			type: 'divider',
		}, {
			type: 'link',
			text: i18n.ts._fileViewer.title,
			icon: 'ti ti-info-circle',
			to: `/my/drive/file/${props.video.id}`,
		});
	}

	menuShowing.value = true;
	os.popupMenu(menu, ev.currentTarget ?? ev.target, {
		align: 'right',
		onClosing: () => {
			menuShowing.value = false;
		},
	});
}

function toggleSensitive(file: Misskey.entities.DriveFile) {
	os.apiWithDialog('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	});
}

// MediaControl: Video State
const videoEl = shallowRef<HTMLVideoElement>();
const playerEl = shallowRef<HTMLDivElement>();
const isHoverring = ref(false);
const controlsShowing = computed(() => {
	if (!oncePlayed.value) return true;
	if (isHoverring.value) return true;
	if (menuShowing.value) return true;
	return false;
});
const isFullscreen = ref(false);
let controlStateTimer: string | number;

// MediaControl: Common State
const oncePlayed = ref(false);
const isReady = ref(false);
const isPlaying = ref(false);
const isActuallyPlaying = ref(false);
const elapsedTimeMs = ref(0);
const durationMs = ref(0);
const rangePercent = computed({
	get: () => {
		return (elapsedTimeMs.value / durationMs.value) || 0;
	},
	set: (to) => {
		if (!videoEl.value) return;
		videoEl.value.currentTime = to * durationMs.value / 1000;
	},
});
const volume = ref(.25);
const speed = ref(1);
const loop = ref(false); // TODO: ドライブファイルのフラグに置き換える
const bufferedEnd = ref(0);
const bufferedDataRatio = computed(() => {
	if (!videoEl.value) return 0;
	return bufferedEnd.value / videoEl.value.duration;
});

// MediaControl Events
function onMouseOver() {
	if (controlStateTimer) {
		clearTimeout(controlStateTimer);
	}
	isHoverring.value = true;
}

function onMouseLeave() {
	controlStateTimer = window.setTimeout(() => {
		isHoverring.value = false;
	}, 100);
}

function togglePlayPause() {
	if (!isReady.value || !videoEl.value) return;

	if (isPlaying.value) {
		videoEl.value.pause();
		isPlaying.value = false;
	} else {
		videoEl.value.play();
		isPlaying.value = true;
		oncePlayed.value = true;
	}
}

function toggleFullscreen() {
	if (playerEl.value == null || videoEl.value == null) return;
	if (isFullscreen.value) {
		exitFullscreen({
			videoEl: videoEl.value,
		});
		isFullscreen.value = false;
	} else {
		requestFullscreen({
			videoEl: videoEl.value,
			playerEl: playerEl.value,
			options: {
				navigationUI: 'hide',
			},
		});
		isFullscreen.value = true;
	}
}

function togglePictureInPicture() {
	if (videoEl.value) {
		if (document.pictureInPictureElement) {
			document.exitPictureInPicture();
		} else {
			videoEl.value.requestPictureInPicture();
		}
	}
}

function toggleMute() {
	if (volume.value === 0) {
		volume.value = .25;
	} else {
		volume.value = 0;
	}
}

let onceInit = false;
let mediaTickFrameId: number | null = null;
let stopVideoElWatch: () => void;

function init() {
	if (onceInit) return;
	onceInit = true;

	stopVideoElWatch = watch(videoEl, () => {
		if (videoEl.value) {
			isReady.value = true;

			function updateMediaTick() {
				if (videoEl.value) {
					try {
						bufferedEnd.value = videoEl.value.buffered.end(0);
					} catch (err) {
						bufferedEnd.value = 0;
					}

					elapsedTimeMs.value = videoEl.value.currentTime * 1000;

					if (videoEl.value.loop !== loop.value) {
						loop.value = videoEl.value.loop;
					}
				}
				mediaTickFrameId = window.requestAnimationFrame(updateMediaTick);
			}

			updateMediaTick();

			videoEl.value.addEventListener('play', () => {
				isActuallyPlaying.value = true;
			});

			videoEl.value.addEventListener('pause', () => {
				isActuallyPlaying.value = false;
				isPlaying.value = false;
			});

			videoEl.value.addEventListener('ended', () => {
				oncePlayed.value = false;
				isActuallyPlaying.value = false;
				isPlaying.value = false;
			});

			durationMs.value = videoEl.value.duration * 1000;
			videoEl.value.addEventListener('durationchange', () => {
				if (videoEl.value) {
					durationMs.value = videoEl.value.duration * 1000;
				}
			});

			videoEl.value.volume = volume.value;
			hasAudio(videoEl.value).then(had => {
				if (!had && videoEl.value) {
					videoEl.value.loop = videoEl.value.muted = true;
					videoEl.value.play();
				}
			});
		}
	}, {
		immediate: true,
	});
}

watch(volume, (to) => {
	if (videoEl.value) videoEl.value.volume = to;
});

watch(speed, (to) => {
	if (videoEl.value) videoEl.value.playbackRate = to;
});

watch(loop, (to) => {
	if (videoEl.value) videoEl.value.loop = to;
});

watch(hide, (to) => {
	if (videoEl.value && to && isFullscreen.value) {
		exitFullscreen({
			videoEl: videoEl.value,
		});
		isFullscreen.value = false;
	}
});

onMounted(() => {
	init();
});

onActivated(() => {
	init();
});

onDeactivated(() => {
	isReady.value = false;
	isPlaying.value = false;
	isActuallyPlaying.value = false;
	elapsedTimeMs.value = 0;
	durationMs.value = 0;
	bufferedEnd.value = 0;
	hide.value = (defaultStore.state.nsfw === 'force' || defaultStore.state.dataSaver.media) ? true : (props.video.isSensitive && defaultStore.state.nsfw !== 'ignore');
	stopVideoElWatch();
	onceInit = false;
	if (mediaTickFrameId) {
		window.cancelAnimationFrame(mediaTickFrameId);
		mediaTickFrameId = null;
	}
});
</script>

<style lang="scss" module>
.videoContainer {
	container-type: inline-size;
	position: relative;
	overflow: clip;

	&:focus-visible {
		outline: none;
	}
}

.sensitive {
	position: relative;

	&::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		border-radius: inherit;
		box-shadow: inset 0 0 0 4px var(--MI_THEME-warn);
	}
}

.indicators {
	display: inline-flex;
	position: absolute;
	top: 10px;
	left: 10px;
	pointer-events: none;
	opacity: .5;
	gap: 6px;
}

.indicator {
	/* Hardcode to black because either --MI_THEME-bg or --MI_THEME-fg makes it hard to read in dark/light mode */
	background-color: black;
	border-radius: 6px;
	color: var(--MI_THEME-accentLighten);
	display: inline-block;
	font-weight: bold;
	font-size: 0.8em;
	padding: 2px 5px;
}

.hide {
	display: block;
	position: absolute;
	border-radius: 6px;
	background-color: var(--MI_THEME-fg);
	color: var(--MI_THEME-accentLighten);
	font-size: 12px;
	opacity: .5;
	padding: 5px 8px;
	text-align: center;
	cursor: pointer;
	top: 12px;
	right: 12px;
}

.hidden {
	width: 100%;
	height: 100%;
	background: #000;
	border: none;
	outline: none;
	font: inherit;
	color: inherit;
	cursor: pointer;
	padding: 60px 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.hiddenTextWrapper {
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.videoRoot {
	background: #000;
	position: relative;
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.video {
	display: block;
	height: 100%;
	width: 100%;
}

.videoOverlayPlayButton {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%,-50%);

	opacity: 0;
	transition: opacity .4s ease-in-out;

	background: var(--MI_THEME-accent);
	color: #fff;
	padding: 1rem;
	border-radius: 99rem;

	font-size: 1.1rem;

	&:focus-visible {
		outline: none;
	}
}

.videoLoading {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.videoControls {
	display: grid;
	grid-template-areas:
		"left time . volume right"
		"seekbar seekbar seekbar seekbar seekbar";
	grid-template-columns: auto auto 1fr auto auto;
	align-items: center;
	gap: 4px 8px;

	padding: 35px 10px 10px 10px;
	background: linear-gradient(rgba(0, 0, 0, 0),rgba(0, 0, 0, .75));

	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;

	transform: translateY(100%);
	pointer-events: none;
	opacity: 0;
	transition: opacity .4s ease-in-out, transform .4s ease-in-out;
}

.active {
	.videoControls {
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto;
	}

	.videoOverlayPlayButton {
		opacity: 1;
	}
}

.controlsChild {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #fff;

	.controlButton {
		padding: 6px;
		border-radius: calc(var(--MI-radius) / 2);
		transition: background-color .2s ease-in-out;
		font-size: 1.05rem;

		&:hover {
			background-color: var(--MI_THEME-accent);
		}

		&:focus-visible {
			outline: none;
		}
	}
}

.controlsLeft {
	grid-area: left;
}

.controlsRight {
	grid-area: right;
}

.controlsTime {
	grid-area: time;
	font-size: .9rem;
}

.controlsVolume {
	grid-area: volume;

	.volumeSeekbar {
		display: none;
	}
}

.seekbarRoot {
	grid-area: seekbar;
	/* ▼シークバー操作をやりやすくするためにクリックイベントが伝播されないエリアを拡張する */
	margin: -10px;
	padding: 10px;
}

@container (min-width: 500px) {
	.videoControls {
		grid-template-areas: "left seekbar time volume right";
		grid-template-columns: auto 1fr auto auto auto;
	}

	.controlsVolume {
		.volumeSeekbar {
			max-width: 90px;
			display: block;
			flex-grow: 1;
		}
	}
}
</style>
