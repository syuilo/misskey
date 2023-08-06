// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, createApp, watch, markRaw, version as vueVersion, defineAsyncComponent } from 'vue';
import { common } from './common';
import { version, ui, lang, updateLocale } from '@/config';
import { i18n, updateI18n } from '@/i18n';
import { confirm, alert, post, popup, toast } from '@/os';
import { useStream } from '@/stream';
import * as sound from '@/scripts/sound';
import { $i, refreshAccount, login, updateAccount, signout } from '@/account';
import { defaultStore, ColdDeviceStorage } from '@/store';
import { makeHotkey } from '@/scripts/hotkey';
import { reactionPicker } from '@/scripts/reaction-picker';
import { miLocalStorage } from '@/local-storage';
import { claimAchievement, claimedAchievements } from '@/scripts/achievements';
import { mainRouter } from '@/router';
import { initializeSw } from '@/scripts/initialize-sw';
import { deckStore } from '@/ui/deck/deck-store';

export async function mainBoot() {
	const { isClientUpdated } = await common(() => createApp(
		new URLSearchParams(window.location.search).has('zen') || (ui === 'deck' && deckStore.state.useSimpleUiForNonRootPages && location.pathname !== '/') ? defineAsyncComponent(() => import('@/ui/zen.vue')) :
		!$i ? defineAsyncComponent(() => import('@/ui/visitor.vue')) :
		ui === 'deck' ? defineAsyncComponent(() => import('@/ui/deck.vue')) :
		ui === 'classic' ? defineAsyncComponent(() => import('@/ui/classic.vue')) :
		defineAsyncComponent(() => import('@/ui/universal.vue')),
	));

	reactionPicker.init();

	if (isClientUpdated && $i) {
		popup(defineAsyncComponent(() => import('@/components/MkUpdated.vue')), {}, {}, 'closed');
	}

	const stream = useStream();

	let reloadDialogShowing = false;
	stream.on('_disconnected_', async () => {
		if (defaultStore.state.serverDisconnectedBehavior === 'reload') {
			location.reload();
		} else if (defaultStore.state.serverDisconnectedBehavior === 'dialog') {
			if (reloadDialogShowing) return;
			reloadDialogShowing = true;
			const { canceled } = await confirm({
				type: 'warning',
				title: i18n.ts.disconnectedFromServer,
				text: i18n.ts.reloadConfirm,
			});
			reloadDialogShowing = false;
			if (!canceled) {
				location.reload();
			}
		}
	});

	for (const plugin of ColdDeviceStorage.get('plugins').filter(p => p.active)) {
		import('../plugin').then(async ({ install }) => {
			// Workaround for https://bugs.webkit.org/show_bug.cgi?id=242740
			await new Promise(r => setTimeout(r, 0));
			install(plugin);
		});
	}

	const hotkeys = {
		'd': (): void => {
			defaultStore.set('darkMode', !defaultStore.state.darkMode);
		},
		's': (): void => {
			mainRouter.push('/search');
		},
	};

	if ($i) {
		// only add post shortcuts if logged in
		hotkeys['p|n'] = post;

		defaultStore.loaded.then(() => {
			if (defaultStore.state.accountSetupWizard !== -1) {
				popup(defineAsyncComponent(() => import('@/components/MkUserSetupDialog.vue')), {}, {}, 'closed');
			}
		});

		if ($i.isDeleted) {
			alert({
				type: 'warning',
				text: i18n.ts.accountDeletionInProgress,
			});
		}

		const now = new Date();
		const m = now.getMonth() + 1;
		const d = now.getDate();

		if ($i.birthday) {
			const bm = parseInt($i.birthday.split('-')[1]);
			const bd = parseInt($i.birthday.split('-')[2]);
			if (m === bm && d === bd) {
				claimAchievement('loggedInOnBirthday');
			}
		}

		if (m === 1 && d === 1) {
			claimAchievement('loggedInOnNewYearsDay');
		}

		if ($i.loggedInDays >= 3) claimAchievement('login3');
		if ($i.loggedInDays >= 7) claimAchievement('login7');
		if ($i.loggedInDays >= 15) claimAchievement('login15');
		if ($i.loggedInDays >= 30) claimAchievement('login30');
		if ($i.loggedInDays >= 60) claimAchievement('login60');
		if ($i.loggedInDays >= 100) claimAchievement('login100');
		if ($i.loggedInDays >= 200) claimAchievement('login200');
		if ($i.loggedInDays >= 300) claimAchievement('login300');
		if ($i.loggedInDays >= 400) claimAchievement('login400');
		if ($i.loggedInDays >= 500) claimAchievement('login500');
		if ($i.loggedInDays >= 600) claimAchievement('login600');
		if ($i.loggedInDays >= 700) claimAchievement('login700');
		if ($i.loggedInDays >= 800) claimAchievement('login800');
		if ($i.loggedInDays >= 900) claimAchievement('login900');
		if ($i.loggedInDays >= 1000) claimAchievement('login1000');

		if ($i.notesCount > 0) claimAchievement('notes1');
		if ($i.notesCount >= 10) claimAchievement('notes10');
		if ($i.notesCount >= 100) claimAchievement('notes100');
		if ($i.notesCount >= 500) claimAchievement('notes500');
		if ($i.notesCount >= 1000) claimAchievement('notes1000');
		if ($i.notesCount >= 5000) claimAchievement('notes5000');
		if ($i.notesCount >= 10000) claimAchievement('notes10000');
		if ($i.notesCount >= 20000) claimAchievement('notes20000');
		if ($i.notesCount >= 30000) claimAchievement('notes30000');
		if ($i.notesCount >= 40000) claimAchievement('notes40000');
		if ($i.notesCount >= 50000) claimAchievement('notes50000');
		if ($i.notesCount >= 60000) claimAchievement('notes60000');
		if ($i.notesCount >= 70000) claimAchievement('notes70000');
		if ($i.notesCount >= 80000) claimAchievement('notes80000');
		if ($i.notesCount >= 90000) claimAchievement('notes90000');
		if ($i.notesCount >= 100000) claimAchievement('notes100000');

		if ($i.followersCount > 0) claimAchievement('followers1');
		if ($i.followersCount >= 10) claimAchievement('followers10');
		if ($i.followersCount >= 50) claimAchievement('followers50');
		if ($i.followersCount >= 100) claimAchievement('followers100');
		if ($i.followersCount >= 300) claimAchievement('followers300');
		if ($i.followersCount >= 500) claimAchievement('followers500');
		if ($i.followersCount >= 1000) claimAchievement('followers1000');

		if (Date.now() - new Date($i.createdAt).getTime() > 1000 * 60 * 60 * 24 * 365) {
			claimAchievement('passedSinceAccountCreated1');
		}
		if (Date.now() - new Date($i.createdAt).getTime() > 1000 * 60 * 60 * 24 * 365 * 2) {
			claimAchievement('passedSinceAccountCreated2');
		}
		if (Date.now() - new Date($i.createdAt).getTime() > 1000 * 60 * 60 * 24 * 365 * 3) {
			claimAchievement('passedSinceAccountCreated3');
		}

		if (claimedAchievements.length >= 30) {
			claimAchievement('collectAchievements30');
		}

		window.setInterval(() => {
			if (Math.floor(Math.random() * 20000) === 0) {
				claimAchievement('justPlainLucky');
			}
		}, 1000 * 10);

		window.setTimeout(() => {
			claimAchievement('client30min');
		}, 1000 * 60 * 30);

		window.setTimeout(() => {
			claimAchievement('client60min');
		}, 1000 * 60 * 60);

		const lastUsed = miLocalStorage.getItem('lastUsed');
		if (lastUsed) {
			const lastUsedDate = parseInt(lastUsed, 10);
			// 二時間以上前なら
			if (Date.now() - lastUsedDate > 1000 * 60 * 60 * 2) {
				toast(i18n.t('welcomeBackWithName', {
					name: $i.name || $i.username,
				}));
			}
		}
		miLocalStorage.setItem('lastUsed', Date.now().toString());

		const latestDonationInfoShownAt = miLocalStorage.getItem('latestDonationInfoShownAt');
		const neverShowDonationInfo = miLocalStorage.getItem('neverShowDonationInfo');
		if (neverShowDonationInfo !== 'true' && (new Date($i.createdAt).getTime() < (Date.now() - (1000 * 60 * 60 * 24 * 3))) && !location.pathname.startsWith('/miauth')) {
			if (latestDonationInfoShownAt == null || (new Date(latestDonationInfoShownAt).getTime() < (Date.now() - (1000 * 60 * 60 * 24 * 30)))) {
				popup(defineAsyncComponent(() => import('@/components/MkDonation.vue')), {}, {}, 'closed');
			}
		}

		if ('Notification' in window) {
			// 許可を得ていなかったらリクエスト
			if (Notification.permission === 'default') {
				Notification.requestPermission();
			}
		}

		const main = markRaw(stream.useChannel('main', null, 'System'));

		// 自分の情報が更新されたとき
		main.on('meUpdated', i => {
			updateAccount(i);
		});

		main.on('readAllNotifications', () => {
			updateAccount({ hasUnreadNotification: false });
		});

		main.on('unreadNotification', () => {
			updateAccount({ hasUnreadNotification: true });
		});

		main.on('unreadMention', () => {
			updateAccount({ hasUnreadMentions: true });
		});

		main.on('readAllUnreadMentions', () => {
			updateAccount({ hasUnreadMentions: false });
		});

		main.on('unreadSpecifiedNote', () => {
			updateAccount({ hasUnreadSpecifiedNotes: true });
		});

		main.on('readAllUnreadSpecifiedNotes', () => {
			updateAccount({ hasUnreadSpecifiedNotes: false });
		});

		main.on('readAllAntennas', () => {
			updateAccount({ hasUnreadAntenna: false });
		});

		main.on('unreadAntenna', () => {
			updateAccount({ hasUnreadAntenna: true });
			sound.play('antenna');
		});

		main.on('readAllAnnouncements', () => {
			updateAccount({ hasUnreadAnnouncement: false });
		});

		// トークンが再生成されたとき
		// このままではMisskeyが利用できないので強制的にサインアウトさせる
		main.on('myTokenRegenerated', () => {
			signout();
		});
	}

	// shortcut
	document.addEventListener('keydown', makeHotkey(hotkeys));

	initializeSw();
}
