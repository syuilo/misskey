// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from '@/os';
import { instance } from '@/instance';
import { host } from '@/config';
import { i18n } from '@/i18n';
import { $i } from '@/account';

export function openInstanceMenu(ev: MouseEvent) {
	os.popupMenu([{
		text: instance.name ?? host,
		type: 'label',
	}, {
		type: 'link',
		text: i18n.ts.instanceInfo,
		icon: 'ti ti-info-circle',
		to: '/about',
	}, {
		type: 'link',
		text: i18n.ts.customEmojis,
		icon: 'ti ti-icons',
		to: '/about#emojis',
	}, {
		type: 'link',
		text: i18n.ts.federation,
		icon: 'ti ti-whirl',
		to: '/about#federation',
	}, {
		type: 'link',
		text: i18n.ts.charts,
		icon: 'ti ti-chart-line',
		to: '/about#charts',
	}, null, {
		type: 'link',
		text: i18n.ts.ads,
		icon: 'ti ti-ad',
		to: '/ads',
	}, ($i && ($i.isAdmin || $i.policies.canInvite) && instance.disableRegistration) ? {
		type: 'link',
		to: '/invite',
		text: i18n.ts.invite,
		icon: 'ti ti-user-plus',
	} : undefined, {
		type: 'parent',
		text: i18n.ts.tools,
		icon: 'ti ti-tool',
		children: [{
			type: 'link',
			to: '/scratchpad',
			text: i18n.ts.scratchpad,
			icon: 'ti ti-terminal-2',
		}, {
			type: 'link',
			to: '/api-console',
			text: 'API Console',
			icon: 'ti ti-terminal-2',
		}, {
			type: 'link',
			to: '/clicker',
			text: '🍪👈',
			icon: 'ti ti-cookie',
		}, ($i && ($i.isAdmin || $i.policies.canManageCustomEmojis)) ? {
			type: 'link',
			to: '/custom-emojis-manager',
			text: i18n.ts.manageCustomEmojis,
			icon: 'ti ti-icons',
		} : undefined],
	}, null, {
		text: i18n.ts.help,
		icon: 'ti ti-help-circle',
		action: () => {
			window.open('https://misskey-hub.net/help.html', '_blank');
		},
	}, {
		type: 'link',
		text: i18n.ts.aboutMisskey,
		to: '/about-misskey',
	}], ev.currentTarget ?? ev.target, {
		align: 'left',
	});
}
