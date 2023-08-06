// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { shallowRef, computed, markRaw, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { api, apiGet } from './os';
import { useStream } from '@/stream';
import { get, set } from '@/scripts/idb-proxy';

const storageCache = await get('emojis');
export const customEmojis = shallowRef<Misskey.entities.CustomEmoji[]>(Array.isArray(storageCache) ? storageCache : []);
export const customEmojiCategories = computed<[ ...string[], null ]>(() => {
	const categories = new Set<string>();
	for (const emoji of customEmojis.value) {
		if (emoji.category && emoji.category !== 'null') {
			categories.add(emoji.category);
		}
	}
	return markRaw([...Array.from(categories), null]);
});

export const customEmojisMap = new Map<string, Misskey.entities.CustomEmoji>();
watch(customEmojis, emojis => {
	customEmojisMap.clear();
	for (const emoji of emojis) {
		customEmojisMap.set(emoji.name, emoji);
	}
}, { immediate: true });

// TODO: ここら辺副作用なのでいい感じにする
const stream = useStream();

stream.on('emojiAdded', emojiData => {
	customEmojis.value = [emojiData.emoji, ...customEmojis.value];
	set('emojis', customEmojis.value);
});

stream.on('emojiUpdated', emojiData => {
	customEmojis.value = customEmojis.value.map(item => emojiData.emojis.find(search => search.name === item.name) as Misskey.entities.CustomEmoji ?? item);
	set('emojis', customEmojis.value);
});

stream.on('emojiDeleted', emojiData => {
	customEmojis.value = customEmojis.value.filter(item => !emojiData.emojis.some(search => search.name === item.name));
	set('emojis', customEmojis.value);
});

export async function fetchCustomEmojis(force = false) {
	const now = Date.now();

	let res;
	if (force) {
		res = await api('emojis', {});
	} else {
		const lastFetchedAt = await get('lastEmojisFetchedAt');
		if (lastFetchedAt && (now - lastFetchedAt) < 1000 * 60 * 60) return;
		res = await apiGet('emojis', {});
	}

	customEmojis.value = res.emojis;
	set('emojis', res.emojis);
	set('lastEmojisFetchedAt', now);
}

let cachedTags;
export function getCustomEmojiTags() {
	if (cachedTags) return cachedTags;

	const tags = new Set();
	for (const emoji of customEmojis.value) {
		for (const tag of emoji.aliases) {
			tags.add(tag);
		}
	}
	const res = Array.from(tags);
	cachedTags = res;
	return res;
}
