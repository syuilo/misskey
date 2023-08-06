// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { query } from '@/scripts/url';
import { url } from '@/config';
import { instance } from '@/instance';

export function getProxiedImageUrl(imageUrl: string, type?: 'preview' | 'emoji' | 'avatar', mustOrigin = false, noFallback = false): string {
	const localProxy = `${url}/proxy`;

	if (imageUrl.startsWith(instance.mediaProxy + '/') || imageUrl.startsWith('/proxy/') || imageUrl.startsWith(localProxy + '/')) {
		// もう既にproxyっぽそうだったらurlを取り出す
		imageUrl = (new URL(imageUrl)).searchParams.get('url') ?? imageUrl;
	}

	return `${mustOrigin ? localProxy : instance.mediaProxy}/${
		type === 'preview' ? 'preview.webp'
		: 'image.webp'
	}?${query({
		url: imageUrl,
		...(!noFallback ? { 'fallback': '1' } : {}),
		...(type ? { [type]: '1' } : {}),
		...(mustOrigin ? { origin: '1' } : {}),
	})}`;
}

export function getProxiedImageUrlNullable(imageUrl: string | null | undefined, type?: 'preview'): string | null {
	if (imageUrl == null) return null;
	return getProxiedImageUrl(imageUrl, type);
}

export function getStaticImageUrl(baseUrl: string): string {
	const u = baseUrl.startsWith('http') ? new URL(baseUrl) : new URL(baseUrl, url);

	if (u.href.startsWith(`${url}/emoji/`)) {
		// もう既にemojiっぽそうだったらsearchParams付けるだけ
		u.searchParams.set('static', '1');
		return u.href;
	}

	if (u.href.startsWith(instance.mediaProxy + '/')) {
		// もう既にproxyっぽそうだったらsearchParams付けるだけ
		u.searchParams.set('static', '1');
		return u.href;
	}

	return `${instance.mediaProxy}/static.webp?${query({
		url: u.href,
		static: '1',
	})}`;
}
