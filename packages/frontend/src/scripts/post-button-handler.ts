/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Resolved } from '@/nirax.js';
import { post } from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { miLocalStorage } from '@/local-storage.js';

/** 「ノート」というボタンを押させるときはこっちを呼ぶ */
export async function postButtonHandler(currentRef: Resolved) {
	if (currentRef.route.name === 'channel') {
		const channelId = currentRef.props.get('channelId');
		if (typeof channelId === 'string') {
			// NOTE: チャンネルを開いているならば、チャンネルの情報がキャッシュされていることを期待できるはずである
			const channelJSON = miLocalStorage.getItem(`channel:${channelId}`);
			if (channelJSON) {
				const channel = JSON.parse(channelJSON);
				if (channel) {
					await post({ channel });
					return;
				}
				miLocalStorage.removeItem(`channel:${channelId}`);
			}
			const channel = await misskeyApi('channels/show', { channelId });
			await post({ channel });
			return;
		}
	}

	await post();
}

