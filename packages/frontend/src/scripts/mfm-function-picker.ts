/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { nextTick } from 'vue';
import type { Ref } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { MFM_TAGS } from '@@/js/const.js';
import type { MenuItem } from '@/types/menu.js';

/**
 * MFMの装飾のリストを表示する
 */
export function mfmFunctionPicker(src: HTMLElement | EventTarget | null, textArea: HTMLInputElement | HTMLTextAreaElement, textRef: Ref<string>) {
	os.popupMenu([{
		text: i18n.ts.addMfmFunction,
		type: 'label',
	}, ...getFunctionList(textArea, textRef)], src);
}

function getFunctionList(textArea: HTMLInputElement | HTMLTextAreaElement, textRef: Ref<string>): MenuItem[] {
	return MFM_TAGS.map(tag => ({
		text: tag,
		icon: 'ti ti-icons',
		action: () => add(textArea, textRef, tag),
	}));
}

function add(textArea: HTMLInputElement | HTMLTextAreaElement, textRef: Ref<string>, type: string) {
	const caretStart: number = textArea.selectionStart as number;
	const caretEnd: number = textArea.selectionEnd as number;

	MFM_TAGS.forEach(tag => {
		if (type === tag) {
			if (caretStart === caretEnd) {
				// 単純にFunctionを追加
				const trimmedText = `${textRef.value.substring(0, caretStart)}$[${type} ]${textRef.value.substring(caretEnd)}`;
				textRef.value = trimmedText;
			} else {
				// 選択範囲を囲むようにFunctionを追加
				const trimmedText = `${textRef.value.substring(0, caretStart)}$[${type} ${textRef.value.substring(caretStart, caretEnd)}]${textRef.value.substring(caretEnd)}`;
				textRef.value = trimmedText;
			}
		}
	});

	const nextCaretStart: number = caretStart + 3 + type.length;
	const nextCaretEnd: number = caretEnd + 3 + type.length;

	// キャレットを戻す
	nextTick(() => {
		textArea.focus();
		textArea.setSelectionRange(nextCaretStart, nextCaretEnd);
	});
}
