// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Acct from 'misskey-js/built/acct';
import { host as localHost } from '@/config';

export async function genSearchQuery(v: any, q: string) {
	let host: string;
	let userId: string;
	if (q.split(' ').some(x => x.startsWith('@'))) {
		for (const at of q.split(' ').filter(x => x.startsWith('@')).map(x => x.substring(1))) {
			if (at.includes('.')) {
				if (at === localHost || at === '.') {
					host = null;
				} else {
					host = at;
				}
			} else {
				const user = await v.os.api('users/show', Acct.parse(at)).catch(x => null);
				if (user) {
					userId = user.id;
				} else {
					// todo: show error
				}
			}
		}
	}
	return {
		query: q.split(' ').filter(x => !x.startsWith('/') && !x.startsWith('@')).join(' '),
		host: host,
		userId: userId,
	};
}
