/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, Ref, ref } from 'vue';
import { popup } from '@/os.js';
import { defaultStore } from '@/store.js';

/**
 * 絵文字ピッカーを表示する。
 * 類似の機能として{@link ReactionPicker}が存在しているが、この機能とは動きが異なる。
 * 投稿フォームなどで絵文字を選択する時など、絵文字ピックアップ後でもダイアログが消えずに残り、
 * 一度表示したダイアログを連続で使用できることが望ましいシーンでの利用が想定される。
 */
class EmojiPicker {
	private src: Ref<HTMLElement | null> = ref(null);

	private isWindow: boolean = false;
	private windowShowing: boolean = false;

	private dialogShowing = ref(false);

	private onChosen?: (emoji: string) => void;
	private onClosed?: () => void;

	constructor() {
		// nop
	}

	public async init() {
		const emojisRef = defaultStore.reactiveState.pinnedEmojis;
		if (defaultStore.state.emojiPickerStyle === 'window') {
			// init後にemojiPickerStyleが変わった場合、drawer/popup用の初期化をスキップするため、
			// 正常に絵文字ピッカーが表示されない。
			// なので一度initされたらwindow表示で固定する（設定を変更したら要リロード）
			this.isWindow = true;
		} else {
			await popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerDialog.vue')), {
				src: this.src,
				pinnedEmojis: emojisRef,
				asReactionPicker: false,
				manualShowing: this.dialogShowing,
				choseAndClose: false,
			}, {
				done: emoji => {
					if (this.onChosen) this.onChosen(emoji);
				},
				close: () => {
					this.dialogShowing.value = false;
				},
				closed: () => {
					this.src.value = null;
					if (this.onClosed) this.onClosed();
				},
			});
		}
	}

	public show(opts: {
		src: HTMLElement,
		onChosen?: EmojiPicker['onChosen'],
		onClosed?: EmojiPicker['onClosed'],
	}) {
		if (this.isWindow) {
			if (this.windowShowing) return;
			this.windowShowing = true;
			const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerWindow.vue')), {
				src: opts.src,
				pinnedEmojis: defaultStore.reactiveState.pinnedEmojis,
				asReactionPicker: false,
			}, {
				chosen: (emoji) => {
					if (opts.onChosen) opts.onChosen(emoji);
				},
				closed: () => {
					if (opts.onClosed) opts.onClosed();
					this.windowShowing = false;
					dispose();
				},
			});
		} else {
			this.src.value = opts.src;
			this.dialogShowing.value = true;
			this.onChosen = opts.onChosen;
			this.onClosed = opts.onClosed;
		}
	}
}

export const emojiPicker = new EmojiPicker();
