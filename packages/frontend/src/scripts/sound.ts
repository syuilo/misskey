// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { markRaw } from 'vue';
import { Storage } from '@/pizzax';

export const soundConfigStore = markRaw(new Storage('sound', {
	mediaVolume: {
		where: 'device',
		default: 0.5,
	},
	sound_masterVolume: {
		where: 'device',
		default: 0.3,
	},
	sound_note: {
		where: 'account',
		default: { type: 'syuilo/n-aec', volume: 1 },
	},
	sound_noteMy: {
		where: 'account',
		default: { type: 'syuilo/n-cea-4va', volume: 1 },
	},
	sound_notification: {
		where: 'account',
		default: { type: 'syuilo/n-ea', volume: 1 },
	},
	sound_chat: {
		where: 'account',
		default: { type: 'syuilo/pope1', volume: 1 },
	},
	sound_chatBg: {
		where: 'account',
		default: { type: 'syuilo/waon', volume: 1 },
	},
	sound_antenna: {
		where: 'account',
		default: { type: 'syuilo/triple', volume: 1 },
	},
	sound_channel: {
		where: 'account',
		default: { type: 'syuilo/square-pico', volume: 1 },
	},
}));

await soundConfigStore.ready;

//#region サウンドのColdDeviceStorage => indexedDBのマイグレーション
for (const target of Object.keys(soundConfigStore.state) as Array<keyof typeof soundConfigStore.state>) {
	const value = localStorage.getItem(`miux:${target}`);
	if (value) {
		soundConfigStore.set(target, JSON.parse(value) as typeof soundConfigStore.def[typeof target]['default']);
		localStorage.removeItem(`miux:${target}`);
	}
}
//#endregion

const cache = new Map<string, HTMLAudioElement>();

export const soundsTypes = [
	null,
	'syuilo/n-aec',
	'syuilo/n-aec-4va',
	'syuilo/n-aec-4vb',
	'syuilo/n-aec-8va',
	'syuilo/n-aec-8vb',
	'syuilo/n-cea',
	'syuilo/n-cea-4va',
	'syuilo/n-cea-4vb',
	'syuilo/n-cea-8va',
	'syuilo/n-cea-8vb',
	'syuilo/n-eca',
	'syuilo/n-eca-4va',
	'syuilo/n-eca-4vb',
	'syuilo/n-eca-8va',
	'syuilo/n-eca-8vb',
	'syuilo/n-ea',
	'syuilo/n-ea-4va',
	'syuilo/n-ea-4vb',
	'syuilo/n-ea-8va',
	'syuilo/n-ea-8vb',
	'syuilo/n-ea-harmony',
	'syuilo/up',
	'syuilo/down',
	'syuilo/pope1',
	'syuilo/pope2',
	'syuilo/waon',
	'syuilo/popo',
	'syuilo/triple',
	'syuilo/poi1',
	'syuilo/poi2',
	'syuilo/pirori',
	'syuilo/pirori-wet',
	'syuilo/pirori-square-wet',
	'syuilo/square-pico',
	'syuilo/reverved',
	'syuilo/ryukyu',
	'syuilo/kick',
	'syuilo/snare',
	'syuilo/queue-jammed',
	'aisha/1',
	'aisha/2',
	'aisha/3',
	'noizenecio/kick_gaba1',
	'noizenecio/kick_gaba2',
	'noizenecio/kick_gaba3',
	'noizenecio/kick_gaba4',
	'noizenecio/kick_gaba5',
	'noizenecio/kick_gaba6',
	'noizenecio/kick_gaba7',
] as const;

export function getAudio(file: string, useCache = true): HTMLAudioElement {
	let audio: HTMLAudioElement;
	if (useCache && cache.has(file)) {
		audio = cache.get(file);
	} else {
		audio = new Audio(`/client-assets/sounds/${file}.mp3`);
		if (useCache) cache.set(file, audio);
	}
	return audio;
}

export function setVolume(audio: HTMLAudioElement, volume: number): HTMLAudioElement {
	const masterVolume = soundConfigStore.state.sound_masterVolume;
	audio.volume = masterVolume - ((1 - volume) * masterVolume);
	return audio;
}

export function play(type: 'noteMy' | 'note' | 'antenna' | 'channel' | 'notification') {
	const sound = soundConfigStore.state[`sound_${type}`];
	if (_DEV_) console.log('play', type, sound);
	if (sound.type == null) return;
	playFile(sound.type, sound.volume);
}

export function playFile(file: string, volume: number) {
	const audio = setVolume(getAudio(file), volume);
	if (audio.volume === 0) return;
	audio.play();
}
