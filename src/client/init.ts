/**
 * Client entry point
 */

import '@client/style.scss';

//#region account indexedDB migration
import { set } from '@client/scripts/idb-proxy';

if (localStorage.getItem('accounts') != null) {
	set('accounts', JSON.parse(localStorage.getItem('accounts')));
	localStorage.removeItem('accounts');
}
//#endregion

import * as Sentry from '@sentry/browser';
import { Integrations } from '@sentry/tracing';
import { computed, createApp, watch, markRaw, version as vueVersion } from 'vue';
import compareVersions from 'compare-versions';

import widgets from '@client/widgets';
import directives from '@client/directives';
import components from '@client/components';
import { version, ui, lang, host } from '@client/config';
import { router } from '@client/router';
import { applyTheme } from '@client/scripts/theme';
import { isDeviceDarkmode } from '@client/scripts/is-device-darkmode';
import { i18n } from '@client/i18n';
import { stream, dialog, post, popup } from '@client/os';
import * as sound from '@client/scripts/sound';
import { $i, refreshAccount, login, updateAccount, signout } from '@client/account';
import { defaultStore, ColdDeviceStorage } from '@client/store';
import { fetchInstance, instance } from '@client/instance';
import { makeHotkey } from '@client/scripts/hotkey';
import { search } from '@client/scripts/search';
import { isMobile } from '@client/scripts/is-mobile';
import { initializeSw } from '@client/scripts/initialize-sw';
import { reloadChannel } from '@client/scripts/unison-reload';
import { reactionPicker } from '@client/scripts/reaction-picker';
import { deleteLoginId } from '@client/scripts/login-id';
import { getAccountFromId } from '@client/scripts/get-account-from-id';

console.info(`Misskey v${version}`);

// boot.jsのやつを解除
window.onerror = null;
window.onunhandledrejection = null;

if (_DEV_) {
	console.warn('Development mode!!!');

	console.info(`vue ${vueVersion}`);

	(window as any).$i = $i;
	(window as any).$store = defaultStore;

	window.addEventListener('error', event => {
		console.error(event);
		/*
		dialog({
			type: 'error',
			title: 'DEV: Unhandled error',
			text: event.message
		});
		*/
	});

	window.addEventListener('unhandledrejection', event => {
		console.error(event);
		/*
		dialog({
			type: 'error',
			title: 'DEV: Unhandled promise rejection',
			text: event.reason
		});
		*/
	});
}

if (defaultStore.state.reportError && !_DEV_) {
	Sentry.init({
		dsn: 'https://fd273254a07a4b61857607a9ea05d629@o501808.ingest.sentry.io/5583438',
		tracesSampleRate: 1.0,
	});

	Sentry.setTag('misskey_version', version);
	Sentry.setTag('ui', ui);
	Sentry.setTag('lang', lang);
	Sentry.setTag('host', host);
}

// タッチデバイスでCSSの:hoverを機能させる
document.addEventListener('touchend', () => {}, { passive: true });

// 一斉リロード
reloadChannel.addEventListener('message', path => {
	if (path === 'reload') location.reload();
	else location.href = path;
});

//#region SEE: https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
// TODO: いつの日にか消したい
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
	const vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
});
//#endregion

// If mobile, insert the viewport meta tag
if (isMobile || window.innerWidth <= 1024) {
	const viewport = document.getElementsByName('viewport').item(0);
	viewport.setAttribute('content',
		`${viewport.getAttribute('content')},minimum-scale=1,maximum-scale=1,user-scalable=no`);
	document.head.appendChild(viewport);
}

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', lang);
//#endregion

//#region loginId
const params = new URLSearchParams(location.search);
const loginId = params.get('loginId');

if (loginId) {
	const target = deleteLoginId(location.href);

	if (!$i || $i.id !== loginId) {
		const account = await getAccountFromId(loginId);
		if (account) {
			login(account.token, target);
		}
	}

	history.replaceState({ misskey: 'loginId' }, '', target);
}

//#endregion

//#region Fetch user
if ($i && $i.token) {
	if (_DEV_) {
		console.log('account cache found. refreshing...');
	}

	refreshAccount();
} else {
	if (_DEV_) {
		console.log('no account cache found.');
	}

	// 連携ログインの場合用にCookieを参照する
	const i = (document.cookie.match(/igi=(\w+)/) || [null, null])[1];

	if (i != null && i !== 'null') {
		if (_DEV_) {
			console.log('signing...');
		}

		try {
			document.body.innerHTML = '<div>Please wait...</div>';
			await login(i);
		} catch (e) {
			// Render the error screen
			// TODO: ちゃんとしたコンポーネントをレンダリングする(v10とかのトラブルシューティングゲーム付きのやつみたいな)
			document.body.innerHTML = '<div id="err">Oops!</div>';
		}
	} else {
		if (_DEV_) {
			console.log('not signed in');
		}
	}
}
//#endregion

fetchInstance().then(() => {
	localStorage.setItem('v', instance.version);

	// Init service worker
	initializeSw();
});

const app = createApp(await (
	window.location.search === '?zen' ? import('@client/ui/zen.vue') :
	!$i                               ? import('@client/ui/visitor.vue') :
	ui === 'deck'                     ? import('@client/ui/deck.vue') :
	ui === 'desktop'                  ? import('@client/ui/desktop.vue') :
	ui === 'chat'                     ? import('@client/ui/chat/index.vue') :
	ui === 'pope'                     ? import('@client/ui/universal.vue') :
	import('@client/ui/default.vue')
).then(x => x.default));

if (_DEV_) {
	app.config.performance = true;
}

app.config.globalProperties = {
	$i,
	$store: defaultStore,
	$instance: instance,
	$t: i18n.t,
	$ts: i18n.locale,
};

app.use(router);

widgets(app);
directives(app);
components(app);

await router.isReady();

const splash = document.getElementById('splash');
// 念のためnullチェック(HTMLが古い場合があるため(そのうち消す))
if (splash) splash.addEventListener('transitionend', () => {
	splash.remove();
});

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);
app.mount(rootEl);

reactionPicker.init();

if (splash) {
	splash.style.opacity = '0';
	splash.style.pointerEvents = 'none';
}

// クライアントが更新されたか？
const lastVersion = localStorage.getItem('lastVersion');
if (lastVersion !== version) {
	localStorage.setItem('lastVersion', version);

	// テーマリビルドするため
	localStorage.removeItem('theme');

	try { // 変なバージョン文字列来るとcompareVersionsでエラーになるため
		if (lastVersion != null && compareVersions(version, lastVersion) === 1) {
			// ログインしてる場合だけ
			if ($i) {
				popup(import('@client/components/updated.vue'), {}, {}, 'closed');
			}
		}
	} catch (e) {
	}
}

// NOTE: この処理は必ず↑のクライアント更新時処理より後に来ること(テーマ再構築のため)
watch(defaultStore.reactiveState.darkMode, (darkMode) => {
	applyTheme(darkMode ? ColdDeviceStorage.get('darkTheme') : ColdDeviceStorage.get('lightTheme'));
}, { immediate: localStorage.theme == null });

const darkTheme = computed(ColdDeviceStorage.makeGetterSetter('darkTheme'));
const lightTheme = computed(ColdDeviceStorage.makeGetterSetter('lightTheme'));

watch(darkTheme, (theme) => {
	if (defaultStore.state.darkMode) {
		applyTheme(theme);
	}
});

watch(lightTheme, (theme) => {
	if (!defaultStore.state.darkMode) {
		applyTheme(theme);
	}
});

//#region Sync dark mode
if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
	defaultStore.set('darkMode', isDeviceDarkmode());
}

window.matchMedia('(prefers-color-scheme: dark)').addListener(mql => {
	if (ColdDeviceStorage.get('syncDeviceDarkMode')) {
		defaultStore.set('darkMode', mql.matches);
	}
});
//#endregion

// shortcut
document.addEventListener('keydown', makeHotkey({
	'd': () => {
		defaultStore.set('darkMode', !defaultStore.state.darkMode);
	},
	'p|n': post,
	's': search,
	//TODO: 'h|/': help
}));

watch(defaultStore.reactiveState.useBlurEffectForModal, v => {
	document.documentElement.style.setProperty('--modalBgFilter', v ? 'blur(4px)' : 'none');
}, { immediate: true });

watch(defaultStore.reactiveState.useBlurEffect, v => {
	if (v) {
		document.documentElement.style.removeProperty('--blur');
	} else {
		document.documentElement.style.setProperty('--blur', 'none');
	}
}, { immediate: true });

let reloadDialogShowing = false;
stream.on('_disconnected_', async () => {
	if (defaultStore.state.serverDisconnectedBehavior === 'reload') {
		location.reload();
	} else if (defaultStore.state.serverDisconnectedBehavior === 'dialog') {
		if (reloadDialogShowing) return;
		reloadDialogShowing = true;
		const { canceled } = await dialog({
			type: 'warning',
			title: i18n.locale.disconnectedFromServer,
			text: i18n.locale.reloadConfirm,
			showCancelButton: true
		});
		reloadDialogShowing = false;
		if (!canceled) {
			location.reload();
		}
	}
});

stream.on('emojiAdded', data => {
	// TODO
	//store.commit('instance/set', );
});

for (const plugin of ColdDeviceStorage.get('plugins').filter(p => p.active)) {
	import('./plugin').then(({ install }) => {
		install(plugin);
	});
}

if ($i) {
	if ($i.isDeleted) {
		dialog({
			type: 'warning',
			text: i18n.locale.accountDeletionInProgress,
		});
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

	main.on('readAllMessagingMessages', () => {
		updateAccount({ hasUnreadMessagingMessage: false });
	});

	main.on('unreadMessagingMessage', () => {
		updateAccount({ hasUnreadMessagingMessage: true });
		sound.play('chatBg');
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

	main.on('readAllChannels', () => {
		updateAccount({ hasUnreadChannel: false });
	});

	main.on('unreadChannel', () => {
		updateAccount({ hasUnreadChannel: true });
		sound.play('channel');
	});

	// トークンが再生成されたとき
	// このままではMisskeyが利用できないので強制的にサインアウトさせる
	main.on('myTokenRegenerated', () => {
		signout();
	});
}
