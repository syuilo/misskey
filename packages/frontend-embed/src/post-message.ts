/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const postMessageEventTypes = [
	'misskey:embed:ready',
	'misskey:embed:changeHeight',
] as const;

export type PostMessageEventType = typeof postMessageEventTypes[number];

export interface PostMessageEventPayload extends Record<PostMessageEventType, any> {
	'misskey:embed:ready': undefined;
	'misskey:embed:changeHeight': {
		height: number;
	};
}

export type MiPostMessageEvent<T extends PostMessageEventType = PostMessageEventType> = {
	type: T;
	iframeId?: string;
	payload?: PostMessageEventPayload[T];
};

let defaultIframeId: string | null = null;

export function setIframeId(id: string): void {
	if (defaultIframeId != null) return;

	if (_DEV_) console.log('setIframeId', id);
	defaultIframeId = id;
}

/**
 * 親フレームにイベントを送信
 */
export function postMessageToParentWindow<T extends PostMessageEventType = PostMessageEventType>(type: T, payload?: PostMessageEventPayload[T], iframeId: string | null = null): void {
	let _iframeId = iframeId;
	if (_iframeId == null) {
		_iframeId = defaultIframeId;
	}
	if (_DEV_) console.log('postMessageToParentWindow', type, _iframeId, payload);
	window.parent.postMessage({
		type,
		iframeId: _iframeId,
		payload,
	}, '*');
}
