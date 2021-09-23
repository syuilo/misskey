<template>
<div class="pxiwixjf"
	@dragover.stop="onDragover"
	@dragenter="onDragenter"
	@dragleave="onDragleave"
	@drop.stop="onDrop"
>
	<div class="form">
		<div class="with-quote" v-if="quoteId"><i class="fas fa-quote-left"></i> {{ $ts.quoteAttached }}<button @click="quoteId = null"><i class="fas fa-times"></i></button></div>
		<div v-if="visibility === 'specified'" class="to-specified">
			<span style="margin-right: 8px;">{{ $ts.recipient }}</span>
			<div class="visibleUsers">
				<span v-for="u in visibleUsers" :key="u.id">
					<MkAcct :user="u"/>
					<button class="_button" @click="removeVisibleUser(u)"><i class="fas fa-times"></i></button>
				</span>
				<button @click="addVisibleUser" class="_buttonPrimary"><i class="fas fa-plus fa-fw"></i></button>
			</div>
		</div>
		<input v-show="useCw" ref="cw" class="cw" v-model="cw" :placeholder="$ts.annotation" @keydown="onKeydown">
		<textarea v-model="text" class="text" :class="{ withCw: useCw }" ref="text" :disabled="posting" :placeholder="placeholder" @keydown="onKeydown" @paste="onPaste" @compositionupdate="onCompositionUpdate" @compositionend="onCompositionEnd" />
		<XPostFormAttaches class="attaches" :files="files" @updated="updateFiles" @detach="detachFile" @changeSensitive="updateFileSensitive" @changeName="updateFileName"/>
		<XPollEditor v-if="poll" :poll="poll" @destroyed="poll = null" @updated="onPollUpdate"/>
		<footer>
			<div class="left">
				<button class="_button" @click="chooseFileFrom" v-tooltip="$ts.attachFile"><i class="fas fa-photo-video"></i></button>
				<button class="_button" @click="togglePoll" :class="{ active: poll }" v-tooltip="$ts.poll"><i class="fas fa-poll-h"></i></button>
				<button class="_button" @click="useCw = !useCw" :class="{ active: useCw }" v-tooltip="$ts.useCw"><i class="fas fa-eye-slash"></i></button>
				<button class="_button" @click="insertMention" v-tooltip="$ts.mention"><i class="fas fa-at"></i></button>
				<button class="_button" @click="insertEmoji" v-tooltip="$ts.emoji"><i class="fas fa-laugh-squint"></i></button>
				<button class="_button" @click="showActions" v-tooltip="$ts.plugin" v-if="postFormActions.length > 0"><i class="fas fa-plug"></i></button>
			</div>
			<div class="right">
				<span class="text-count" :class="{ over: textLength > max }">{{ max - textLength }}</span>
				<span class="local-only" v-if="localOnly"><i class="fas fa-biohazard"></i></span>
				<button class="_button visibility" @click="setVisibility" ref="visibilityButton" v-tooltip="$ts.visibility" :disabled="channel != null">
					<span v-if="visibility === 'public'"><i class="fas fa-globe"></i></span>
					<span v-if="visibility === 'home'"><i class="fas fa-home"></i></span>
					<span v-if="visibility === 'followers'"><i class="fas fa-unlock"></i></span>
					<span v-if="visibility === 'specified'"><i class="fas fa-envelope"></i></span>
				</button>
				<button class="submit _buttonPrimary" :disabled="!canPost" @click="post">{{ submitText }}<i :class="reply ? 'fas fa-reply' : renote ? 'fas fa-quote-right' : 'fas fa-paper-plane'"></i></button>
			</div>
		</footer>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import insertTextAtCursor from 'insert-text-at-cursor';
import { length } from 'stringz';
import { toASCII } from 'punycode/';
import * as mfm from 'mfm-js';
import { host, url } from '@client/config';
import { erase, unique } from '../../../prelude/array';
import { extractMentions } from '@/misc/extract-mentions';
import { getAcct } from '@/misc/acct';
import { formatTimeString } from '@/misc/format-time-string';
import { Autocomplete } from '@client/scripts/autocomplete';
import * as os from '@client/os';
import { selectFile } from '@client/scripts/select-file';
import { notePostInterruptors, postFormActions } from '@client/store';
import { isMobile } from '@client/scripts/is-mobile';
import { throttle } from 'throttle-debounce';

export default defineComponent({
	components: {
		XPostFormAttaches: defineAsyncComponent(() => import('@client/components/post-form-attaches.vue')),
		XPollEditor: defineAsyncComponent(() => import('@client/components/poll-editor.vue'))
	},

	props: {
		reply: {
			type: Object,
			required: false
		},
		renote: {
			type: Object,
			required: false
		},
		channel: {
			type: String,
			required: false
		},
		mention: {
			type: Object,
			required: false
		},
		specified: {
			type: Object,
			required: false
		},
		initialText: {
			type: String,
			required: false
		},
		initialNote: {
			type: Object,
			required: false
		},
		share: {
			type: Boolean,
			required: false,
			default: false
		},
		autofocus: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	emits: ['posted', 'cancel', 'esc'],

	data() {
		return {
			posting: false,
			text: '',
			files: [],
			poll: null,
			useCw: false,
			cw: null,
			localOnly: this.$store.state.rememberNoteVisibility ? this.$store.state.localOnly : this.$store.state.defaultNoteLocalOnly,
			visibility: this.$store.state.rememberNoteVisibility ? this.$store.state.visibility : this.$store.state.defaultNoteVisibility,
			visibleUsers: [],
			autocomplete: null,
			draghover: false,
			quoteId: null,
			recentHashtags: JSON.parse(localStorage.getItem('hashtags') || '[]'),
			imeText: '',
			typing: throttle(3000, () => {
				if (this.channel) {
					os.stream.send('typingOnChannel', { channel: this.channel });
				}
			}),
			postFormActions,
		};
	},

	computed: {
		draftKey(): string {
			let key = this.channel ? `channel:${this.channel}` : '';

			if (this.renote) {
				key += `renote:${this.renote.id}`;
			} else if (this.reply) {
				key += `reply:${this.reply.id}`;
			} else {
				key += 'note';
			}

			return key;
		},

		placeholder(): string {
			if (this.renote) {
				return this.$ts._postForm.quotePlaceholder;
			} else if (this.reply) {
				return this.$ts._postForm.replyPlaceholder;
			} else if (this.channel) {
				return this.$ts._postForm.channelPlaceholder;
			} else {
				const xs = [
					this.$ts._postForm._placeholders.a,
					this.$ts._postForm._placeholders.b,
					this.$ts._postForm._placeholders.c,
					this.$ts._postForm._placeholders.d,
					this.$ts._postForm._placeholders.e,
					this.$ts._postForm._placeholders.f
				];
				return xs[Math.floor(Math.random() * xs.length)];
			}
		},

		submitText(): string {
			return this.renote
				? this.$ts.quote
				: this.reply
					? this.$ts.reply
					: this.$ts.note;
		},

		textLength(): number {
			return length((this.text + this.imeText).trim());
		},

		canPost(): boolean {
			return !this.posting &&
				(1 <= this.textLength || 1 <= this.files.length || !!this.poll || !!this.renote) &&
				(this.textLength <= this.max) &&
				(!this.poll || this.poll.choices.length >= 2);
		},

		max(): number {
			return this.$instance ? this.$instance.maxNoteTextLength : 1000;
		}
	},

	mounted() {
		if (this.initialText) {
			this.text = this.initialText;
		}

		if (this.mention) {
			this.text = this.mention.host ? `@${this.mention.username}@${toASCII(this.mention.host)}` : `@${this.mention.username}`;
			this.text += ' ';
		}

		if (this.reply && this.reply.user.host != null) {
			this.text = `@${this.reply.user.username}@${toASCII(this.reply.user.host)} `;
		}

		if (this.reply && this.reply.text != null) {
			const ast = mfm.parse(this.reply.text);

			for (const x of extractMentions(ast)) {
				const mention = x.host ? `@${x.username}@${toASCII(x.host)}` : `@${x.username}`;

				// 自分は除外
				if (this.$i.username == x.username && x.host == null) continue;
				if (this.$i.username == x.username && x.host == host) continue;

				// 重複は除外
				if (this.text.indexOf(`${mention} `) != -1) continue;

				this.text += `${mention} `;
			}
		}

		if (this.channel) {
			this.visibility = 'public';
			this.localOnly = true; // TODO: チャンネルが連合するようになった折には消す
		}

		// 公開以外へのリプライ時は元の公開範囲を引き継ぐ
		if (this.reply && ['home', 'followers', 'specified'].includes(this.reply.visibility)) {
			this.visibility = this.reply.visibility;
			if (this.reply.visibility === 'specified') {
				os.api('users/show', {
					userIds: this.reply.visibleUserIds.filter(uid => uid !== this.$i.id && uid !== this.reply.userId)
				}).then(users => {
					this.visibleUsers.push(...users);
				});

				if (this.reply.userId !== this.$i.id) {
					os.api('users/show', { userId: this.reply.userId }).then(user => {
						this.visibleUsers.push(user);
					});
				}
			}
		}

		if (this.specified) {
			this.visibility = 'specified';
			this.visibleUsers.push(this.specified);
		}

		// keep cw when reply
		if (this.$store.state.keepCw && this.reply && this.reply.cw) {
			this.useCw = true;
			this.cw = this.reply.cw;
		}

		if (this.autofocus) {
			this.focus();

			this.$nextTick(() => {
				this.focus();
			});
		}

		// TODO: detach when unmount
		new Autocomplete(this.$refs.text, this, { model: 'text' });
		new Autocomplete(this.$refs.cw, this, { model: 'cw' });

		this.$nextTick(() => {
			// 書きかけの投稿を復元
			if (!this.share && !this.mention && !this.specified) {
				const draft = JSON.parse(localStorage.getItem('drafts') || '{}')[this.draftKey];
				if (draft) {
					this.text = draft.data.text;
					this.useCw = draft.data.useCw;
					this.cw = draft.data.cw;
					this.visibility = draft.data.visibility;
					this.localOnly = draft.data.localOnly;
					this.files = (draft.data.files || []).filter(e => e);
					if (draft.data.poll) {
						this.poll = draft.data.poll;
					}
				}
			}

			// 削除して編集
			if (this.initialNote) {
				const init = this.initialNote;
				this.text = init.text ? init.text : '';
				this.files = init.files;
				this.cw = init.cw;
				this.useCw = init.cw != null;
				if (init.poll) {
					this.poll = init.poll;
				}
				this.visibility = init.visibility;
				this.localOnly = init.localOnly;
				this.quoteId = init.renote ? init.renote.id : null;
			}

			this.$nextTick(() => this.watch());
		});
	},

	methods: {
		watch() {
			this.$watch('text', () => this.saveDraft());
			this.$watch('useCw', () => this.saveDraft());
			this.$watch('cw', () => this.saveDraft());
			this.$watch('poll', () => this.saveDraft());
			this.$watch('files', () => this.saveDraft(), { deep: true });
			this.$watch('visibility', () => this.saveDraft());
			this.$watch('localOnly', () => this.saveDraft());
		},

		togglePoll() {
			if (this.poll) {
				this.poll = null;
			} else {
				this.poll = {
					choices: ['', ''],
					multiple: false,
					expiresAt: null,
					expiredAfter: null,
				};
			}
		},

		addTag(tag: string) {
			insertTextAtCursor(this.$refs.text, ` #${tag} `);
		},

		focus() {
			(this.$refs.text as any).focus();
		},

		chooseFileFrom(ev) {
			selectFile(ev.currentTarget || ev.target, this.$ts.attachFile, true).then(files => {
				for (const file of files) {
					this.files.push(file);
				}
			});
		},

		detachFile(id) {
			this.files = this.files.filter(x => x.id != id);
		},

		updateFiles(files) {
			this.files = files;
		},

		updateFileSensitive(file, sensitive) {
			this.files[this.files.findIndex(x => x.id === file.id)].isSensitive = sensitive;
		},

		updateFileName(file, name) {
			this.files[this.files.findIndex(x => x.id === file.id)].name = name;
		},

		upload(file: File, name?: string) {
			os.upload(file, this.$store.state.uploadFolder, name).then(res => {
				this.files.push(res);
			});
		},

		onPollUpdate(poll) {
			this.poll = poll;
			this.saveDraft();
		},

		setVisibility() {
			if (this.channel) {
				// TODO: information dialog
				return;
			}

			os.popup(import('@client/components/visibility-picker.vue'), {
				currentVisibility: this.visibility,
				currentLocalOnly: this.localOnly,
				src: this.$refs.visibilityButton
			}, {
				changeVisibility: visibility => {
					this.visibility = visibility;
					if (this.$store.state.rememberNoteVisibility) {
						this.$store.set('visibility', visibility);
					}
				},
				changeLocalOnly: localOnly => {
					this.localOnly = localOnly;
					if (this.$store.state.rememberNoteVisibility) {
						this.$store.set('localOnly', localOnly);
					}
				}
			}, 'closed');
		},

		addVisibleUser() {
			os.selectUser().then(user => {
				this.visibleUsers.push(user);
			});
		},

		removeVisibleUser(user) {
			this.visibleUsers = erase(user, this.visibleUsers);
		},

		clear() {
			this.text = '';
			this.files = [];
			this.poll = null;
			this.quoteId = null;
		},

		onKeydown(e: KeyboardEvent) {
			if ((e.which === 10 || e.which === 13) && (e.ctrlKey || e.metaKey) && this.canPost) this.post();
			if (e.which === 27) this.$emit('esc');
			this.typing();
		},

		onCompositionUpdate(e: CompositionEvent) {
			this.imeText = e.data;
			this.typing();
		},

		onCompositionEnd(e: CompositionEvent) {
			this.imeText = '';
		},

		async onPaste(e: ClipboardEvent) {
			for (const { item, i } of Array.from(e.clipboardData.items).map((item, i) => ({item, i}))) {
				if (item.kind == 'file') {
					const file = item.getAsFile();
					const lio = file.name.lastIndexOf('.');
					const ext = lio >= 0 ? file.name.slice(lio) : '';
					const formatted = `${formatTimeString(new Date(file.lastModified), this.$store.state.pastedFileName).replace(/{{number}}/g, `${i + 1}`)}${ext}`;
					this.upload(file, formatted);
				}
			}

			const paste = e.clipboardData.getData('text');

			if (!this.renote && !this.quoteId && paste.startsWith(url + '/notes/')) {
				e.preventDefault();

				os.dialog({
					type: 'info',
					text: this.$ts.quoteQuestion,
					showCancelButton: true
				}).then(({ canceled }) => {
					if (canceled) {
						insertTextAtCursor(this.$refs.text, paste);
						return;
					}

					this.quoteId = paste.substr(url.length).match(/^\/notes\/(.+?)\/?$/)[1];
				});
			}
		},

		onDragover(e) {
			if (!e.dataTransfer.items[0]) return;
			const isFile = e.dataTransfer.items[0].kind == 'file';
			const isDriveFile = e.dataTransfer.types[0] == _DATA_TRANSFER_DRIVE_FILE_;
			if (isFile || isDriveFile) {
				e.preventDefault();
				this.draghover = true;
				e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed == 'all' ? 'copy' : 'move';
			}
		},

		onDragenter(e) {
			this.draghover = true;
		},

		onDragleave(e) {
			this.draghover = false;
		},

		onDrop(e): void {
			this.draghover = false;

			// ファイルだったら
			if (e.dataTransfer.files.length > 0) {
				e.preventDefault();
				for (const x of Array.from(e.dataTransfer.files)) this.upload(x);
				return;
			}

			//#region ドライブのファイル
			const driveFile = e.dataTransfer.getData(_DATA_TRANSFER_DRIVE_FILE_);
			if (driveFile != null && driveFile != '') {
				const file = JSON.parse(driveFile);
				this.files.push(file);
				e.preventDefault();
			}
			//#endregion
		},

		saveDraft() {
			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			data[this.draftKey] = {
				updatedAt: new Date(),
				data: {
					text: this.text,
					useCw: this.useCw,
					cw: this.cw,
					visibility: this.visibility,
					localOnly: this.localOnly,
					files: this.files,
					poll: this.poll
				}
			};

			localStorage.setItem('drafts', JSON.stringify(data));
		},

		deleteDraft() {
			const data = JSON.parse(localStorage.getItem('drafts') || '{}');

			delete data[this.draftKey];

			localStorage.setItem('drafts', JSON.stringify(data));
		},

		async post() {
			let data = {
				text: this.text == '' ? undefined : this.text,
				fileIds: this.files.length > 0 ? this.files.map(f => f.id) : undefined,
				replyId: this.reply ? this.reply.id : undefined,
				renoteId: this.renote ? this.renote.id : this.quoteId ? this.quoteId : undefined,
				channelId: this.channel ? this.channel : undefined,
				poll: this.poll,
				cw: this.useCw ? this.cw || '' : undefined,
				localOnly: this.localOnly,
				visibility: this.visibility,
				visibleUserIds: this.visibility == 'specified' ? this.visibleUsers.map(u => u.id) : undefined,
				viaMobile: isMobile
			};

			// plugin
			if (notePostInterruptors.length > 0) {
				for (const interruptor of notePostInterruptors) {
					data = await interruptor.handler(JSON.parse(JSON.stringify(data)));
				}
			}

			this.posting = true;
			os.api('notes/create', data).then(() => {
				this.clear();
				this.$nextTick(() => {
					this.deleteDraft();
					this.$emit('posted');
					if (this.text && this.text != '') {
						const hashtags = mfm.parse(this.text).filter(x => x.type === 'hashtag').map(x => x.props.hashtag);
						const history = JSON.parse(localStorage.getItem('hashtags') || '[]') as string[];
						localStorage.setItem('hashtags', JSON.stringify(unique(hashtags.concat(history))));
					}
					this.posting = false;
				});
			}).catch(err => {
				this.posting = false;
				os.dialog({
					type: 'error',
					text: err.message + '\n' + (err as any).id,
				});
			});
		},

		cancel() {
			this.$emit('cancel');
		},

		insertMention() {
			os.selectUser().then(user => {
				insertTextAtCursor(this.$refs.text, '@' + getAcct(user) + ' ');
			});
		},

		async insertEmoji(ev) {
			os.openEmojiPicker(ev.currentTarget || ev.target, {}, this.$refs.text);
		},

		showActions(ev) {
			os.popupMenu(postFormActions.map(action => ({
				text: action.title,
				action: () => {
					action.handler({
						text: this.text
					}, (key, value) => {
						if (key === 'text') { this.text = value; }
					});
				}
			})), ev.currentTarget || ev.target);
		}
	}
});
</script>

<style lang="scss" scoped>
.pxiwixjf {
	position: relative;
	border: solid 0.5px var(--divider);
	border-radius: 8px;

	> .form {
		> .preview {
			padding: 16px;
		}

		> .with-quote {
			margin: 0 0 8px 0;
			color: var(--accent);

			> button {
				padding: 4px 8px;
				color: var(--accentAlpha04);

				&:hover {
					color: var(--accentAlpha06);
				}

				&:active {
					color: var(--accentDarken30);
				}
			}
		}

		> .to-specified {
			padding: 6px 24px;
			margin-bottom: 8px;
			overflow: auto;
			white-space: nowrap;

			> .visibleUsers {
				display: inline;
				top: -1px;
				font-size: 14px;

				> button {
					padding: 4px;
					border-radius: 8px;
				}

				> span {
					margin-right: 14px;
					padding: 8px 0 8px 8px;
					border-radius: 8px;
					background: var(--X4);

					> button {
						padding: 4px 8px;
					}
				}
			}
		}

		> .cw,
		> .text {
			display: block;
			box-sizing: border-box;
			padding: 16px;
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

		> .cw {
			z-index: 1;
			padding-bottom: 8px;
			border-bottom: solid 0.5px var(--divider);
		}

		> .text {
			max-width: 100%;
			min-width: 100%;
			min-height: 60px;

			&.withCw {
				padding-top: 8px;
			}
		}

		> footer {
			$height: 44px;
			display: flex;
			padding: 0 8px 8px 8px;
			line-height: $height;

			> .left {
				> button {
					display: inline-block;
					padding: 0;
					margin: 0;
					font-size: 16px;
					width: $height;
					height: $height;
					border-radius: 6px;

					&:hover {
						background: var(--X5);
					}

					&.active {
						color: var(--accent);
					}
				}
			}

			> .right {
				margin-left: auto;

				> .text-count {
					opacity: 0.7;
				}

				> .visibility {
					width: $height;
					margin: 0 8px;

					& + .localOnly {
						margin-left: 0 !important;
					}
				}
				
				> .local-only {
					margin: 0 0 0 12px;
					opacity: 0.7;
				}

				> .submit {
					margin: 0;
					padding: 0 12px;
					line-height: 34px;
					font-weight: bold;
					border-radius: 4px;

					&:disabled {
						opacity: 0.7;
					}

					> i {
						margin-left: 6px;
					}
				}
			}
		}
	}
}
</style>
