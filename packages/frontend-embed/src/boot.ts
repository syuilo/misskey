/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// https://vitejs.dev/config/build-options.html#build-modulepreload
import 'vite/modulepreload-polyfill';

import '@tabler/icons-webfont/dist/tabler-icons.scss';

import '@/style.scss';
import { createApp, defineAsyncComponent } from 'vue';
import defaultLightTheme from '@@/themes/l-light.json5';
import defaultDarkTheme from '@@/themes/d-dark.json5';
import { MediaProxy } from '@@/js/media-proxy.js';
import { applyTheme, assertIsTheme } from '@/theme.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';
import { DI } from '@/di.js';
import { serverMetadata } from '@/server-metadata.js';
import { url } from '@@/js/config.js';
import { parseEmbedParams } from '@@/js/embed-page.js';
import { postMessageToParentWindow, setIframeId } from '@/post-message.js';
import { serverContext } from '@/server-context.js';
import { i18n } from '@/i18n.js';

import type { Theme } from '@/theme.js';

console.log('Misskey Embed');

//#region Embedパラメータの取得・パース
const params = new URLSearchParams(location.search);
const embedParams = parseEmbedParams(params);
if (_DEV_) console.log(embedParams);
//#endregion

//#region テーマ
function parseThemeOrNull(theme: string | null): Theme | null {
	if (theme == null) return null;
	try {
		const parsed = JSON.parse(theme);
		if (assertIsTheme(parsed)) {
			return parsed;
		} else {
			return null;
		}
	} catch (err) {
		return null;
	}
}

const lightTheme = parseThemeOrNull(serverMetadata.defaultLightTheme) ?? defaultLightTheme;
const darkTheme = parseThemeOrNull(serverMetadata.defaultDarkTheme) ?? defaultDarkTheme;

if (embedParams.colorMode === 'dark') {
	applyTheme(darkTheme);
} else if (embedParams.colorMode === 'light') {
	applyTheme(lightTheme);
} else {
	if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		applyTheme(darkTheme);
	} else {
		applyTheme(lightTheme);
	}
	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mql) => {
		if (mql.matches) {
			applyTheme(darkTheme);
		} else {
			applyTheme(lightTheme);
		}
	});
}
//#endregion

// サイズの制限
document.documentElement.style.maxWidth = '500px';

// iframeIdの設定
function setIframeIdHandler(event: MessageEvent) {
	if (event.data?.type === 'misskey:embedParent:registerIframeId' && event.data.payload?.iframeId != null) {
		setIframeId(event.data.payload.iframeId);
		window.removeEventListener('message', setIframeIdHandler);
	}
}

window.addEventListener('message', setIframeIdHandler);

try {
	await fetchCustomEmojis();
} catch (err) { /* empty */ }

const app = createApp(
	defineAsyncComponent(() => import('@/ui.vue')),
);

app.provide(DI.mediaProxy, new MediaProxy(serverMetadata, url));

app.provide(DI.serverMetadata, serverMetadata);

app.provide(DI.serverContext, serverContext);

app.provide(DI.embedParams, embedParams);

// https://github.com/misskey-dev/misskey/pull/8575#issuecomment-1114239210
// なぜか2回実行されることがあるため、mountするdivを1つに制限する
const rootEl = ((): HTMLElement => {
	const MISSKEY_MOUNT_DIV_ID = 'misskey_app';

	const currentRoot = document.getElementById(MISSKEY_MOUNT_DIV_ID);

	if (currentRoot) {
		console.warn('multiple import detected');
		return currentRoot;
	}

	const root = document.createElement('div');
	root.id = MISSKEY_MOUNT_DIV_ID;
	document.body.appendChild(root);
	return root;
})();

postMessageToParentWindow('misskey:embed:ready');

app.mount(rootEl);

// boot.jsのやつを解除
window.onerror = null;
window.onunhandledrejection = null;

removeSplash();

//#region Self-XSS 対策メッセージ
console.log(
	`%c${i18n.ts._selfXssPrevention.warning}`,
	'color: #f00; background-color: #ff0; font-size: 36px; padding: 4px;',
);
console.log(
	`%c${i18n.ts._selfXssPrevention.title}`,
	'color: #f00; font-weight: 900; font-family: "Hiragino Sans W9", "Hiragino Kaku Gothic ProN", sans-serif; font-size: 24px;',
);
console.log(
	`%c${i18n.ts._selfXssPrevention.description1}`,
	'font-size: 16px; font-weight: 700;',
);
console.log(
	`%c${i18n.ts._selfXssPrevention.description2}`,
	'font-size: 16px;',
	'font-size: 20px; font-weight: 700; color: #f00;',
);
console.log(i18n.tsx._selfXssPrevention.description3({ link: 'https://misskey-hub.net/docs/for-users/resources/self-xss/' }));
//#endregion

function removeSplash() {
	const splash = document.getElementById('splash');
	if (splash) {
		splash.style.opacity = '0';
		splash.style.pointerEvents = 'none';

		// transitionendイベントが発火しない場合があるため
		window.setTimeout(() => {
			splash.remove();
		}, 1000);
	}
}
