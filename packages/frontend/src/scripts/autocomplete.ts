/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { nextTick, ref, defineAsyncComponent } from 'vue';
import type { Ref } from 'vue';
import getCaretCoordinates from 'textarea-caret';
import { toASCII } from 'punycode.js';
import { popup } from '@/os.js';

export type SuggestionType = 'user' | 'hashtag' | 'emoji' | 'mfmTag' | 'mfmParam';

export class Autocomplete {
	private suggestion: {
		x: Ref<number>;
		y: Ref<number>;
		q: Ref<any>;
		close: () => void;
	} | null;
	private textarea: HTMLInputElement | HTMLTextAreaElement;
	private currentType: string;
	private textRef: Ref<string | number | null>;
	private opening: boolean;
	private onlyType: SuggestionType[];

	private get text(): string {
		// Use raw .value to get the latest value
		// (Because v-model does not update while composition)
		return this.textarea.value;
	}

	private set text(text: string) {
		// Use ref value to notify other watchers
		// (Because .value setter never fires input/change events)
		this.textRef.value = text;
	}

	/**
	 * 対象のテキストエリアを与えてインスタンスを初期化します。
	 */
	constructor(textarea: HTMLInputElement | HTMLTextAreaElement, textRef: Ref<string | number | null>, onlyType?: SuggestionType[]) {
		//#region BIND
		this.onInput = this.onInput.bind(this);
		this.complete = this.complete.bind(this);
		this.close = this.close.bind(this);
		//#endregion

		this.suggestion = null;
		this.textarea = textarea;
		this.textRef = textRef;
		this.opening = false;
		this.onlyType = onlyType ?? ['user', 'hashtag', 'emoji', 'mfmTag', 'mfmParam'];

		this.attach();
	}

	/**
	 * このインスタンスにあるテキストエリアの入力のキャプチャを開始します。
	 */
	public attach() {
		this.textarea.addEventListener('input', this.onInput);
	}

	/**
	 * このインスタンスにあるテキストエリアの入力のキャプチャを解除します。
	 */
	public detach() {
		this.textarea.removeEventListener('input', this.onInput);
		this.close();
	}

	/**
	 * テキスト入力時
	 */
	private onInput() {
		const caretPos = this.textarea.selectionStart;
		const text = this.text.substring(0, caretPos).split('\n').pop()!;

		const mentionIndex = text.lastIndexOf('@');
		const hashtagIndex = text.lastIndexOf('#');
		const emojiIndex = text.lastIndexOf(':');
		const mfmTagIndex = text.lastIndexOf('$');
		const mfmParamIndex = text.lastIndexOf('.');

		const max = Math.max(
			mentionIndex,
			hashtagIndex,
			emojiIndex,
			mfmTagIndex);

		if (max === -1) {
			this.close();
			return;
		}

		const afterLastMfmParam = text.split(/\$\[[a-zA-Z]+/).pop();

		const isMention = mentionIndex !== -1;
		const isHashtag = hashtagIndex !== -1;
		const isMfmParam = mfmParamIndex !== -1 && afterLastMfmParam?.includes('.') && !afterLastMfmParam?.includes(' ');
		const isMfmTag = mfmTagIndex !== -1 && !isMfmParam;
		const isEmoji = emojiIndex !== -1 && text.split(/:[a-z0-9_+\-]+:/).pop()!.includes(':');

		let opened = false;

		if (isMention && this.onlyType.includes('user')) {
			const username = text.substring(mentionIndex + 1);
			if (username !== '' && username.match(/^[a-zA-Z0-9_]+$/)) {
				this.open('user', username);
				opened = true;
			} else if (username === '') {
				this.open('user', null);
				opened = true;
			}
		}

		if (isHashtag && !opened && this.onlyType.includes('hashtag')) {
			const hashtag = text.substring(hashtagIndex + 1);
			if (!hashtag.includes(' ')) {
				this.open('hashtag', hashtag);
				opened = true;
			}
		}

		if (isEmoji && !opened && this.onlyType.includes('emoji')) {
			const emoji = text.substring(emojiIndex + 1);
			if (!emoji.includes(' ')) {
				this.open('emoji', emoji);
				opened = true;
			}
		}

		if (isMfmTag && !opened && this.onlyType.includes('mfmTag')) {
			const mfmTag = text.substring(mfmTagIndex + 1);
			if (!mfmTag.includes(' ')) {
				this.open('mfmTag', mfmTag.replace('[', ''));
				opened = true;
			}
		}

		if (isMfmParam && !opened && this.onlyType.includes('mfmParam')) {
			const mfmParam = text.substring(mfmParamIndex + 1);
			if (!mfmParam.includes(' ')) {
				this.open('mfmParam', {
					tag: text.substring(mfmTagIndex + 2, mfmParamIndex),
					params: mfmParam.split(','),
				});
				opened = true;
			}
		}

		if (!opened) {
			this.close();
		}
	}

	/**
	 * サジェストを提示します。
	 */
	private async open(type: string, q: any) {
		if (type !== this.currentType) {
			this.close();
		}
		if (this.opening) return;
		this.opening = true;
		this.currentType = type;

		//#region サジェストを表示すべき位置を計算
		const caretPosition = getCaretCoordinates(this.textarea, this.textarea.selectionStart);

		const rect = this.textarea.getBoundingClientRect();

		const x = rect.left + caretPosition.left - this.textarea.scrollLeft;
		const y = rect.top + caretPosition.top - this.textarea.scrollTop;
		//#endregion

		if (this.suggestion) {
			this.suggestion.x.value = x;
			this.suggestion.y.value = y;
			this.suggestion.q.value = q;

			this.opening = false;
		} else {
			const _x = ref(x);
			const _y = ref(y);
			const _q = ref(q);

			const { dispose } = await popup(defineAsyncComponent(() => import('@/components/MkAutocomplete.vue')), {
				textarea: this.textarea,
				close: this.close,
				type: type,
				q: _q,
				x: _x,
				y: _y,
			}, {
				done: (res) => {
					this.complete(res);
				},
			});

			this.suggestion = {
				q: _q,
				x: _x,
				y: _y,
				close: () => dispose(),
			};

			this.opening = false;
		}
	}

	/**
	 * サジェストを閉じます。
	 */
	private close() {
		if (this.suggestion == null) return;

		this.suggestion.close();
		this.suggestion = null;

		this.textarea.focus();
	}

	/**
	 * オートコンプリートする
	 */
	private complete({ type, value }) {
		this.close();

		const caret = this.textarea.selectionStart;

		if (type === 'user') {
			const source = this.text;

			const before = source.substring(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('@'));
			const after = source.substring(caret);

			const acct = value.host === null ? value.username : `${value.username}@${toASCII(value.host)}`;

			// 挿入
			this.text = `${trimmedBefore}@${acct} ${after}`;

			// キャレットを戻す
			nextTick(() => {
				this.textarea.focus();
				const pos = trimmedBefore.length + (acct.length + 2);
				this.textarea.setSelectionRange(pos, pos);
			});
		} else if (type === 'hashtag') {
			const source = this.text;

			const before = source.substring(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('#'));
			const after = source.substring(caret);

			// 挿入
			this.text = `${trimmedBefore}#${value} ${after}`;

			// キャレットを戻す
			nextTick(() => {
				this.textarea.focus();
				const pos = trimmedBefore.length + (value.length + 2);
				this.textarea.setSelectionRange(pos, pos);
			});
		} else if (type === 'emoji') {
			const source = this.text;

			const before = source.substring(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf(':'));
			const after = source.substring(caret);

			// 挿入
			this.text = trimmedBefore + value + after;

			// キャレットを戻す
			nextTick(() => {
				this.textarea.focus();
				const pos = trimmedBefore.length + value.length;
				this.textarea.setSelectionRange(pos, pos);
			});
		} else if (type === 'mfmTag') {
			const source = this.text;

			const before = source.substring(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('$'));
			const after = source.substring(caret);

			// 挿入
			this.text = `${trimmedBefore}$[${value} ]${after}`;

			// キャレットを戻す
			nextTick(() => {
				this.textarea.focus();
				const pos = trimmedBefore.length + (value.length + 3);
				this.textarea.setSelectionRange(pos, pos);
			});
		} else if (type === 'mfmParam') {
			const source = this.text;

			const before = source.substring(0, caret);
			const trimmedBefore = before.substring(0, before.lastIndexOf('.'));
			const after = source.substring(caret);

			// 挿入
			this.text = `${trimmedBefore}.${value}${after}`;

			// キャレットを戻す
			nextTick(() => {
				this.textarea.focus();
				const pos = trimmedBefore.length + (value.length + 1);
				this.textarea.setSelectionRange(pos, pos);
			});
		}
	}
}
