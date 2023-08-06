<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[$style.root, { [$style.modal]: modal, _popup: modal }]"
	@dragover.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<header :class="$style.header">
		<div :class="$style.headerLeft">
			<button v-if="!fixed" :class="$style.cancel" class="_button" @click="cancel"><i class="ti ti-x"></i></button>
			<button v-click-anime v-tooltip="i18n.ts.switchAccount" :class="$style.account" class="_button" @click="openAccountMenu">
				<MkAvatar :user="postAccount ?? $i" :class="$style.avatar"/>
			</button>
		</div>
		<div :class="$style.headerRight">
			<template v-if="!(channel != null && fixed)">
				<button v-if="channel == null" ref="visibilityButton" v-click-anime v-tooltip="i18n.ts.visibility" :class="['_button', $style.headerRightItem, $style.visibility]" @click="setVisibility">
					<span v-if="visibility === 'public'"><i class="ti ti-world"></i></span>
					<span v-if="visibility === 'home'"><i class="ti ti-home"></i></span>
					<span v-if="visibility === 'followers'"><i class="ti ti-lock"></i></span>
					<span v-if="visibility === 'specified'"><i class="ti ti-mail"></i></span>
					<span :class="$style.headerRightButtonText">{{ i18n.ts._visibility[visibility] }}</span>
				</button>
				<button v-else class="_button" :class="[$style.headerRightItem, $style.visibility]" disabled>
					<span><i class="ti ti-device-tv"></i></span>
					<span :class="$style.headerRightButtonText">{{ channel.name }}</span>
				</button>
			</template>
			<button v-click-anime v-tooltip="i18n.ts._visibility.disableFederation" class="_button" :class="[$style.headerRightItem, { [$style.danger]: localOnly }]" :disabled="channel != null || visibility === 'specified'" @click="toggleLocalOnly">
				<span v-if="!localOnly"><i class="ti ti-rocket"></i></span>
				<span v-else><i class="ti ti-rocket-off"></i></span>
			</button>
			<button v-click-anime v-tooltip="i18n.ts.reactionAcceptance" class="_button" :class="[$style.headerRightItem, { [$style.danger]: reactionAcceptance === 'likeOnly' }]" @click="toggleReactionAcceptance">
				<span v-if="reactionAcceptance === 'likeOnly'"><i class="ti ti-heart"></i></span>
				<span v-else-if="reactionAcceptance === 'likeOnlyForRemote'"><i class="ti ti-heart-plus"></i></span>
				<span v-else><i class="ti ti-icons"></i></span>
			</button>
			<button v-click-anime class="_button" :class="$style.submit" :disabled="!canPost" data-cy-open-post-form-submit @click="post">
				<div :class="$style.submitInner">
					<template v-if="posted"></template>
					<template v-else-if="posting"><MkEllipsis/></template>
					<template v-else>{{ submitText }}</template>
					<i style="margin-left: 6px;" :class="posted ? 'ti ti-check' : reply ? 'ti ti-arrow-back-up' : renote ? 'ti ti-quote' : 'ti ti-send'"></i>
				</div>
			</button>
		</div>
	</header>
	<MkNoteSimple v-if="reply" :class="$style.targetNote" :note="reply"/>
	<MkNoteSimple v-if="renote" :class="$style.targetNote" :note="renote"/>
	<div v-if="quoteId" :class="$style.withQuote"><i class="ti ti-quote"></i> {{ i18n.ts.quoteAttached }}<button @click="quoteId = null"><i class="ti ti-x"></i></button></div>
	<div v-if="visibility === 'specified'" :class="$style.toSpecified">
		<span style="margin-right: 8px;">{{ i18n.ts.recipient }}</span>
		<div :class="$style.visibleUsers">
			<span v-for="u in visibleUsers" :key="u.id" :class="$style.visibleUser">
				<MkAcct :user="u"/>
				<button class="_button" style="padding: 4px 8px;" @click="removeVisibleUser(u)"><i class="ti ti-x"></i></button>
			</span>
			<button class="_buttonPrimary" style="padding: 4px; border-radius: 8px;" @click="addVisibleUser"><i class="ti ti-plus ti-fw"></i></button>
		</div>
	</div>
	<MkInfo v-if="hasNotSpecifiedMentions" warn :class="$style.hasNotSpecifiedMentions">{{ i18n.ts.notSpecifiedMentionWarning }} - <button class="_textButton" @click="addMissingMention()">{{ i18n.ts.add }}</button></MkInfo>
	<input v-show="useCw" ref="cwInputEl" v-model="cw" :class="$style.cw" :placeholder="i18n.ts.annotation" @keydown="onKeydown">
	<div :class="[$style.textOuter, { [$style.withCw]: useCw }]">
		<textarea ref="textareaEl" v-model="text" :class="[$style.text]" :disabled="posting || posted" :placeholder="placeholder" data-cy-post-form-text @keydown="onKeydown" @paste="onPaste" @compositionupdate="onCompositionUpdate" @compositionend="onCompositionEnd"/>
		<div v-if="maxTextLength - textLength < 100" :class="['_acrylic', $style.textCount, { [$style.textOver]: textLength > maxTextLength }]">{{ maxTextLength - textLength }}</div>
	</div>
	<input v-show="withHashtags" ref="hashtagsInputEl" v-model="hashtags" :class="$style.hashtags" :placeholder="i18n.ts.hashtags" list="hashtags">
	<XPostFormAttaches v-model="files" @detach="detachFile" @changeSensitive="updateFileSensitive" @changeName="updateFileName" @replaceFile="replaceFile"/>
	<MkPollEditor v-if="poll" v-model="poll" @destroyed="poll = null"/>
	<MkNotePreview v-if="showPreview" :class="$style.preview" :text="text"/>
	<div v-if="showingOptions" style="padding: 8px 16px;">
	</div>
	<footer :class="$style.footer">
		<div :class="$style.footerLeft">
			<button v-tooltip="i18n.ts.attachFile" class="_button" :class="$style.footerButton" @click="chooseFileFrom"><i class="ti ti-photo-plus"></i></button>
			<button v-tooltip="i18n.ts.poll" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: poll }]" @click="togglePoll"><i class="ti ti-chart-arrows"></i></button>
			<button v-tooltip="i18n.ts.useCw" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: useCw }]" @click="useCw = !useCw"><i class="ti ti-eye-off"></i></button>
			<button v-tooltip="i18n.ts.mention" class="_button" :class="$style.footerButton" @click="insertMention"><i class="ti ti-at"></i></button>
			<button v-tooltip="i18n.ts.hashtags" class="_button" :class="[$style.footerButton, { [$style.footerButtonActive]: withHashtags }]" @click="withHashtags = !withHashtags"><i class="ti ti-hash"></i></button>
			<button v-if="postFormActions.length > 0" v-tooltip="i18n.ts.plugin" class="_button" :class="$style.footerButton" @click="showActions"><i class="ti ti-plug"></i></button>
			<button v-tooltip="i18n.ts.emoji" :class="['_button', $style.footerButton]" @click="insertEmoji"><i class="ti ti-mood-happy"></i></button>
		</div>
		<div :class="$style.footerRight">
			<button v-tooltip="i18n.ts.previewNoteText" class="_button" :class="[$style.footerButton, { [$style.previewButtonActive]: showPreview }]" @click="showPreview = !showPreview"><i class="ti ti-eye"></i></button>
			<!--<button v-tooltip="i18n.ts.more" class="_button" :class="$style.footerButton" @click="showingOptions = !showingOptions"><i class="ti ti-dots"></i></button>-->
		</div>
	</footer>
	<datalist id="hashtags">
		<option v-for="hashtag in recentHashtags" :key="hashtag" :value="hashtag"/>
	</datalist>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { inject, watch, nextTick, onMounted, defineAsyncComponent } from 'vue';
import * as mfm from 'mfm-js';
import * as misskey from 'misskey-js';
import insertTextAtCursor from 'insert-text-at-cursor';
import { toASCII } from 'punycode/';
import * as Acct from 'misskey-js/built/acct';
import MkNoteSimple from '@/components/MkNoteSimple.vue';
import MkNotePreview from '@/components/MkNotePreview.vue';
import XPostFormAttaches from '@/components/MkPostFormAttaches.vue';
import MkPollEditor from '@/components/MkPollEditor.vue';
import { host, url } from '@/config';
import { erase, unique } from '@/scripts/array';
import { extractMentions } from '@/scripts/extract-mentions';
import { formatTimeString } from '@/scripts/format-time-string';
import { Autocomplete } from '@/scripts/autocomplete';
import * as os from '@/os';
import { selectFiles } from '@/scripts/select-file';
import { defaultStore, notePostInterruptors, postFormActions } from '@/store';
import MkInfo from '@/components/MkInfo.vue';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import { $i, notesCount, incNotesCount, getAccounts, openAccountMenu as openAccountMenu_ } from '@/account';
import { uploadFile } from '@/scripts/upload';
import { deepClone } from '@/scripts/clone';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { miLocalStorage } from '@/local-storage';
import { claimAchievement } from '@/scripts/achievements';

const modal = inject('modal');

const props = withDefaults(defineProps<{
	reply?: misskey.entities.Note;
	renote?: misskey.entities.Note;
	channel?: misskey.entities.Channel; // TODO
	mention?: misskey.entities.User;
	specified?: misskey.entities.User;
	initialText?: string;
	initialVisibility?: (typeof misskey.noteVisibilities)[number];
	initialFiles?: misskey.entities.DriveFile[];
	initialLocalOnly?: boolean;
	initialVisibleUsers?: misskey.entities.User[];
	initialNote?: misskey.entities.Note;
	instant?: boolean;
	fixed?: boolean;
	autofocus?: boolean;
	freezeAfterPosted?: boolean;
}>(), {
	initialVisibleUsers: () => [],
	autofocus: true,
});

const emit = defineEmits<{
	(ev: 'posted'): void;
	(ev: 'cancel'): void;
	(ev: 'esc'): void;
}>();

const textareaEl = $shallowRef<HTMLTextAreaElement | null>(null);
const cwInputEl = $shallowRef<HTMLInputElement | null>(null);
const hashtagsInputEl = $shallowRef<HTMLInputElement | null>(null);
const visibilityButton = $shallowRef<HTMLElement | null>(null);

let posting = $ref(false);
let posted = $ref(false);
let text = $ref(props.initialText ?? '');
let files = $ref(props.initialFiles ?? []);
let poll = $ref<{
	choices: string[];
	multiple: boolean;
	expiresAt: string | null;
	expiredAfter: string | null;
} | null>(null);
let useCw = $ref(false);
let showPreview = $ref(false);
let cw = $ref<string | null>(null);
let localOnly = $ref<boolean>(props.initialLocalOnly ?? defaultStore.state.rememberNoteVisibility ? defaultStore.state.localOnly : defaultStore.state.defaultNoteLocalOnly);
let visibility = $ref(props.initialVisibility ?? (defaultStore.state.rememberNoteVisibility ? defaultStore.state.visibility : defaultStore.state.defaultNoteVisibility) as typeof misskey.noteVisibilities[number]);
let visibleUsers = $ref([]);
if (props.initialVisibleUsers) {
	props.initialVisibleUsers.forEach(pushVisibleUser);
}
let reactionAcceptance = $ref(defaultStore.state.reactionAcceptance);
let autocomplete = $ref(null);
let draghover = $ref(false);
let quoteId = $ref(null);
let hasNotSpecifiedMentions = $ref(false);
let recentHashtags = $ref(JSON.parse(miLocalStorage.getItem('hashtags') ?? '[]'));
let imeText = $ref('');
let showingOptions = $ref(false);

const draftKey = $computed((): string => {
	let key = props.channel ? `channel:${props.channel.id}` : '';

	if (props.renote) {
		key += `renote:${props.renote.id}`;
	} else if (props.reply) {
		key += `reply:${props.reply.id}`;
	} else {
		key += `note:${$i.id}`;
	}

	return key;
});

const placeholder = $computed((): string => {
	if (props.renote) {
		return i18n.ts._postForm.quotePlaceholder;
	} else if (props.reply) {
		return i18n.ts._postForm.replyPlaceholder;
	} else if (props.channel) {
		return i18n.ts._postForm.channelPlaceholder;
	} else {
		const xs = [
			i18n.ts._postForm._placeholders.a,
			i18n.ts._postForm._placeholders.b,
			i18n.ts._postForm._placeholders.c,
			i18n.ts._postForm._placeholders.d,
			i18n.ts._postForm._placeholders.e,
			i18n.ts._postForm._placeholders.f,
		];
		return xs[Math.floor(Math.random() * xs.length)];
	}
});

const submitText = $computed((): string => {
	return props.renote
		? i18n.ts.quote
		: props.reply
			? i18n.ts.reply
			: i18n.ts.note;
});

const textLength = $computed((): number => {
	return (text + imeText).trim().length;
});

const maxTextLength = $computed((): number => {
	return instance ? instance.maxNoteTextLength : 1000;
});

const canPost = $computed((): boolean => {
	return !posting && !posted &&
		(1 <= textLength || 1 <= files.length || !!poll || !!props.renote) &&
		(textLength <= maxTextLength) &&
		(!poll || poll.choices.length >= 2);
});

const withHashtags = $computed(defaultStore.makeGetterSetter('postFormWithHashtags'));
const hashtags = $computed(defaultStore.makeGetterSetter('postFormHashtags'));

watch($$(text), () => {
	checkMissingMention();
}, { immediate: true });

watch($$(visibility), () => {
	checkMissingMention();
}, { immediate: true });

watch($$(visibleUsers), () => {
	checkMissingMention();
}, {
	deep: true,
});

if (props.mention) {
	text = props.mention.host ? `@${props.mention.username}@${toASCII(props.mention.host)}` : `@${props.mention.username}`;
	text += ' ';
}

if (props.reply && (props.reply.user.username !== $i.username || (props.reply.user.host != null && props.reply.user.host !== host))) {
	text = `@${props.reply.user.username}${props.reply.user.host != null ? '@' + toASCII(props.reply.user.host) : ''} `;
}

if (props.reply && props.reply.text != null) {
	const ast = mfm.parse(props.reply.text);
	const otherHost = props.reply.user.host;

	for (const x of extractMentions(ast)) {
		const mention = x.host ?
			`@${x.username}@${toASCII(x.host)}` :
			(otherHost == null || otherHost === host) ?
				`@${x.username}` :
				`@${x.username}@${toASCII(otherHost)}`;

		// 自分は除外
		if ($i.username === x.username && (x.host == null || x.host === host)) continue;

		// 重複は除外
		if (text.includes(`${mention} `)) continue;

		text += `${mention} `;
	}
}

if (props.channel) {
	visibility = 'public';
	localOnly = true; // TODO: チャンネルが連合するようになった折には消す
}

// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
if (props.reply && ['home', 'followers', 'specified'].includes(props.reply.visibility)) {
	if (props.reply.visibility === 'home' && visibility === 'followers') {
		visibility = 'followers';
	} else if (['home', 'followers'].includes(props.reply.visibility) && visibility === 'specified') {
		visibility = 'specified';
	} else {
		visibility = props.reply.visibility;
	}

	if (visibility === 'specified') {
		if (props.reply.visibleUserIds) {
			os.api('users/show', {
				userIds: props.reply.visibleUserIds.filter(uid => uid !== $i.id && uid !== props.reply.userId),
			}).then(users => {
				users.forEach(pushVisibleUser);
			});
		}

		if (props.reply.userId !== $i.id) {
			os.api('users/show', { userId: props.reply.userId }).then(user => {
				pushVisibleUser(user);
			});
		}
	}
}

if (props.specified) {
	visibility = 'specified';
	pushVisibleUser(props.specified);
}

// keep cw when reply
if (defaultStore.state.keepCw && props.reply && props.reply.cw) {
	useCw = true;
	cw = props.reply.cw;
}

function watchForDraft() {
	watch($$(text), () => saveDraft());
	watch($$(useCw), () => saveDraft());
	watch($$(cw), () => saveDraft());
	watch($$(poll), () => saveDraft());
	watch($$(files), () => saveDraft(), { deep: true });
	watch($$(visibility), () => saveDraft());
	watch($$(localOnly), () => saveDraft());
}

function checkMissingMention() {
	if (visibility === 'specified') {
		const ast = mfm.parse(text);

		for (const x of extractMentions(ast)) {
			if (!visibleUsers.some(u => (u.username === x.username) && (u.host === x.host))) {
				hasNotSpecifiedMentions = true;
				return;
			}
		}
		hasNotSpecifiedMentions = false;
	}
}

function addMissingMention() {
	const ast = mfm.parse(text);

	for (const x of extractMentions(ast)) {
		if (!visibleUsers.some(u => (u.username === x.username) && (u.host === x.host))) {
			os.api('users/show', { username: x.username, host: x.host }).then(user => {
				visibleUsers.push(user);
			});
		}
	}
}

function togglePoll() {
	if (poll) {
		poll = null;
	} else {
		poll = {
			choices: ['', ''],
			multiple: false,
			expiresAt: null,
			expiredAfter: null,
		};
	}
}

function addTag(tag: string) {
	insertTextAtCursor(textareaEl, ` #${tag} `);
}

function focus() {
	if (textareaEl) {
		textareaEl.focus();
		textareaEl.setSelectionRange(textareaEl.value.length, textareaEl.value.length);
	}
}

function chooseFileFrom(ev) {
	selectFiles(ev.currentTarget ?? ev.target, i18n.ts.attachFile).then(files_ => {
		for (const file of files_) {
			files.push(file);
		}
	});
}

function detachFile(id) {
	files = files.filter(x => x.id !== id);
}

function updateFileSensitive(file, sensitive) {
	files[files.findIndex(x => x.id === file.id)].isSensitive = sensitive;
}

function updateFileName(file, name) {
	files[files.findIndex(x => x.id === file.id)].name = name;
}

function replaceFile(file: misskey.entities.DriveFile, newFile: misskey.entities.DriveFile): void {
	files[files.findIndex(x => x.id === file.id)] = newFile;
}

function upload(file: File, name?: string): void {
	uploadFile(file, defaultStore.state.uploadFolder, name).then(res => {
		files.push(res);
	});
}

function setVisibility() {
	if (props.channel) {
		visibility = 'public';
		localOnly = true; // TODO: チャンネルが連合するようになった折には消す
		return;
	}

	os.popup(defineAsyncComponent(() => import('@/components/MkVisibilityPicker.vue')), {
		currentVisibility: visibility,
		localOnly: localOnly,
		src: visibilityButton,
	}, {
		changeVisibility: v => {
			visibility = v;
			if (defaultStore.state.rememberNoteVisibility) {
				defaultStore.set('visibility', visibility);
			}
		},
	}, 'closed');
}

async function toggleLocalOnly() {
	if (props.channel) {
		visibility = 'public';
		localOnly = true; // TODO: チャンネルが連合するようになった折には消す
		return;
	}

	const neverShowInfo = miLocalStorage.getItem('neverShowLocalOnlyInfo');

	if (!localOnly && neverShowInfo !== 'true') {
		const confirm = await os.actions({
			type: 'question',
			title: i18n.ts.disableFederationConfirm,
			text: i18n.ts.disableFederationConfirmWarn,
			actions: [
				{
					value: 'yes' as const,
					text: i18n.ts.disableFederationOk,
					primary: true,
				},
				{
					value: 'neverShow' as const,
					text: `${i18n.ts.disableFederationOk} (${i18n.ts.neverShow})`,
					danger: true,
				},
				{
					value: 'no' as const,
					text: i18n.ts.cancel,
				},
			],
		});
		if (confirm.canceled) return;
		if (confirm.result === 'no') return;

		if (confirm.result === 'neverShow') {
			miLocalStorage.setItem('neverShowLocalOnlyInfo', 'true');
		}
	}

	localOnly = !localOnly;
}

async function toggleReactionAcceptance() {
	const select = await os.select({
		title: i18n.ts.reactionAcceptance,
		items: [
			{ value: null, text: i18n.ts.all },
			{ value: 'likeOnlyForRemote' as const, text: i18n.ts.likeOnlyForRemote },
			{ value: 'nonSensitiveOnly' as const, text: i18n.ts.nonSensitiveOnly },
			{ value: 'nonSensitiveOnlyForLocalLikeOnlyForRemote' as const, text: i18n.ts.nonSensitiveOnlyForLocalLikeOnlyForRemote },
			{ value: 'likeOnly' as const, text: i18n.ts.likeOnly },
		],
		default: reactionAcceptance,
	});
	if (select.canceled) return;
	reactionAcceptance = select.result;
}

function pushVisibleUser(user) {
	if (!visibleUsers.some(u => u.username === user.username && u.host === user.host)) {
		visibleUsers.push(user);
	}
}

function addVisibleUser() {
	os.selectUser().then(user => {
		pushVisibleUser(user);

		if (!text.toLowerCase().includes(`@${user.username.toLowerCase()}`)) {
			text = `@${Acct.toString(user)} ${text}`;
		}
	});
}

function removeVisibleUser(user) {
	visibleUsers = erase(user, visibleUsers);
}

function clear() {
	text = '';
	files = [];
	poll = null;
	quoteId = null;
}

function onKeydown(ev: KeyboardEvent) {
	if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey) && canPost) post();
	if (ev.key === 'Escape') emit('esc');
}

function onCompositionUpdate(ev: CompositionEvent) {
	imeText = ev.data;
}

function onCompositionEnd(ev: CompositionEvent) {
	imeText = '';
}

async function onPaste(ev: ClipboardEvent) {
	for (const { item, i } of Array.from(ev.clipboardData.items, (item, i) => ({ item, i }))) {
		if (item.kind === 'file') {
			const file = item.getAsFile();
			const lio = file.name.lastIndexOf('.');
			const ext = lio >= 0 ? file.name.slice(lio) : '';
			const formatted = `${formatTimeString(new Date(file.lastModified), defaultStore.state.pastedFileName).replace(/{{number}}/g, `${i + 1}`)}${ext}`;
			upload(file, formatted);
		}
	}

	const paste = ev.clipboardData.getData('text');

	if (!props.renote && !quoteId && paste.startsWith(url + '/notes/')) {
		ev.preventDefault();

		os.confirm({
			type: 'info',
			text: i18n.ts.quoteQuestion,
		}).then(({ canceled }) => {
			if (canceled) {
				insertTextAtCursor(textareaEl, paste);
				return;
			}

			quoteId = paste.substring(url.length).match(/^\/notes\/(.+?)\/?$/)[1];
		});
	}
}

function onDragover(ev) {
	if (!ev.dataTransfer.items[0]) return;
	const isFile = ev.dataTransfer.items[0].kind === 'file';
	const isDriveFile = ev.dataTransfer.types[0] === _DATA_TRANSFER_DRIVE_FILE_;
	if (isFile || isDriveFile) {
		ev.preventDefault();
		draghover = true;
		switch (ev.dataTransfer.effectAllowed) {
			case 'all':
			case 'uninitialized':
			case 'copy':
			case 'copyLink':
			case 'copyMove':
				ev.dataTransfer.dropEffect = 'copy';
				break;
			case 'linkMove':
			case 'move':
				ev.dataTransfer.dropEffect = 'move';
				break;
			default:
				ev.dataTransfer.dropEffect = 'none';
				break;
		}
	}
}

function onDragenter(ev) {
	draghover = true;
}

function onDragleave(ev) {
	draghover = false;
}

function onDrop(ev): void {
	draghover = false;

	// ファイルだったら
	if (ev.dataTransfer.files.length > 0) {
		ev.preventDefault();
		for (const x of Array.from(ev.dataTransfer.files)) upload(x);
		return;
	}

	//#region ドライブのファイル
	const driveFile = ev.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
	if (driveFile != null && driveFile !== '') {
		const file = JSON.parse(driveFile);
		files.push(file);
		ev.preventDefault();
	}
	//#endregion
}

function saveDraft() {
	const draftData = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}');

	draftData[draftKey] = {
		updatedAt: new Date(),
		data: {
			text: text,
			useCw: useCw,
			cw: cw,
			visibility: visibility,
			localOnly: localOnly,
			files: files,
			poll: poll,
		},
	};

	miLocalStorage.setItem('drafts', JSON.stringify(draftData));
}

function deleteDraft() {
	const draftData = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}');

	delete draftData[draftKey];

	miLocalStorage.setItem('drafts', JSON.stringify(draftData));
}

async function post(ev?: MouseEvent) {
	if (ev) {
		const el = ev.currentTarget ?? ev.target;
		const rect = el.getBoundingClientRect();
		const x = rect.left + (el.offsetWidth / 2);
		const y = rect.top + (el.offsetHeight / 2);
		os.popup(MkRippleEffect, { x, y }, {}, 'end');
	}

	const annoying =
		text.includes('$[x2') ||
		text.includes('$[x3') ||
		text.includes('$[x4') ||
		text.includes('$[scale') ||
		text.includes('$[position');

	if (annoying && visibility === 'public') {
		const { canceled, result } = await os.actions({
			type: 'warning',
			text: i18n.ts.thisPostMayBeAnnoying,
			actions: [{
				value: 'home',
				text: i18n.ts.thisPostMayBeAnnoyingHome,
				primary: true,
			}, {
				value: 'cancel',
				text: i18n.ts.thisPostMayBeAnnoyingCancel,
			}, {
				value: 'ignore',
				text: i18n.ts.thisPostMayBeAnnoyingIgnore,
			}],
		});

		if (canceled) return;
		if (result === 'cancel') return;
		if (result === 'home') {
			visibility = 'home';
		}
	}

	let postData = {
		text: text === '' ? undefined : text,
		fileIds: files.length > 0 ? files.map(f => f.id) : undefined,
		replyId: props.reply ? props.reply.id : undefined,
		renoteId: props.renote ? props.renote.id : quoteId ? quoteId : undefined,
		channelId: props.channel ? props.channel.id : undefined,
		poll: poll,
		cw: useCw ? cw ?? '' : undefined,
		localOnly: localOnly,
		visibility: visibility,
		visibleUserIds: visibility === 'specified' ? visibleUsers.map(u => u.id) : undefined,
		reactionAcceptance,
	};

	if (withHashtags && hashtags && hashtags.trim() !== '') {
		const hashtags_ = hashtags.trim().split(' ').map(x => x.startsWith('#') ? x : '#' + x).join(' ');
		postData.text = postData.text ? `${postData.text} ${hashtags_}` : hashtags_;
	}

	// plugin
	if (notePostInterruptors.length > 0) {
		for (const interruptor of notePostInterruptors) {
			postData = await interruptor.handler(deepClone(postData));
		}
	}

	let token = undefined;

	if (postAccount) {
		const storedAccounts = await getAccounts();
		token = storedAccounts.find(x => x.id === postAccount.id)?.token;
	}

	posting = true;
	os.api('notes/create', postData, token).then(() => {
		if (props.freezeAfterPosted) {
			posted = true;
		} else {
			clear();
		}
		nextTick(() => {
			deleteDraft();
			emit('posted');
			if (postData.text && postData.text !== '') {
				const hashtags_ = mfm.parse(postData.text).filter(x => x.type === 'hashtag').map(x => x.props.hashtag);
				const history = JSON.parse(miLocalStorage.getItem('hashtags') ?? '[]') as string[];
				miLocalStorage.setItem('hashtags', JSON.stringify(unique(hashtags_.concat(history))));
			}
			posting = false;
			postAccount = null;

			incNotesCount();
			if (notesCount === 1) {
				claimAchievement('notes1');
			}

			const text = postData.text ?? '';
			const lowerCase = text.toLowerCase();
			if ((lowerCase.includes('love') || lowerCase.includes('❤')) && lowerCase.includes('misskey')) {
				claimAchievement('iLoveMisskey');
			}
			if ([
				'https://youtu.be/Efrlqw8ytg4',
				'https://www.youtube.com/watch?v=Efrlqw8ytg4',
				'https://m.youtube.com/watch?v=Efrlqw8ytg4',
			
				'https://youtu.be/XVCwzwxdHuA',
				'https://www.youtube.com/watch?v=XVCwzwxdHuA',
				'https://m.youtube.com/watch?v=XVCwzwxdHuA',

				'https://open.spotify.com/track/3Cuj0mZrlLoXx9nydNi7RB',
				'https://open.spotify.com/track/7anfcaNPQWlWCwyCHmZqNy',
				'https://open.spotify.com/track/5Odr16TvEN4my22K9nbH7l',
				'https://open.spotify.com/album/5bOlxyl4igOrp2DwVQxBco',
			].some(url => text.includes(url))) {
				claimAchievement('brainDiver');
			}

			if (props.renote && (props.renote.userId === $i.id) && text.length > 0) {
				claimAchievement('selfQuote');
			}

			const date = new Date();
			const h = date.getHours();
			const m = date.getMinutes();
			const s = date.getSeconds();
			if (h >= 0 && h <= 3) {
				claimAchievement('postedAtLateNight');
			}
			if (m === 0 && s === 0) {
				claimAchievement('postedAt0min0sec');
			}
		});
	}).catch(err => {
		posting = false;
		os.alert({
			type: 'error',
			text: err.message + '\n' + (err as any).id,
		});
	});
}

function cancel() {
	emit('cancel');
}

function insertMention() {
	os.selectUser().then(user => {
		insertTextAtCursor(textareaEl, '@' + Acct.toString(user) + ' ');
	});
}

async function insertEmoji(ev: MouseEvent) {
	os.openEmojiPicker(ev.currentTarget ?? ev.target, {}, textareaEl);
}

function showActions(ev) {
	os.popupMenu(postFormActions.map(action => ({
		text: action.title,
		action: () => {
			action.handler({
				text: text,
			}, (key, value) => {
				if (key === 'text') { text = value; }
			});
		},
	})), ev.currentTarget ?? ev.target);
}

let postAccount = $ref<misskey.entities.UserDetailed | null>(null);

function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_({
		withExtraOperation: false,
		includeCurrentAccount: true,
		active: postAccount != null ? postAccount.id : $i.id,
		onChoose: (account) => {
			if (account.id === $i.id) {
				postAccount = null;
			} else {
				postAccount = account;
			}
		},
	}, ev);
}

onMounted(() => {
	if (props.autofocus) {
		focus();

		nextTick(() => {
			focus();
		});
	}

	// TODO: detach when unmount
	new Autocomplete(textareaEl, $$(text));
	new Autocomplete(cwInputEl, $$(cw));
	new Autocomplete(hashtagsInputEl, $$(hashtags));

	nextTick(() => {
		// 書きかけの投稿を復元
		if (!props.instant && !props.mention && !props.specified) {
			const draft = JSON.parse(miLocalStorage.getItem('drafts') ?? '{}')[draftKey];
			if (draft) {
				text = draft.data.text;
				useCw = draft.data.useCw;
				cw = draft.data.cw;
				visibility = draft.data.visibility;
				localOnly = draft.data.localOnly;
				files = (draft.data.files || []).filter(draftFile => draftFile);
				if (draft.data.poll) {
					poll = draft.data.poll;
				}
			}
		}

		// 削除して編集
		if (props.initialNote) {
			const init = props.initialNote;
			text = init.text ? init.text : '';
			files = init.files;
			cw = init.cw;
			useCw = init.cw != null;
			if (init.poll) {
				poll = {
					choices: init.poll.choices.map(x => x.text),
					multiple: init.poll.multiple,
					expiresAt: init.poll.expiresAt,
					expiredAfter: init.poll.expiredAfter,
				};
			}
			visibility = init.visibility;
			localOnly = init.localOnly;
			quoteId = init.renote ? init.renote.id : null;
		}

		nextTick(() => watchForDraft());
	});
});

defineExpose({
	clear,
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	container-type: inline-size;

	&.modal {
		width: 100%;
		max-width: 520px;
	}
}

//#region header
.header {
	z-index: 1000;
	min-height: 50px;
	display: flex;
	flex-wrap: nowrap;
	gap: 4px;
}

.headerLeft {
	display: flex;
	flex: 0 1 100px;
}

.cancel {
	padding: 0;
	font-size: 1em;
	height: 100%;
	flex: 0 1 50px;
}

.account {
	height: 100%;
	display: inline-flex;
	vertical-align: bottom;
	flex: 0 1 50px;
}

.avatar {
	width: 28px;
	height: 28px;
	margin: auto;
}

.headerRight {
	display: flex;
	min-height: 48px;
	font-size: 0.9em;
	flex-wrap: nowrap;
	align-items: center;
	margin-left: auto;
	gap: 4px;
	overflow: clip;
	padding-left: 4px;
}

.submit {
	margin: 12px 12px 12px 6px;
	vertical-align: bottom;

	&:disabled {
		opacity: 0.7;
	}

	&.posting {
		cursor: wait;
	}

	&:not(:disabled):hover {
		> .inner {
			background: linear-gradient(90deg, var(--X8), var(--X8));
		}
	}

	&:not(:disabled):active {
		> .inner {
			background: linear-gradient(90deg, var(--X8), var(--X8));
		}
	}
}

.submitInner {
	padding: 0 12px;
	line-height: 34px;
	font-weight: bold;
	border-radius: 6px;
	min-width: 90px;
	box-sizing: border-box;
	color: var(--fgOnAccent);
	background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
}

.headerRightItem {
	margin: 0;
	padding: 8px;
	border-radius: 6px;

	&:hover {
		background: var(--X5);
	}

	&:disabled {
		background: none;
	}

	&.danger {
		color: #ff2a2a;
	}
}

.headerRightButtonText {
	padding-left: 6px;
}

.visibility {
	overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;

	&:enabled {
		> .headerRightButtonText {
			opacity: 0.8;
		}
	}
}
//#endregion

.preview {
	padding: 16px 20px 0 20px;
	max-height: 150px;
	overflow: auto;
}

.targetNote {
	padding: 0 20px 16px 20px;
}

.withQuote {
	margin: 0 0 8px 0;
	color: var(--accent);
}

.toSpecified {
	padding: 6px 24px;
	margin-bottom: 8px;
	overflow: auto;
	white-space: nowrap;
}

.visibleUsers {
	display: inline;
	top: -1px;
	font-size: 14px;
}

.visibleUser {
	margin-right: 14px;
	padding: 8px 0 8px 8px;
	border-radius: 8px;
	background: var(--X4);
}

.hasNotSpecifiedMentions {
	margin: 0 20px 16px 20px;
}

.cw,
.hashtags,
.text {
	display: block;
	box-sizing: border-box;
	padding: 0 24px;
	margin: 0;
	width: 100%;
	font-size: 16px;
	border: none;
	border-radius: 0;
	background: transparent;
	color: var(--fg);
	font-family: inherit;

	&:focus {
		outline: none;
	}

	&:disabled {
		opacity: 0.5;
	}
}

.cw {
	z-index: 1;
	padding-bottom: 8px;
	border-bottom: solid 0.5px var(--divider);
}

.hashtags {
	z-index: 1;
	padding-top: 8px;
	padding-bottom: 8px;
	border-top: solid 0.5px var(--divider);
}

.textOuter {
	width: 100%;
	position: relative;

	&.withCw {
		padding-top: 8px;
	}
}

.text {
	max-width: 100%;
	min-width: 100%;
	width: 100%;
	min-height: 90px;
	height: 100%;
}

.textCount {
	position: absolute;
	top: 0;
	right: 2px;
	padding: 4px 6px;
	font-size: .9em;
	color: var(--warn);
	border-radius: 6px;
	min-width: 1.6em;
	text-align: center;

	&.textOver {
		color: #ff2a2a;
	}
}

.footer {
	display: flex;
	padding: 0 16px 16px 16px;
	font-size: 1em;
}

.footerLeft {
	flex: 1;
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
	grid-auto-rows: 40px;
}

.footerRight {
	flex: 0;
	margin-left: auto;
	display: grid;
	grid-auto-flow: row;
	grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
	grid-auto-rows: 40px;
	direction: rtl;
}

.footerButton {
	display: inline-block;
	padding: 0;
	margin: 0;
	font-size: 1em;
	width: auto;
	height: 100%;
	border-radius: 6px;

	&:hover {
		background: var(--X5);
	}

	&.footerButtonActive {
		color: var(--accent);
	}
}

.previewButtonActive {
	color: var(--accent);
}

@container (max-width: 500px) {
	.headerRight {
		font-size: .9em;
	}

	.headerRightButtonText {
		display: none;
	}

	.visibility {
		overflow: initial;
	}

	.submit {
		margin: 8px 8px 8px 4px;
	}

	.toSpecified {
		padding: 6px 16px;
	}

	.preview {
		padding: 16px 14px 0 14px;
	}
	.cw,
	.hashtags,
	.text {
		padding: 0 16px;
	}

	.text {
		min-height: 80px;
	}

	.footer {
		padding: 0 8px 8px 8px;
	}
}

@container (max-width: 350px) {
	.footer {
		font-size: 0.9em;
	}

	.footerLeft {
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
	}

	.footerRight {
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
	}

	.headerRight {
		gap: 0;
	}
}
</style>
