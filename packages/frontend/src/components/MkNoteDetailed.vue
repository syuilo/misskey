<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-if="!muted"
	v-show="!isDeleted"
	ref="rootEl"
	v-hotkey="keymap"
	:class="$style.root"
	:tabindex="isDeleted ? '-1' : '0'"
>
	<div v-if="appearNote.reply && appearNote.reply.replyId">
		<div v-if="!conversationLoaded" style="padding: 16px">
			<MkButton style="margin: 0 auto;" primary rounded @click="loadConversation">{{ i18n.ts.loadConversation }}</MkButton>
		</div>
		<MkNoteSub v-for="note in conversation" :key="note.id" :class="$style.replyToMore" :note="note"/>
	</div>
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
			<button ref="renoteTime" class="_button" :class="$style.renoteTime" @mousedown.prevent="showRenoteMenu()">
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
				<div :class="$style.noteHeaderUsernameAndBadgeRoles">
					<div :class="$style.noteHeaderUsername">
						<MkAcct :user="appearNote.user"/>
					</div>
					<div v-if="appearNote.user.badgeRoles" :class="$style.noteHeaderBadgeRoles">
						<img v-for="(role, i) in appearNote.user.badgeRoles" :key="i" v-tooltip="role.name" :class="$style.noteHeaderBadgeRole" :src="role.iconUrl!"/>
					</div>
				</div>
				<MkInstanceTicker v-if="showTicker" :host="appearNote.user.host" :instance="appearNote.user.instance"/>
			</div>
		</header>
		<div :class="$style.noteContent">
			<p v-if="appearNote.cw != null" :class="$style.cw">
				<Mfm
					v-if="appearNote.cw != ''"
					:text="appearNote.cw"
					:author="appearNote.user"
					:nyaize="'respect'"
					:enableEmojiMenu="true"
					:enableEmojiMenuReaction="true"
				/>
				<MkCwButton v-model="showContent" :text="appearNote.text" :renote="appearNote.renote" :files="appearNote.files" :poll="appearNote.poll"/>
			</p>
			<div v-show="appearNote.cw == null || showContent">
				<span v-if="appearNote.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
				<MkA v-if="appearNote.replyId" :class="$style.noteReplyTarget" :to="`/notes/${appearNote.replyId}`"><i class="ti ti-arrow-back-up"></i></MkA>
				<Mfm
					v-if="appearNote.text"
					:parsedNodes="parsed"
					:text="appearNote.text"
					:author="appearNote.user"
					:nyaize="'respect'"
					:emojiUrls="appearNote.emojis"
					:enableEmojiMenu="true"
					:enableEmojiMenuReaction="true"
				/>
				<a v-if="appearNote.renote != null" :class="$style.rn">RN:</a>
				<div v-if="translating || translation" :class="$style.translation">
					<MkLoading v-if="translating" mini/>
					<div v-else-if="translation">
						<b>{{ i18n.tsx.translatedFrom({ x: translation.sourceLang }) }}: </b>
						<Mfm :text="translation.text" :author="appearNote.user" :nyaize="'respect'" :emojiUrls="appearNote.emojis"/>
					</div>
				</div>
				<div v-if="appearNote.files && appearNote.files.length > 0">
					<MkMediaList ref="galleryEl" :mediaList="appearNote.files"/>
				</div>
				<MkPoll v-if="appearNote.poll" ref="pollViewer" :noteId="appearNote.id" :poll="appearNote.poll" :class="$style.poll" :author="appearNote.user" :emojiUrls="appearNote.emojis"/>
				<div v-if="isEnabledUrlPreview">
					<MkUrlPreview v-for="url in urls" :key="url" :url="url" :compact="true" :detail="true" style="margin-top: 6px;"/>
				</div>
				<div v-if="appearNote.renote" :class="$style.quote"><MkNoteSimple :note="appearNote.renote" :class="$style.quoteNote"/></div>
			</div>
			<MkA v-if="appearNote.channel && !inChannel" :class="$style.channel" :to="`/channels/${appearNote.channel.id}`"><i class="ti ti-device-tv"></i> {{ appearNote.channel.name }}</MkA>
		</div>
		<footer>
			<div :class="$style.noteFooterInfo">
				<MkA :to="notePage(appearNote)">
					<MkTime :time="appearNote.createdAt" mode="detail" colored/>
				</MkA>
			</div>
			<MkReactionsViewer v-if="appearNote.reactionAcceptance !== 'likeOnly'" ref="reactionsViewer" :note="appearNote"/>
			<button class="_button" :class="$style.noteFooterButton" @click="reply()">
				<i class="ti ti-arrow-back-up"></i>
				<p v-if="appearNote.repliesCount > 0" :class="$style.noteFooterButtonCount">{{ number(appearNote.repliesCount) }}</p>
			</button>
			<button
				v-if="canRenote"
				ref="renoteButton"
				class="_button"
				:class="$style.noteFooterButton"
				@mousedown.prevent="renote()"
			>
				<i class="ti ti-repeat"></i>
				<p v-if="appearNote.renoteCount > 0" :class="$style.noteFooterButtonCount">{{ number(appearNote.renoteCount) }}</p>
			</button>
			<button v-else class="_button" :class="$style.noteFooterButton" disabled>
				<i class="ti ti-ban"></i>
			</button>
			<button ref="reactButton" :class="$style.noteFooterButton" class="_button" @click="toggleReact()">
				<i v-if="appearNote.reactionAcceptance === 'likeOnly' && appearNote.myReaction != null" class="ti ti-heart-filled" style="color: var(--MI_THEME-love);"></i>
				<i v-else-if="appearNote.myReaction != null" class="ti ti-minus" style="color: var(--MI_THEME-accent);"></i>
				<i v-else-if="appearNote.reactionAcceptance === 'likeOnly'" class="ti ti-heart"></i>
				<i v-else class="ti ti-plus"></i>
				<p v-if="(appearNote.reactionAcceptance === 'likeOnly' || defaultStore.state.showReactionsCount) && appearNote.reactionCount > 0" :class="$style.noteFooterButtonCount">{{ number(appearNote.reactionCount) }}</p>
			</button>
			<button v-if="defaultStore.state.showClipButtonInNoteFooter" ref="clipButton" class="_button" :class="$style.noteFooterButton" @mousedown.prevent="clip()">
				<i class="ti ti-paperclip"></i>
			</button>
			<button ref="menuButton" class="_button" :class="$style.noteFooterButton" @mousedown.prevent="showMenu()">
				<i class="ti ti-dots"></i>
			</button>
		</footer>
	</article>
	<div :class="$style.tabs">
		<button class="_button" :class="[$style.tab, { [$style.tabActive]: tab === 'replies' }]" @click="tab = 'replies'"><i class="ti ti-arrow-back-up"></i> {{ i18n.ts.replies }}</button>
		<button class="_button" :class="[$style.tab, { [$style.tabActive]: tab === 'renotes' }]" @click="tab = 'renotes'"><i class="ti ti-repeat"></i> {{ i18n.ts.renotes }}</button>
		<button class="_button" :class="[$style.tab, { [$style.tabActive]: tab === 'reactions' }]" @click="tab = 'reactions'"><i class="ti ti-icons"></i> {{ i18n.ts.reactions }}</button>
	</div>
	<div>
		<div v-if="tab === 'replies'">
			<div v-if="!repliesLoaded" style="padding: 16px">
				<MkButton style="margin: 0 auto;" primary rounded @click="loadReplies">{{ i18n.ts.loadReplies }}</MkButton>
			</div>
			<MkNoteSub v-for="note in replies" :key="note.id" :note="note" :class="$style.reply" :detail="true"/>
		</div>
		<div v-else-if="tab === 'renotes'" :class="$style.tab_renotes">
			<MkPagination :pagination="renotesPagination" :disableAutoLoad="true">
				<template #default="{ items }">
					<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); grid-gap: 12px;">
						<MkA v-for="item in items" :key="item.id" :to="userPage(item.user)">
							<MkUserCardMini :user="item.user" :withChart="false"/>
						</MkA>
					</div>
				</template>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'reactions'" :class="$style.tab_reactions">
			<div :class="$style.reactionTabs">
				<button v-for="reaction in Object.keys(appearNote.reactions)" :key="reaction" :class="[$style.reactionTab, { [$style.reactionTabActive]: reactionTabType === reaction }]" class="_button" @click="reactionTabType = reaction">
					<MkReactionIcon :reaction="reaction"/>
					<span style="margin-left: 4px;">{{ appearNote.reactions[reaction] }}</span>
				</button>
			</div>
			<MkPagination v-if="reactionTabType" :key="reactionTabType" :pagination="reactionsPagination" :disableAutoLoad="true">
				<template #default="{ items }">
					<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); grid-gap: 12px;">
						<MkA v-for="item in items" :key="item.id" :to="userPage(item.user)">
							<MkUserCardMini :user="item.user" :withChart="false"/>
						</MkA>
					</div>
				</template>
			</MkPagination>
		</div>
	</div>
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
import { computed, inject, onMounted, provide, ref, shallowRef } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { isLink } from '@@/js/is-link.js';
import { host } from '@@/js/config.js';
import MkNoteSub from '@/components/MkNoteSub.vue';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkReactionsViewer from '@/components/MkReactionsViewer.vue';
import MkReactionsViewerDetails from '@/components/MkReactionsViewer.details.vue';
import MkMediaList from '@/components/MkMediaList.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import MkPoll from '@/components/MkPoll.vue';
import MkUsersTooltip from '@/components/MkUsersTooltip.vue';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import MkInstanceTicker from '@/components/MkInstanceTicker.vue';
import { pleaseLogin, type OpenOnRemoteOptions } from '@/scripts/please-login.js';
import { checkWordMute } from '@/scripts/check-word-mute.js';
import { userPage } from '@/filters/user.js';
import { notePage } from '@/filters/note.js';
import number from '@/filters/number.js';
import * as os from '@/os.js';
import { misskeyApi, misskeyApiGet } from '@/scripts/misskey-api.js';
import * as sound from '@/scripts/sound.js';
import { defaultStore, noteViewInterruptors } from '@/store.js';
import { reactionPicker } from '@/scripts/reaction-picker.js';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { getNoteClipMenu, getNoteMenu, getRenoteMenu } from '@/scripts/get-note-menu.js';
import { useNoteCapture } from '@/scripts/use-note-capture.js';
import { deepClone } from '@/scripts/clone.js';
import { useTooltip } from '@/scripts/use-tooltip.js';
import { claimAchievement } from '@/scripts/achievements.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { showMovedDialog } from '@/scripts/show-moved-dialog.js';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkPagination, { type Paging } from '@/components/MkPagination.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';
import MkButton from '@/components/MkButton.vue';
import { isEnabledUrlPreview } from '@/instance.js';
import { getAppearNote } from '@/scripts/get-appear-note.js';
import { type Keymap } from '@/scripts/hotkey.js';

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note;
	initialTab: string;
}>(), {
	initialTab: 'replies',
});

const inChannel = inject('inChannel', null);

const note = ref(deepClone(props.note));

// plugin
if (noteViewInterruptors.length > 0) {
	onMounted(async () => {
		let result: Misskey.entities.Note | null = deepClone(note.value);
		for (const interruptor of noteViewInterruptors) {
			try {
				result = await interruptor.handler(result!) as Misskey.entities.Note | null;
				if (result === null) {
					isDeleted.value = true;
					return;
				}
			} catch (err) {
				console.error(err);
			}
		}
		note.value = result as Misskey.entities.Note;
	});
}

const isRenote = Misskey.note.isPureRenote(note.value);

const rootEl = shallowRef<HTMLElement>();
const menuButton = shallowRef<HTMLElement>();
const renoteButton = shallowRef<HTMLElement>();
const renoteTime = shallowRef<HTMLElement>();
const reactButton = shallowRef<HTMLElement>();
const clipButton = shallowRef<HTMLElement>();
const appearNote = computed(() => getAppearNote(note.value));
const galleryEl = shallowRef<InstanceType<typeof MkMediaList>>();
const isMyRenote = $i && ($i.id === note.value.userId);
const showContent = ref(false);
const isDeleted = ref(false);
const muted = ref($i ? checkWordMute(appearNote.value, $i, $i.mutedWords) : false);
const translation = ref<Misskey.entities.NotesTranslateResponse | null>(null);
const translating = ref(false);
const parsed = appearNote.value.text ? mfm.parse(appearNote.value.text) : null;
const urls = parsed ? extractUrlFromMfm(parsed).filter((url) => appearNote.value.renote?.url !== url && appearNote.value.renote?.uri !== url) : null;
const showTicker = (defaultStore.state.instanceTicker === 'always') || (defaultStore.state.instanceTicker === 'remote' && appearNote.value.user.instance);
const conversation = ref<Misskey.entities.Note[]>([]);
const replies = ref<Misskey.entities.Note[]>([]);
const canRenote = computed(() => ['public', 'home'].includes(appearNote.value.visibility) || appearNote.value.userId === $i?.id);

const pleaseLoginContext = computed<OpenOnRemoteOptions>(() => ({
	type: 'lookup',
	url: `https://${host}/notes/${appearNote.value.id}`,
}));

const keymap = {
	'r': () => reply(),
	'e|a|plus': () => react(),
	'q': () => renote(),
	'm': () => showMenu(),
	'c': () => {
		if (!defaultStore.state.showClipButtonInNoteFooter) return;
		clip();
	},
	'o': () => galleryEl.value?.openGallery(),
	'v|enter': () => {
		if (appearNote.value.cw != null) {
			showContent.value = !showContent.value;
		}
	},
	'esc': {
		allowRepeat: true,
		callback: () => blur(),
	},
} as const satisfies Keymap;

provide('react', (reaction: string) => {
	misskeyApi('notes/reactions/create', {
		noteId: appearNote.value.id,
		reaction: reaction,
	});
});

const tab = ref(props.initialTab);
const reactionTabType = ref<string | null>(null);

const renotesPagination = computed<Paging>(() => ({
	endpoint: 'notes/renotes',
	limit: 10,
	params: {
		noteId: appearNote.value.id,
	},
}));

const reactionsPagination = computed<Paging>(() => ({
	endpoint: 'notes/reactions',
	limit: 10,
	params: {
		noteId: appearNote.value.id,
		type: reactionTabType.value,
	},
}));

useNoteCapture({
	rootEl: rootEl,
	note: appearNote,
	pureNote: note,
	isDeletedRef: isDeleted,
});

useTooltip(renoteButton, async (showing) => {
	const renotes = await misskeyApi('notes/renotes', {
		noteId: appearNote.value.id,
		limit: 11,
	});

	const users = renotes.map(x => x.user);

	if (users.length < 1) return;

	const { dispose } = os.popup(MkUsersTooltip, {
		showing,
		users,
		count: appearNote.value.renoteCount,
		targetElement: renoteButton.value,
	}, {
		closed: () => dispose(),
	});
});

if (appearNote.value.reactionAcceptance === 'likeOnly') {
	useTooltip(reactButton, async (showing) => {
		const reactions = await misskeyApiGet('notes/reactions', {
			noteId: appearNote.value.id,
			limit: 10,
			_cacheKey_: appearNote.value.reactionCount,
		});

		const users = reactions.map(x => x.user);

		if (users.length < 1) return;

		const { dispose } = os.popup(MkReactionsViewerDetails, {
			showing,
			reaction: '❤️',
			users,
			count: appearNote.value.reactionCount,
			targetElement: reactButton.value!,
		}, {
			closed: () => dispose(),
		});
	});
}

function renote() {
	pleaseLogin({ openOnRemote: pleaseLoginContext.value });
	showMovedDialog();

	const { menu } = getRenoteMenu({ note: note.value, renoteButton });
	os.popupMenu(menu, renoteButton.value);
}

function reply(): void {
	pleaseLogin({ openOnRemote: pleaseLoginContext.value });
	showMovedDialog();
	os.post({
		reply: appearNote.value,
		channel: appearNote.value.channel,
	}).then(() => {
		focus();
	});
}

function react(): void {
	pleaseLogin({ openOnRemote: pleaseLoginContext.value });
	showMovedDialog();
	if (appearNote.value.reactionAcceptance === 'likeOnly') {
		sound.playMisskeySfx('reaction');

		misskeyApi('notes/reactions/create', {
			noteId: appearNote.value.id,
			reaction: '❤️',
		});
		const el = reactButton.value;
		if (el) {
			const rect = el.getBoundingClientRect();
			const x = rect.left + (el.offsetWidth / 2);
			const y = rect.top + (el.offsetHeight / 2);
			const { dispose } = os.popup(MkRippleEffect, { x, y }, {
				end: () => dispose(),
			});
		}
	} else {
		blur();
		reactionPicker.show(reactButton.value ?? null, note.value, reaction => {
			sound.playMisskeySfx('reaction');

			misskeyApi('notes/reactions/create', {
				noteId: appearNote.value.id,
				reaction: reaction,
			});
			if (appearNote.value.text && appearNote.value.text.length > 100 && (Date.now() - new Date(appearNote.value.createdAt).getTime() < 1000 * 3)) {
				claimAchievement('reactWithoutRead');
			}
		}, () => {
			focus();
		});
	}
}

function undoReact(targetNote: Misskey.entities.Note): void {
	const oldReaction = targetNote.myReaction;
	if (!oldReaction) return;
	misskeyApi('notes/reactions/delete', {
		noteId: targetNote.id,
	});
}

function toggleReact() {
	if (appearNote.value.myReaction == null) {
		react();
	} else {
		undoReact(appearNote.value);
	}
}

function onContextmenu(ev: MouseEvent): void {
	if (ev.target && isLink(ev.target as HTMLElement)) return;
	if (window.getSelection()?.toString() !== '') return;

	if (defaultStore.state.useReactionPickerForContextMenu) {
		ev.preventDefault();
		react();
	} else {
		const { menu, cleanup } = getNoteMenu({ note: note.value, translating, translation, isDeleted });
		os.contextMenu(menu, ev).then(focus).finally(cleanup);
	}
}

function showMenu(): void {
	const { menu, cleanup } = getNoteMenu({ note: note.value, translating, translation, isDeleted });
	os.popupMenu(menu, menuButton.value).then(focus).finally(cleanup);
}

async function clip(): Promise<void> {
	os.popupMenu(await getNoteClipMenu({ note: note.value, isDeleted }), clipButton.value).then(focus);
}

function showRenoteMenu(): void {
	if (!isMyRenote) return;
	pleaseLogin({ openOnRemote: pleaseLoginContext.value });
	os.popupMenu([{
		text: i18n.ts.unrenote,
		icon: 'ti ti-trash',
		danger: true,
		action: () => {
			misskeyApi('notes/delete', {
				noteId: note.value.id,
			});
			isDeleted.value = true;
		},
	}], renoteTime.value);
}

function focus() {
	rootEl.value?.focus();
}

function blur() {
	rootEl.value?.blur();
}

const repliesLoaded = ref(false);

function loadReplies() {
	repliesLoaded.value = true;
	misskeyApi('notes/children', {
		noteId: appearNote.value.id,
		limit: 30,
	}).then(res => {
		replies.value = res;
	});
}

const conversationLoaded = ref(false);

function loadConversation() {
	conversationLoaded.value = true;
	if (appearNote.value.replyId == null) return;
	misskeyApi('notes/conversation', {
		noteId: appearNote.value.replyId,
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

	&:focus-visible {
		outline: none;

		&::after {
			content: "";
			pointer-events: none;
			display: block;
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: calc(100% - 8px);
			height: calc(100% - 8px);
			border: dashed 2px var(--MI_THEME-focus);
			border-radius: var(--MI-radius);
			box-sizing: border-box;
		}
	}
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
	color: var(--MI_THEME-renote);
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
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: 4px;
}

.noteHeaderInfo {
	float: right;
}

.noteHeaderUsernameAndBadgeRoles {
	display: flex;
}

.noteHeaderUsername {
	margin-bottom: 2px;
	margin-right: 0.5em;
	line-height: 1.3;
	word-wrap: anywhere;
}

.noteHeaderBadgeRoles {
	margin: 0 .5em 0 0;
}

.noteHeaderBadgeRole {
	height: 1.3em;
	vertical-align: -20%;

	& + .noteHeaderBadgeRole {
		margin-left: 0.2em;
	}
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
	color: var(--MI_THEME-accent);
	margin-right: 0.5em;
}

.rn {
	margin-left: 4px;
	font-style: oblique;
	color: var(--MI_THEME-renote);
}

.translation {
	border: solid 0.5px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
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
	border: dashed 1px var(--MI_THEME-renote);
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
		color: var(--MI_THEME-fgHighlighted);
	}
}

.noteFooterButtonCount {
	display: inline;
	margin: 0 0 0 8px;
	opacity: 0.7;

	&.reacted {
		color: var(--MI_THEME-accent);
	}
}

.reply:not(:first-child) {
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.tabs {
	border-top: solid 0.5px var(--MI_THEME-divider);
	border-bottom: solid 0.5px var(--MI_THEME-divider);
	display: flex;
}

.tab {
	flex: 1;
	padding: 12px 8px;
	border-top: solid 2px transparent;
	border-bottom: solid 2px transparent;
}

.tabActive {
	border-bottom: solid 2px var(--MI_THEME-accent);
}

.tab_renotes {
	padding: 16px;
}

.tab_reactions {
	padding: 16px;
}

.reactionTabs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-bottom: 8px;
}

.reactionTab {
	padding: 4px 6px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 6px;
}

.reactionTabActive {
	border-color: var(--MI_THEME-accent);
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
