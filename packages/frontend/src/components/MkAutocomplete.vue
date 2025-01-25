<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div ref="rootEl" :class="$style.root" class="_popup _shadow" :style="{ zIndex }" @contextmenu.prevent="() => {}">
		<ol v-if="type === 'user'" ref="suggests" :class="$style.list">
			<li v-for="user in users" tabindex="-1" :class="$style.item" @click="complete(type, user)" @keydown="onKeydown">
				<img :class="$style.avatar" :src="user.avatarUrl"/>
				<span :class="$style.userName">
				<MkUserName :key="user.id" :user="user"/>
			</span>
				<span>@{{ acct(user) }}</span>
			</li>
			<li tabindex="-1" :class="$style.item" @click="chooseUser()" @keydown="onKeydown">{{ i18n.ts.selectUser }}</li>
		</ol>
		<ol v-else-if="type === 'hashtag' && hashtags.length > 0" ref="suggests" :class="$style.list">
			<li v-for="hashtag in hashtags" tabindex="-1" :class="$style.item" @click="complete(type, hashtag)" @keydown="onKeydown">
				<span class="name">{{ hashtag }}</span>
			</li>
		</ol>
		<ol v-else-if="type === 'emoji' || type === 'emojiComplete' && emojis.length > 0" ref="suggests" :class="$style.list">
			<li v-for="emoji in emojis" :key="emoji.emoji" :class="$style.item" tabindex="-1" @click="complete(type, emoji.emoji)" @keydown="onKeydown">
				<MkCustomEmoji v-if="'isCustomEmoji' in emoji && emoji.isCustomEmoji" :name="emoji.emoji" :class="$style.emoji" :fallbackToImage="true"/>
				<MkEmoji v-else :emoji="emoji.emoji" :class="$style.emoji"/>
				<!-- eslint-disable-next-line vue/no-v-html -->
				<span v-if="q" :class="$style.emojiName" v-html="sanitizeHtml(emoji.name.replace(q, `<b>${q}</b>`))"></span>
				<span v-else v-text="emoji.name"></span>
				<span v-if="emoji.aliasOf" :class="$style.emojiAlias">({{ emoji.aliasOf }})</span>
			</li>
		</ol>
		<ol v-else-if="type === 'mfmTag' && mfmTags.length > 0" ref="suggests" :class="$style.list">
			<li v-for="tag in mfmTags" tabindex="-1" :class="$style.item" @click="complete(type, tag)" @keydown="onKeydown">
				<span>{{ tag }}</span>
			</li>
		</ol>
		<ol v-else-if="type === 'mfmParam' && mfmParams.length > 0" ref="suggests" :class="$style.list">
			<li v-for="param in mfmParams" tabindex="-1" :class="$style.item" @click="complete(type, q.params.toSpliced(-1, 1, param).join(','))" @keydown="onKeydown">
				<span>{{ param }}</span>
			</li>
		</ol>
	</div>
</template>

<script lang="ts">
import { markRaw, ref, shallowRef, computed, onUpdated, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import sanitizeHtml from 'sanitize-html';
import { emojilist, getEmojiName } from '@@/js/emojilist.js';
import contains from '@/scripts/contains.js';
import { char2twemojiFilePath, char2fluentEmojiFilePath } from '@@/js/emoji-base.js';
import { acct } from '@/filters/user.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { customEmojis } from '@/custom-emojis.js';
import { MFM_TAGS, MFM_PARAMS } from '@@/js/const.js';
import { searchEmoji, searchEmojiExact, EmojiDef } from '@/scripts/search-emoji.js';

export type CompleteInfo = {
	user: {
		payload: any;
		query: string | null;
	},
	hashtag: {
		payload: string;
		query: string;
	},
	// `:emo` -> `:emoji:` or some unicode emoji
	emoji: {
		payload: string;
		query: string;
	},
	// like emoji but for `:emoji:` -> unicode emoji
	emojiComplete: {
		payload: string;
		query: string;
	},
	mfmTag: {
		payload: string;
		query: string;
	},
	mfmParam: {
		payload: string;
		query: {
			tag: string;
			params: string[];
		};
	},
}

const lib = emojilist.filter(x => x.category !== 'flags');

const unicodeEmojiDB = computed(() => {
	const char2path = defaultStore.reactiveState.emojiStyle.value === 'twemoji' ? char2twemojiFilePath : char2fluentEmojiFilePath;

	const unicodeEmojiDB: EmojiDef[] = lib.map(x => ({
		emoji: x.char,
		name: x.name,
		url: char2path(x.char),
	}));

	for (const index of Object.values(defaultStore.state.additionalUnicodeEmojiIndexes)) {
		for (const [emoji, keywords] of Object.entries(index)) {
			for (const k of keywords) {
				unicodeEmojiDB.push({
					emoji: emoji,
					name: k,
					aliasOf: getEmojiName(emoji),
					url: char2path(emoji),
				});
			}
		}
	}

	unicodeEmojiDB.sort((a, b) => a.name.length - b.name.length);

	return unicodeEmojiDB;
});

const emojiDb = computed(() => {
	//#region Unicode Emoji
	//#endregion

	//#region Custom Emoji
	const customEmojiDB: EmojiDef[] = [];

	for (const x of customEmojis.value) {
		customEmojiDB.push({
			name: x.name,
			emoji: `:${x.name}:`,
			isCustomEmoji: true,
		});

		if (x.aliases) {
			for (const alias of x.aliases) {
				customEmojiDB.push({
					name: alias,
					aliasOf: x.name,
					emoji: `:${x.name}:`,
					isCustomEmoji: true,
				});
			}
		}
	}

	customEmojiDB.sort((a, b) => a.name.length - b.name.length);
	//#endregion

	return markRaw([...customEmojiDB, ...unicodeEmojiDB.value]);
});

export default {
	emojiDb,
	emojilist,
};
</script>

<script lang="ts" setup generic="T extends keyof CompleteInfo">
type PropsType<T extends keyof CompleteInfo> = {
	type: T;
	q: CompleteInfo[T]['query'];
	// なぜかわからないけど HTMLTextAreaElement | HTMLInputElement だと addEventListener/removeEventListenerがエラー
	textarea: (HTMLTextAreaElement | HTMLInputElement) & HTMLElement;
	close: () => void;
	x: number;
	y: number;
}
//const props = defineProps<PropsType<keyof CompleteInfo>>();
// ↑と同じだけど↓にしないとdiscriminated unionにならない。
// https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions
const props = defineProps<PropsType<'user'> | PropsType<'hashtag'> | PropsType<'emoji'> | PropsType<'emojiComplete'> | PropsType<'mfmTag'> | PropsType<'mfmParam'>>();

const emit = defineEmits<{
	<T extends keyof CompleteInfo>(event: 'done', value: { type: T; value: CompleteInfo[T]['payload'] }): void;
	(event: 'closed'): void;
}>();

const suggests = ref<Element>();
const rootEl = shallowRef<HTMLDivElement>();

const fetching = ref(true);
const users = ref<any[]>([]);
const hashtags = ref<any[]>([]);
const emojis = ref<(EmojiDef)[]>([]);
const items = ref<Element[] | HTMLCollection>([]);
const mfmTags = ref<string[]>([]);
const mfmParams = ref<string[]>([]);
const select = ref(-1);
const zIndex = os.claimZIndex('high');

function complete<T extends keyof CompleteInfo>(type: T, value: CompleteInfo[T]['payload']) {
	emit('done', { type, value });
	emit('closed');
	if (type === 'emoji' || type === 'emojiComplete') {
		let recents = defaultStore.state.recentlyUsedEmojis;
		recents = recents.filter((emoji: any) => emoji !== value);
		recents.unshift(value);
		defaultStore.set('recentlyUsedEmojis', recents.splice(0, 32));
	}
}

function setPosition() {
	if (!rootEl.value) return;
	if (props.x + rootEl.value.offsetWidth > window.innerWidth) {
		rootEl.value.style.left = (window.innerWidth - rootEl.value.offsetWidth) + 'px';
	} else {
		rootEl.value.style.left = `${props.x}px`;
	}
	if (props.y + rootEl.value.offsetHeight > window.innerHeight) {
		rootEl.value.style.top = (props.y - rootEl.value.offsetHeight) + 'px';
		rootEl.value.style.marginTop = '0';
	} else {
		rootEl.value.style.top = props.y + 'px';
		rootEl.value.style.marginTop = 'calc(1em + 8px)';
	}
}

function exec() {
	select.value = -1;
	if (suggests.value) {
		for (const el of Array.from(items.value)) {
			el.removeAttribute('data-selected');
		}
	}
	if (props.type === 'user') {
		if (!props.q) {
			users.value = [];
			fetching.value = false;
			return;
		}

		const cacheKey = `autocomplete:user:${props.q}`;
		const cache = sessionStorage.getItem(cacheKey);

		if (cache) {
			users.value = JSON.parse(cache);
			fetching.value = false;
		} else {
			misskeyApi('users/search-by-username-and-host', {
				username: props.q,
				limit: 10,
				detail: false,
			}).then(searchedUsers => {
				users.value = searchedUsers as any[];
				fetching.value = false;
				// キャッシュ
				sessionStorage.setItem(cacheKey, JSON.stringify(searchedUsers));
			});
		}
	} else if (props.type === 'hashtag') {
		if (!props.q || props.q === '') {
			hashtags.value = JSON.parse(miLocalStorage.getItem('hashtags') ?? '[]');
			fetching.value = false;
		} else {
			const cacheKey = `autocomplete:hashtag:${props.q}`;
			const cache = sessionStorage.getItem(cacheKey);
			if (cache) {
				const hashtags = JSON.parse(cache);
				hashtags.value = hashtags;
				fetching.value = false;
			} else {
				misskeyApi('hashtags/search', {
					query: props.q,
					limit: 30,
				}).then(searchedHashtags => {
					hashtags.value = searchedHashtags as any[];
					fetching.value = false;
					// キャッシュ
					sessionStorage.setItem(cacheKey, JSON.stringify(searchedHashtags));
				});
			}
		}
	} else if (props.type === 'emoji') {
		if (!props.q || props.q === '') {
			// 最近使った絵文字をサジェスト
			emojis.value = defaultStore.state.recentlyUsedEmojis.map(emoji => emojiDb.value.find(dbEmoji => dbEmoji.emoji === emoji)).filter(x => x) as EmojiDef[];
			return;
		}

		emojis.value = searchEmoji(props.q, emojiDb.value);
	} else if (props.type === 'emojiComplete') {
		emojis.value = searchEmojiExact(props.q, unicodeEmojiDB.value);
	} else if (props.type === 'mfmTag') {
		if (!props.q || props.q === '') {
			mfmTags.value = MFM_TAGS;
			return;
		}

		mfmTags.value = MFM_TAGS.filter(tag => tag.startsWith(props.q ?? ''));
	} else if (props.type === 'mfmParam') {
		if (props.q.params.at(-1) === '') {
			mfmParams.value = MFM_PARAMS[props.q.tag] ?? [];
			return;
		}

		mfmParams.value = MFM_PARAMS[props.q.tag].filter(param => param.startsWith(props.q.params.at(-1) ?? ''));
	}
}

function onMousedown(event: Event) {
	if (!contains(rootEl.value, event.target) && (rootEl.value !== event.target)) props.close();
}

function onKeydown(event: KeyboardEvent) {
	const cancel = () => {
		event.preventDefault();
		event.stopPropagation();
	};

	switch (event.key) {
		case 'Enter':
			if (select.value !== -1) {
				cancel();
				(items.value[select.value] as any).click();
			} else {
				props.close();
			}
			break;

		case 'Escape':
			cancel();
			props.close();
			break;

		case 'ArrowUp':
			if (select.value !== -1) {
				cancel();
				selectPrev();
			} else {
				props.close();
			}
			break;

		case 'ArrowDown':
			cancel();
			selectNext();
			break;

		case 'Tab':
			if (event.shiftKey) {
				if (select.value !== -1) {
					cancel();
					selectPrev();
				} else {
					props.close();
				}
			} else {
				cancel();
				selectNext();
			}
			break;

		default:
			event.stopPropagation();
			props.textarea.focus();
	}
}

function selectNext() {
	if (++select.value >= items.value.length) select.value = 0;
	if (items.value.length === 0) select.value = -1;
	applySelect();
}

function selectPrev() {
	if (--select.value < 0) select.value = items.value.length - 1;
	applySelect();
}

function applySelect() {
	for (const el of Array.from(items.value)) {
		el.removeAttribute('data-selected');
	}

	if (select.value !== -1) {
		items.value[select.value].setAttribute('data-selected', 'true');
		(items.value[select.value] as any).focus();
	}
}

function chooseUser() {
	props.close();
	os.selectUser({ includeSelf: true }).then(user => {
		complete('user', user);
		props.textarea.focus();
	});
}

onUpdated(() => {
	setPosition();
	items.value = suggests.value?.children ?? [];
});

onMounted(() => {
	setPosition();

	props.textarea.addEventListener('keydown', onKeydown);

	document.body.addEventListener('mousedown', onMousedown);

	nextTick(() => {
		exec();

		watch(() => props.q, () => {
			nextTick(() => {
				exec();
			});
		});
	});
});

onBeforeUnmount(() => {
	props.textarea.removeEventListener('keydown', onKeydown);

	document.body.removeEventListener('mousedown', onMousedown);
});
</script>

<style lang="scss" module>
.root {
	position: fixed;
	max-width: 100%;
	margin-top: calc(1em + 8px);
	overflow: clip;
	transition: top 0.1s ease, left 0.1s ease;
}

.list {
	display: block;
	margin: 0;
	padding: 4px 0;
	max-height: 190px;
	max-width: 500px;
	overflow: auto;
	list-style: none;
}

.item {
	display: flex;
	align-items: center;
	padding: 4px 12px;
	white-space: nowrap;
	overflow: clip;
	font-size: 0.9em;
	cursor: default;
	user-select: none;
	overflow: hidden;
	text-overflow: ellipsis;

	&:hover {
		background: var(--MI_THEME-X3);
	}

	&[data-selected='true'] {
		background: var(--MI_THEME-accent);
		color: #fff !important;
	}

	&:active {
		background: var(--MI_THEME-accentDarken);
		color: #fff !important;
	}
}

.avatar {
	min-width: 28px;
	min-height: 28px;
	max-width: 28px;
	max-height: 28px;
	margin: 0 8px 0 0;
	border-radius: 100%;
}

.userName {
	margin: 0 8px 0 0;
}

.emoji {
	flex-shrink: 0 !important;
	display: flex !important;
	margin: 0 4px 0 0 !important;
	height: 24px !important;
	width: 24px !important;
	justify-content: center !important;
	align-items: center !important;
	font-size: 20px !important;
	pointer-events: none !important;
}

.emojiImg {
	height: 24px;
	width: 24px;
	object-fit: scale-down;
}

.emojiName {
	flex-shrink: 1;
}

.emojiAlias {
	flex-shrink: 9999999;
	margin: 0 0 0 8px;
}
</style>
