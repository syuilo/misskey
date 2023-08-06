<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="omfetrab" :class="['s' + size, 'w' + width, 'h' + height, { asDrawer, asWindow }]" :style="{ maxHeight: maxHeight ? maxHeight + 'px' : undefined }">
	<input ref="searchEl" :value="q" class="search" data-prevent-emoji-insert :class="{ filled: q != null && q != '' }" :placeholder="i18n.ts.search" type="search" @input="input()" @paste.stop="paste" @keydown.stop.prevent.enter="onEnter">
	<!-- FirefoxのTabフォーカスが想定外の挙動となるためtabindex="-1"を追加 https://github.com/misskey-dev/misskey/issues/10744 -->
	<div ref="emojisEl" class="emojis" tabindex="-1">
		<section class="result">
			<div v-if="searchResultCustom.length > 0" class="body">
				<button
					v-for="emoji in searchResultCustom"
					:key="emoji.name"
					class="_button item"
					:title="emoji.name"
					tabindex="0"
					@click="chosen(emoji, $event)"
				>
					<MkCustomEmoji class="emoji" :name="emoji.name"/>
				</button>
			</div>
			<div v-if="searchResultUnicode.length > 0" class="body">
				<button
					v-for="emoji in searchResultUnicode"
					:key="emoji.name"
					class="_button item"
					:title="emoji.name"
					tabindex="0"
					@click="chosen(emoji, $event)"
				>
					<MkEmoji class="emoji" :emoji="emoji.char"/>
				</button>
			</div>
		</section>

		<div v-if="tab === 'index'" class="group index">
			<section v-if="showPinned">
				<div class="body">
					<button
						v-for="emoji in pinned"
						:key="emoji"
						:data-emoji="emoji"
						class="_button item"
						tabindex="0"
						@pointerenter="computeButtonTitle"
						@click="chosen(emoji, $event)"
					>
						<MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true"/>
						<MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
					</button>
				</div>
			</section>

			<section>
				<header class="_acrylic"><i class="ti ti-clock ti-fw"></i> {{ i18n.ts.recentUsed }}</header>
				<div class="body">
					<button
						v-for="emoji in recentlyUsedEmojis"
						:key="emoji"
						class="_button item"
						:data-emoji="emoji"
						@pointerenter="computeButtonTitle"
						@click="chosen(emoji, $event)"
					>
						<MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true"/>
						<MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
					</button>
				</div>
			</section>
		</div>
		<div v-once class="group">
			<header class="_acrylic">{{ i18n.ts.customEmojis }}</header>
			<XSection
				v-for="category in customEmojiCategories"
				:key="`custom:${category}`"
				:initialShown="false"
				:emojis="computed(() => customEmojis.filter(e => category === null ? (e.category === 'null' || !e.category) : e.category === category).filter(filterAvailable).map(e => `:${e.name}:`))"
				@chosen="chosen"
			>
				{{ category || i18n.ts.other }}
			</XSection>
		</div>
		<div v-once class="group">
			<header class="_acrylic">{{ i18n.ts.emoji }}</header>
			<XSection v-for="category in categories" :key="category" :emojis="emojiCharByCategory.get(category) ?? []" @chosen="chosen">{{ category }}</XSection>
		</div>
	</div>
	<div class="tabs">
		<button class="_button tab" :class="{ active: tab === 'index' }" @click="tab = 'index'"><i class="ti ti-asterisk ti-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'custom' }" @click="tab = 'custom'"><i class="ti ti-mood-happy ti-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'unicode' }" @click="tab = 'unicode'"><i class="ti ti-leaf ti-fw"></i></button>
		<button class="_button tab" :class="{ active: tab === 'tags' }" @click="tab = 'tags'"><i class="ti ti-hash ti-fw"></i></button>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref, shallowRef, computed, watch, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import XSection from '@/components/MkEmojiPicker.section.vue';
import { emojilist, emojiCharByCategory, UnicodeEmojiDef, unicodeEmojiCategories as categories, getEmojiName } from '@/scripts/emojilist';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import * as os from '@/os';
import { isTouchUsing } from '@/scripts/touch';
import { deviceKind } from '@/scripts/device-kind';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';
import { customEmojiCategories, customEmojis, customEmojisMap } from '@/custom-emojis';
import { $i } from '@/account';

const props = withDefaults(defineProps<{
	showPinned?: boolean;
	asReactionPicker?: boolean;
	maxHeight?: number;
	asDrawer?: boolean;
	asWindow?: boolean;
}>(), {
	showPinned: true,
});

const emit = defineEmits<{
	(ev: 'chosen', v: string): void;
}>();

const searchEl = shallowRef<HTMLInputElement>();
const emojisEl = shallowRef<HTMLDivElement>();

const {
	reactions: pinned,
	reactionPickerSize,
	reactionPickerWidth,
	reactionPickerHeight,
	disableShowingAnimatedImages,
	recentlyUsedEmojis,
} = defaultStore.reactiveState;

const size = computed(() => props.asReactionPicker ? reactionPickerSize.value : 1);
const width = computed(() => props.asReactionPicker ? reactionPickerWidth.value : 3);
const height = computed(() => props.asReactionPicker ? reactionPickerHeight.value : 2);
const q = ref<string>('');
const searchResultCustom = ref<Misskey.entities.CustomEmoji[]>([]);
const searchResultUnicode = ref<UnicodeEmojiDef[]>([]);
const tab = ref<'index' | 'custom' | 'unicode' | 'tags'>('index');

watch(q, () => {
	if (emojisEl.value) emojisEl.value.scrollTop = 0;

	if (q.value === '') {
		searchResultCustom.value = [];
		searchResultUnicode.value = [];
		return;
	}

	const newQ = q.value.replace(/:/g, '').toLowerCase();

	const searchCustom = () => {
		const max = 100;
		const emojis = customEmojis.value;
		const matches = new Set<Misskey.entities.CustomEmoji>();

		const exactMatch = emojis.find(emoji => emoji.name === newQ);
		if (exactMatch) matches.add(exactMatch);

		if (newQ.includes(' ')) { // AND検索
			const keywords = newQ.split(' ');

			// 名前にキーワードが含まれている
			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			// 名前またはエイリアスにキーワードが含まれている
			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword) || emoji.aliases.some(alias => alias.includes(keyword)))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
		} else {
			for (const emoji of emojis) {
				if (emoji.name.startsWith(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.aliases.some(alias => alias.startsWith(newQ))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.name.includes(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const emoji of emojis) {
				if (emoji.aliases.some(alias => alias.includes(newQ))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
		}

		return matches;
	};

	const searchUnicode = () => {
		const max = 100;
		const emojis = emojilist;
		const matches = new Set<UnicodeEmojiDef>();

		const exactMatch = emojis.find(emoji => emoji.name === newQ);
		if (exactMatch) matches.add(exactMatch);

		if (newQ.includes(' ')) { // AND検索
			const keywords = newQ.split(' ');

			for (const emoji of emojis) {
				if (keywords.every(keyword => emoji.name.includes(keyword))) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const index of Object.values(defaultStore.state.additionalUnicodeEmojiIndexes)) {
				for (const emoji of emojis) {
					if (keywords.every(keyword => index[emoji.char].some(k => k.includes(keyword)))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
			}
		} else {
			for (const emoji of emojis) {
				if (emoji.name.startsWith(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const index of Object.values(defaultStore.state.additionalUnicodeEmojiIndexes)) {
				for (const emoji of emojis) {
					if (index[emoji.char].some(k => k.startsWith(newQ))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
			}

			for (const emoji of emojis) {
				if (emoji.name.includes(newQ)) {
					matches.add(emoji);
					if (matches.size >= max) break;
				}
			}
			if (matches.size >= max) return matches;

			for (const index of Object.values(defaultStore.state.additionalUnicodeEmojiIndexes)) {
				for (const emoji of emojis) {
					if (index[emoji.char].some(k => k.includes(newQ))) {
						matches.add(emoji);
						if (matches.size >= max) break;
					}
				}
			}
		}

		return matches;
	};

	searchResultCustom.value = Array.from(searchCustom()).filter(filterAvailable);
	searchResultUnicode.value = Array.from(searchUnicode());
});

function filterAvailable(emoji: Misskey.entities.CustomEmoji): boolean {
	return (emoji.roleIdsThatCanBeUsedThisEmojiAsReaction == null || emoji.roleIdsThatCanBeUsedThisEmojiAsReaction.length === 0) || ($i && $i.roles.some(r => emoji.roleIdsThatCanBeUsedThisEmojiAsReaction.includes(r.id)));
}

function focus() {
	if (!['smartphone', 'tablet'].includes(deviceKind) && !isTouchUsing) {
		searchEl.value?.focus({
			preventScroll: true,
		});
	}
}

function reset() {
	if (emojisEl.value) emojisEl.value.scrollTop = 0;
	q.value = '';
}

function getKey(emoji: string | Misskey.entities.CustomEmoji | UnicodeEmojiDef): string {
	return typeof emoji === 'string' ? emoji : 'char' in emoji ? emoji.char : `:${emoji.name}:`;
}

/** @see MkEmojiPicker.section.vue */
function computeButtonTitle(ev: MouseEvent): void {
	const elm = ev.target as HTMLElement;
	const emoji = elm.dataset.emoji as string;
	elm.title = getEmojiName(emoji) ?? emoji;
}

function chosen(emoji: any, ev?: MouseEvent) {
	const el = ev && (ev.currentTarget ?? ev.target) as HTMLElement | null | undefined;
	if (el) {
		const rect = el.getBoundingClientRect();
		const x = rect.left + (el.offsetWidth / 2);
		const y = rect.top + (el.offsetHeight / 2);
		os.popup(MkRippleEffect, { x, y }, {}, 'end');
	}

	const key = getKey(emoji);
	emit('chosen', key);

	// 最近使った絵文字更新
	if (!pinned.value.includes(key)) {
		let recents = defaultStore.state.recentlyUsedEmojis;
		recents = recents.filter((emoji: any) => emoji !== key);
		recents.unshift(key);
		defaultStore.set('recentlyUsedEmojis', recents.splice(0, 32));
	}
}

function input(): void {
	// Using custom input event instead of v-model to respond immediately on
	// Android, where composition happens on all languages
	// (v-model does not update during composition)
	q.value = searchEl.value?.value.trim() ?? '';
}

function paste(event: ClipboardEvent): void {
	const pasted = event.clipboardData?.getData('text') ?? '';
	if (done(pasted)) {
		event.preventDefault();
	}
}

function onEnter(ev: KeyboardEvent) {
	if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) return;
	done();
}

function done(query?: string): boolean | void {
	if (query == null) query = q.value;
	if (query == null || typeof query !== 'string') return;

	const q2 = query.replace(/:/g, '');
	const exactMatchCustom = customEmojisMap.get(q2);
	if (exactMatchCustom) {
		chosen(exactMatchCustom);
		return true;
	}
	const exactMatchUnicode = emojilist.find(emoji => emoji.char === q2 || emoji.name === q2);
	if (exactMatchUnicode) {
		chosen(exactMatchUnicode);
		return true;
	}
	if (searchResultCustom.value.length > 0) {
		chosen(searchResultCustom.value[0]);
		return true;
	}
	if (searchResultUnicode.value.length > 0) {
		chosen(searchResultUnicode.value[0]);
		return true;
	}
}

onMounted(() => {
	focus();
});

defineExpose({
	focus,
	reset,
});
</script>

<style lang="scss" scoped>
.omfetrab {
	$pad: 8px;

	display: flex;
	flex-direction: column;

	&.s1 {
		--eachSize: 40px;
	}

	&.s2 {
		--eachSize: 45px;
	}

	&.s3 {
		--eachSize: 50px;
	}

	&.w1 {
		width: calc((var(--eachSize) * 5) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr;
	}

	&.w2 {
		width: calc((var(--eachSize) * 6) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	&.w3 {
		width: calc((var(--eachSize) * 7) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	&.w4 {
		width: calc((var(--eachSize) * 8) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	&.w5 {
		width: calc((var(--eachSize) * 9) + (#{$pad} * 2));
		--columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
	}

	&.h1 {
		height: calc((var(--eachSize) * 4) + (#{$pad} * 2));
	}

	&.h2 {
		height: calc((var(--eachSize) * 6) + (#{$pad} * 2));
	}

	&.h3 {
		height: calc((var(--eachSize) * 8) + (#{$pad} * 2));
	}

	&.h4 {
		height: calc((var(--eachSize) * 10) + (#{$pad} * 2));
	}

	&.asDrawer {
		width: 100% !important;

		> .emojis {
			::v-deep(section) {
				> header {
					height: 32px;
					line-height: 32px;
					padding: 0 12px;
					font-size: 15px;
				}

				> .body {
					display: grid;
					grid-template-columns: var(--columns);
					font-size: 30px;

					> .item {
						aspect-ratio: 1 / 1;
						width: auto;
						height: auto;
						min-width: 0;
					}
				}
			}
		}
	}

	&.asWindow {
		width: 100% !important;
		height: 100% !important;

		> .emojis {
			::v-deep(section) {
				> .body {
					display: grid;
					grid-template-columns: var(--columns);
					font-size: 30px;

					> .item {
						aspect-ratio: 1 / 1;
						width: auto;
						height: auto;
						min-width: 0;
					}
				}
			}
		}
	}

	> .search {
		width: 100%;
		padding: 12px;
		box-sizing: border-box;
		font-size: 1em;
		outline: none;
		border: none;
		background: transparent;
		color: var(--fg);

		&:not(:focus):not(.filled) {
			margin-bottom: env(safe-area-inset-bottom, 0px);
		}

		&:not(.filled) {
			order: 1;
			z-index: 2;
			box-shadow: 0px -1px 0 0px var(--divider);
		}
	}

	> .tabs {
		display: flex;
		display: none;

		> .tab {
			flex: 1;
			height: 38px;
			border-top: solid 0.5px var(--divider);

			&.active {
				border-top: solid 1px var(--accent);
				color: var(--accent);
			}
		}
	}

	> .emojis {
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;

		scrollbar-width: none;

		&::-webkit-scrollbar {
			display: none;
		}

		> .group {
			&:not(.index) {
				padding: 4px 0 8px 0;
				border-top: solid 0.5px var(--divider);
			}

			> header {
				/*position: sticky;
				top: 0;
				left: 0;*/
				height: 32px;
				line-height: 32px;
				z-index: 2;
				padding: 0 8px;
				font-size: 12px;
			}
		}

		::v-deep(section) {
			> header {
				position: sticky;
				top: 0;
				left: 0;
				height: 32px;
				line-height: 32px;
				z-index: 1;
				padding: 0 8px;
				font-size: 12px;
				cursor: pointer;

				&:hover {
					color: var(--accent);
				}
			}

			> .body {
				position: relative;
				padding: $pad;

				> .item {
					position: relative;
					padding: 0;
					width: var(--eachSize);
					height: var(--eachSize);
					contain: strict;
					border-radius: 4px;
					font-size: 24px;

					&:focus-visible {
						outline: solid 2px var(--focus);
						z-index: 1;
					}

					&:hover {
						background: rgba(0, 0, 0, 0.05);
					}

					&:active {
						background: var(--accent);
						box-shadow: inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15);
					}

					> .emoji {
						height: 1.25em;
						vertical-align: -.25em;
						pointer-events: none;
					}
				}
			}

			&.result {
				border-bottom: solid 0.5px var(--divider);

				&:empty {
					display: none;
				}
			}
		}
	}
}
</style>
