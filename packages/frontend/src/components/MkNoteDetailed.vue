<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-if="!muted"
	v-show="!isDeleted"
	ref="el"
	v-hotkey="keymap"
	:class="$style.root"
>
	<MkNoteSub v-for="note in conversation" :key="note.id" :class="$style.replyToMore" :note="note"/>
	<MkNoteSub v-if="appearNote.reply" :note="appearNote.reply" :class="$style.replyTo"/>
	<div v-if="isRenote" :class="$style.renote">
		<MkAvatar :class="$style.renoteAvatar" :user="note.user" link preview/>
		<i class="ti ti-repeat" style="margin-right: 4px;"></i>
		<span :class="$style.renoteText">
			<I18n :src="i18n.ts.renotedBy" tag="span">
				<template #user>
					<MkA v-user-preview="note.userId" :class="$style.renoteName" :to="userPage(note.user)">
						<MkUserName :user="note.user"/>
					</MkA>
				</template>
			</I18n>
		</span>
		<div :class="$style.renoteInfo">
			<button ref="renoteTime" class="_button" :class="$style.renoteTime" @click="showRenoteMenu()">
				<i v-if="isMyRenote" class="ti ti-dots" style="margin-right: 4px;"></i>
				<MkTime :time="note.createdAt"/>
			</button>
			<span v-if="note.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[note.visibility]">
				<i v-if="note.visibility === 'home'" class="ti ti-home"></i>
				<i v-else-if="note.visibility === 'followers'" class="ti ti-lock"></i>
				<i v-else-if="note.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
			</span>
			<span v-if="note.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
		</div>
	</div>
	<article :class="$style.note" @contextmenu.stop="onContextmenu">
		<header :class="$style.noteHeader">
			<MkAvatar :class="$style.noteHeaderAvatar" :user="appearNote.user" indicator link preview/>
			<div :class="$style.noteHeaderBody">
				<div>
					<MkA v-user-preview="appearNote.user.id" :class="$style.noteHeaderName" :to="userPage(appearNote.user)">
						<MkUserName :nowrap="false" :user="appearNote.user"/>
					</MkA>
					<span v-if="appearNote.user.isBot" :class="$style.isBot">bot</span>
					<div :class="$style.noteHeaderInfo">
						<span v-if="appearNote.visibility !== 'public'" style="margin-left: 0.5em;" :title="i18n.ts._visibility[appearNote.visibility]">
							<i v-if="appearNote.visibility === 'home'" class="ti ti-home"></i>
							<i v-else-if="appearNote.visibility === 'followers'" class="ti ti-lock"></i>
							<i v-else-if="appearNote.visibility === 'specified'" ref="specified" class="ti ti-mail"></i>
						</span>
						<span v-if="appearNote.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
					</div>
				</div>
				<div :class="$style.noteHeaderUsername"><MkAcct :user="appearNote.user"/></div>
				<MkInstanceTicker v-if="showTicker" :instance="appearNote.user.instance"/>
			</div>
		</header>
		<div :class="$style.noteContent">
			<p v-if="appearNote.cw != null" :class="$style.cw">
				<Mfm v-if="appearNote.cw != ''" style="margin-right: 8px;" :text="appearNote.cw" :author="appearNote.user" :i="$i"/>
				<MkCwButton v-model="showContent" :note="appearNote"/>
			</p>
			<div v-show="appearNote.cw == null || showContent">
				<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
				<MkA v-if="appearNote.replyId" :class="$style.noteReplyTarget" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
				<Mfm v-if="appearNote.text" :text="appearNote.text" :author="appearNote.user" :i="$i" :emojiUrls="appearNote.emojis"/>
				<a v-if="appearNote.renote != null" :class="$style.rn">RN:</a>
				<div v-if="translating || translation" :class="$style.translation">
					<MkLoading v-if="translating" mini/>
					<div v-else>
						<b>{{ i18n.t('translatedFrom', { x: translation.sourceLang }) }}: </b>
						<Mfm :text="translation.text" :author="appearNote.user" :i="$i" :emojiUrls="appearNote.emojis"/>
					</div>
				</div>
				<div v-if="appearNote.files.length > 0">
					<MkMediaList :mediaList="appearNote.files"/>
				</div>
				<MkPoll v-if="appearNote.poll" ref="pollViewer" :note="appearNote" :class="$style.poll"/>
				<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="true" style="margin-top: 6px;"/>
				<div v-if="appearNote.renote" :class="$style.quote"><MkNoteSimple :note="appearNote.renote" :class="$style.quoteNote"/></div>
			</div>
			<MkA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</MkA>
		</div>
		<footer>
			<div :class="$style.noteFooterInfo">
				<MkA :to="notePage(appearNote)">
					<MkTime :time="appearNote.createdAt" mode="detail"/>
				</MkA>
			</div>
			<MkReactionsViewer ref="reactionsViewer" :note="appearNote"/>
			<button class="_button" :class="$style.noteFooterButton" @click="reply()">
				<i class="ti ti-arrow-back-up"></i>
				<p v-if="appearNote.repliesCount > 0" :class="$style.noteFooterButtonCount">{{ appearNote.repliesCount }}</p>
			</button>
			<button
				v-if="canRenote"
				ref="renoteButton"
				class="_button"
				:class="$style.noteFooterButton"
				@mousedown="renote()"
			>
				<i class="ti ti-repeat"></i>
				<p v-if="appearNote.renoteCount > 0" :class="$style.noteFooterButtonCount">{{ appearNote.renoteCount }}</p>
			</button>
			<button v-else class="_button" :class="$style.noteFooterButton" disabled>
				<i class="ti ti-ban"></i>
			</button>
			<button v-if="appearNote.myReaction == null" ref="reactButton" :class="$style.noteFooterButton" class="_button" @mousedown="react()">
				<i v-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
				<i v-else class="ti ti-plus"></i>
			</button>
			<button v-if="appearNote.myReaction != null" ref="reactButton" class="_button" :class="[$style.noteFooterButton, $style.reacted]" @click="undoReact(appearNote)">
				<i class="ti ti-minus"></i>
			</button>
			<button v-if="defaultStore.state.showClipButtonInNoteFooter" ref="clipButton" class="_button" :class="$style.noteFooterButton" @mousedown="clip()">
				<i class="ti ti-paperclip"></i>
			</button>
			<button ref="menuButton" class="_button" :class="$style.noteFooterButton" @mousedown="menu()">
				<i class="ti ti-dots"></i>
			</button>
		</footer>
	</article>
	<MkNoteSub v-for="note in replies" :key="note.id" :note="note" :class="$style.reply" :detail="true"/>
</div>
<div v-else class="_panel" :class="$style.muted" @click="muted = false">
	<I18n :src="i18n.ts.userSaysSomething" tag="small">
		<template #name>
			<MkA v-user-preview="appearNote.userId" :to="userPage(appearNote.user)">
				<MkUserName :user="appearNote.user"/>
			</MkA>
		</template>
	</I18n>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, inject, onMounted, ref, shallowRef } from 'vue';
import * as mfm from 'mfm-js';
import * as misskey from 'misskey-js';
import MkNoteSub from '@/components/MkNoteSub.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkReactionsViewer from '@/components/MkReactionsViewer.vue';
import MkMediaList from '@/components/MkMediaList.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import MkPoll from '@/components/MkPoll.vue';
import MkUsersTooltip from '@/components/MkUsersTooltip.vue';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import MkInstanceTicker from '@/components/MkInstanceTicker.vue';
import { pleaseLogin } from '@/scripts/please-login';
import { checkWordMute } from '@/scripts/check-word-mute';
import { userPage } from '@/filters/user';
import { notePage } from '@/filters/note';
import * as os from '@/os';
import { defaultStore, noteViewInterruptors } from '@/store';
import { reactionPicker } from '@/scripts/reaction-picker';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { getNoteClipMenu, getNoteMenu } from '@/scripts/get-note-menu';
import { useNoteCapture } from '@/scripts/use-note-capture';
import { deepClone } from '@/scripts/clone';
import { useTooltip } from '@/scripts/use-tooltip';
import { claimAchievement } from '@/scripts/achievements';
import { MenuItem } from '@/types/menu';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { showMovedDialog } from '@/scripts/show-moved-dialog';

const props = defineProps<{
	note: misskey.entities.Note;
	pinned?: boolean;
}>();

const inChannel = inject('inChannel', null);

let note = $ref(deepClone(props.note));

// plugin
if (noteViewInterruptors.length > 0) {
	onMounted(async () => {
		let result = deepClone(note);
		for (const interruptor of noteViewInterruptors) {
			result = await interruptor.handler(result);
		}
		note = result;
	});
}

const isRenote = (
	note.renote != null &&
	note.text == null &&
	note.fileIds.length === 0 &&
	note.poll == null
);

const el = shallowRef<HTMLElement>();
const menuButton = shallowRef<HTMLElement>();
const renoteButton = shallowRef<HTMLElement>();
const renoteTime = shallowRef<HTMLElement>();
const reactButton = shallowRef<HTMLElement>();
const clipButton = shallowRef<HTMLElement>();
let appearNote = $computed(() => isRenote ? note.renote as misskey.entities.Note : note);
const isMyRenote = $i && ($i.id === note.userId);
const showContent = ref(false);
const isDeleted = ref(false);
const muted = ref(checkWordMute(appearNote, $i, defaultStore.state.mutedWords));
const translation = ref(null);
const translating = ref(false);
const urls = appearNote.text ? extractUrlFromMfm(mfm.parse(appearNote.text)) : null;
const showTicker = (defaultStore.state.instanceTicker === 'always') || (defaultStore.state.instanceTicker === 'remote' && appearNote.user.instance);
const conversation = ref<misskey.entities.Note[]>([]);
const replies = ref<misskey.entities.Note[]>([]);
const canRenote = computed(() => ['public', 'home'].includes(appearNote.visibility) || appearNote.userId === $i.id);

const keymap = {
	'r': () => reply(true),
	'e|a|plus': () => react(true),
	'q': () => renoteButton.value.renote(true),
	'esc': blur,
	'm|o': () => menu(true),
	's': () => showContent.value !== showContent.value,
};

useNoteCapture({
	rootEl: el,
	note: $$(appearNote),
	isDeletedRef: isDeleted,
});

useTooltip(renoteButton, async (showing) => {
	const renotes = await os.api('notes/renotes', {
		noteId: appearNote.id,
		limit: 11,
	});

	const users = renotes.map(x => x.user);

	if (users.length < 1) return;

	os.popup(MkUsersTooltip, {
		showing,
		users,
		count: appearNote.renoteCount,
		targetElement: renoteButton.value,
	}, {}, 'closed');
});

function renote(viaKeyboard = false) {
	pleaseLogin();
	showMovedDialog();

	let items = [] as MenuItem[];

	if (appearNote.channel) {
		items = items.concat([{
			text: i18n.ts.inChannelRenote,
			icon: 'ti ti-repeat',
			action: () => {
				const el = renoteButton.value as HTMLElement | null | undefined;
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + (el.offsetWidth / 2);
					const y = rect.top + (el.offsetHeight / 2);
					os.popup(MkRippleEffect, { x, y }, {}, 'end');
				}

				os.api('notes/create', {
					renoteId: appearNote.id,
					channelId: appearNote.channelId,
				}).then(() => {
					os.toast(i18n.ts.renoted);
				});
			},
		}, {
			text: i18n.ts.inChannelQuote,
			icon: 'ti ti-quote',
			action: () => {
				os.post({
					renote: appearNote,
					channel: appearNote.channel,
				});
			},
		}, null]);
	}

	items = items.concat([{
		text: i18n.ts.renote,
		icon: 'ti ti-repeat',
		action: () => {
			const el = renoteButton.value as HTMLElement | null | undefined;
			if (el) {
				const rect = el.getBoundingClientRect();
				const x = rect.left + (el.offsetWidth / 2);
				const y = rect.top + (el.offsetHeight / 2);
				os.popup(MkRippleEffect, { x, y }, {}, 'end');
			}

			os.api('notes/create', {
				renoteId: appearNote.id,
			}).then(() => {
				os.toast(i18n.ts.renoted);
			});
		},
	}, {
		text: i18n.ts.quote,
		icon: 'ti ti-quote',
		action: () => {
			os.post({
				renote: appearNote,
			});
		},
	}]);

	os.popupMenu(items, renoteButton.value, {
		viaKeyboard,
	});
}

function reply(viaKeyboard = false): void {
	pleaseLogin();
	showMovedDialog();
	os.post({
		reply: appearNote,
		channel: appearNote.channel,
		animation: !viaKeyboard,
	}, () => {
		focus();
	});
}

function react(viaKeyboard = false): void {
	pleaseLogin();
	showMovedDialog();
	if (appearNote.reactionAcceptance === 'likeOnly') {
		os.api('notes/reactions/create', {
			noteId: appearNote.id,
			reaction: '❤️',
		});
		const el = reactButton.value as HTMLElement | null | undefined;
		if (el) {
			const rect = el.getBoundingClientRect();
			const x = rect.left + (el.offsetWidth / 2);
			const y = rect.top + (el.offsetHeight / 2);
			os.popup(MkRippleEffect, { x, y }, {}, 'end');
		}
	} else {
		blur();
		reactionPicker.show(reactButton.value, reaction => {
			os.api('notes/reactions/create', {
				noteId: appearNote.id,
				reaction: reaction,
			});
			if (appearNote.text && appearNote.text.length > 100 && (Date.now() - new Date(appearNote.createdAt).getTime() < 1000 * 3)) {
				claimAchievement('reactWithoutRead');
			}
		}, () => {
			focus();
		});
	}
}

function undoReact(note): void {
	const oldReaction = note.myReaction;
	if (!oldReaction) return;
	os.api('notes/reactions/delete', {
		noteId: note.id,
	});
}

function onContextmenu(ev: MouseEvent): void {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target)) return;
	if (window.getSelection().toString() !== '') return;

	if (defaultStore.state.useReactionPickerForContextMenu) {
		ev.preventDefault();
		react();
	} else {
		const { menu, cleanup } = getNoteMenu({ note: note, translating, translation, menuButton, isDeleted });
		os.contextMenu(menu, ev).then(focus).finally(cleanup);
	}
}

function menu(viaKeyboard = false): void {
	const { menu, cleanup } = getNoteMenu({ note: note, translating, translation, menuButton, isDeleted });
	os.popupMenu(menu, menuButton.value, {
		viaKeyboard,
	}).then(focus).finally(cleanup);
}

async function clip() {
	os.popupMenu(await getNoteClipMenu({ note: note, isDeleted }), clipButton.value).then(focus);
}

function showRenoteMenu(viaKeyboard = false): void {
	if (!isMyRenote) return;
	pleaseLogin();
	os.popupMenu([{
		text: i18n.ts.unrenote,
		icon: 'ti ti-trash',
		danger: true,
		action: () => {
			os.api('notes/delete', {
				noteId: note.id,
			});
			isDeleted.value = true;
		},
	}], renoteTime.value, {
		viaKeyboard: viaKeyboard,
	});
}

function focus() {
	el.value.focus();
}

function blur() {
	el.value.blur();
}

os.api('notes/children', {
	noteId: appearNote.id,
	limit: 30,
}).then(res => {
	replies.value = res;
});

if (appearNote.replyId) {
	os.api('notes/conversation', {
		noteId: appearNote.replyId,
	}).then(res => {
		conversation.value = res.reverse();
	});
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	transition: box-shadow 0.1s ease;
	overflow: clip;
	contain: content;
}

.replyTo {
	opacity: 0.7;
	padding-bottom: 0;
}

.replyToMore {
	opacity: 0.7;
}

.renote {
	display: flex;
	align-items: center;
	padding: 16px 32px 8px 32px;
	line-height: 28px;
	white-space: pre;
	color: var(--renote);
}

.renoteAvatar {
	flex-shrink: 0;
	display: inline-block;
	width: 28px;
	height: 28px;
	margin: 0 8px 0 0;
	border-radius: 6px;
}

.renoteText {
	overflow: hidden;
	flex-shrink: 1;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.renoteName {
	font-weight: bold;
}

.renoteInfo {
	margin-left: auto;
	font-size: 0.9em;
}

.renoteTime {
	flex-shrink: 0;
	color: inherit;
}

.renote + .note {
	padding-top: 8px;
}

.note {
	padding: 32px;
	font-size: 1.2em;

	&:hover > .main > .footer > .button {
		opacity: 1;
	}
}

.noteHeader {
	display: flex;
	position: relative;
	margin-bottom: 16px;
	align-items: center;
}

.noteHeaderAvatar {
	display: block;
	flex-shrink: 0;
	width: 58px;
	height: 58px;
}

.noteHeaderBody {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding-left: 16px;
	font-size: 0.95em;
}

.noteHeaderName {
	font-weight: bold;
	line-height: 1.3;
}

.isBot {
	display: inline-block;
	margin: 0 0.5em;
	padding: 4px 6px;
	font-size: 80%;
	line-height: 1;
	border: solid 0.5px var(--divider);
	border-radius: 4px;
}

.noteHeaderInfo {
	float: right;
}

.noteHeaderUsername {
	margin-bottom: 2px;
	line-height: 1.3;
	word-wrap: anywhere;
}

.noteContent {
	container-type: inline-size;
	overflow-wrap: break-word;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.noteReplyTarget {
	color: var(--accent);
	margin-right: 0.5em;
}

.rn {
	margin-left: 4px;
	font-style: oblique;
	color: var(--renote);
}

.translation {
	border: solid 0.5px var(--divider);
	border-radius: var(--radius);
	padding: 12px;
	margin-top: 8px;
}

.poll {
	font-size: 80%;
}

.quote {
	padding: 8px 0;
}

.quoteNote {
	padding: 16px;
	border: dashed 1px var(--renote);
	border-radius: 8px;
	overflow: clip;
}

.channel {
	opacity: 0.7;
	font-size: 80%;
}

.noteFooterInfo {
	margin: 16px 0;
	opacity: 0.7;
	font-size: 0.9em;
}

.noteFooterButton {
	margin: 0;
	padding: 8px;
	opacity: 0.7;

	&:not(:last-child) {
		margin-right: 28px;
	}

	&:hover {
		color: var(--fgHighlighted);
	}
}

.noteFooterButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;

	&.reacted {
		color: var(--accent);
	}
}

.reply {
	border-top: solid 0.5px var(--divider);
}

@container (max-width: 500px) {
	.root {
		font-size: 0.9em;
	}
}

@container (max-width: 450px) {
	.renote {
		padding: 8px 16px 0 16px;
	}

	.note {
		padding: 16px;
	}

	.noteHeaderAvatar {
		width: 50px;
		height: 50px;
	}
}

@container (max-width: 350px) {
	.noteFooterButton {
		&:not(:last-child) {
			margin-right: 18px;
		}
	}
}

@container (max-width: 300px) {
	.root {
		font-size: 0.825em;
	}

	.noteHeaderAvatar {
		width: 50px;
		height: 50px;
	}

	.noteFooterButton {
		&:not(:last-child) {
			margin-right: 12px;
		}
	}
}

.muted {
	padding: 8px;
	text-align: center;
	opacity: 0.7;
}
</style>
