/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

// ブロックの中に入れないと、定義した変数がブラウザのグローバルスコープに登録されてしまい邪魔なので
(async () => {
	window.onerror = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED', e);
	};
	window.onunhandledrejection = (e) => {
		console.error(e);
		renderError('SOMETHING_HAPPENED_IN_PROMISE', e);
	};

	let forceError = localStorage.getItem('forceError');
	if (forceError != null) {
		renderError('FORCED_ERROR', 'This error is forced by having forceError in local storage.');
		return;
	}

	//#region Detect language & fetch translations
	if (!localStorage.hasOwnProperty('locale')) {
		const supportedLangs = LANGS;
		let lang = localStorage.getItem('lang');
		if (lang == null || !supportedLangs.includes(lang)) {
			if (supportedLangs.includes(navigator.language)) {
				lang = navigator.language;
			} else {
				lang = supportedLangs.find(x => x.split('-')[0] === navigator.language);

				// Fallback
				if (lang == null) lang = 'en-US';
			}
		}

		const metaRes = await window.fetch('/api/meta', {
			method: 'POST',
			body: JSON.stringify({}),
			credentials: 'omit',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		if (metaRes.status !== 200) {
			renderError('META_FETCH');
			return;
		}
		const meta = await metaRes.json();
		const v = meta.version;
		if (v == null) {
			renderError('META_FETCH_V');
			return;
		}

		// for https://github.com/misskey-dev/misskey/issues/10202
		if (lang == null || lang.toString == null || lang.toString() === 'null') {
			console.error('invalid lang value detected!!!', typeof lang, lang);
			lang = 'en-US';
		}

		const localRes = await window.fetch(`/assets/locales/${lang}.${v}.json`);
		if (localRes.status === 200) {
			localStorage.setItem('lang', lang);
			localStorage.setItem('locale', await localRes.text());
			localStorage.setItem('localeVersion', v);
		} else {
			renderError('LOCALE_FETCH');
			return;
		}
	}
	//#endregion

	//#region Script
	async function importAppScript() {
		await import(`/vite/${CLIENT_ENTRY}`)
			.catch(async e => {
				console.error(e);
				renderError('APP_IMPORT', e);
			});
	}

	// タイミングによっては、この時点でDOMの構築が済んでいる場合とそうでない場合とがある
	if (document.readyState !== 'loading') {
		importAppScript();
	} else {
		window.addEventListener('DOMContentLoaded', () => {
			importAppScript();
		});
	}
	//#endregion

	//#region Theme
	const theme = localStorage.getItem('theme');
	if (theme) {
		for (const [k, v] of Object.entries(JSON.parse(theme))) {
			document.documentElement.style.setProperty(`--MI_THEME-${k}`, v.toString());

			// HTMLの theme-color 適用
			if (k === 'htmlThemeColor') {
				for (const tag of document.head.children) {
					if (tag.tagName === 'META' && tag.getAttribute('name') === 'theme-color') {
						tag.setAttribute('content', v);
						break;
					}
				}
			}
		}
	}
	const colorScheme = localStorage.getItem('colorScheme');
	if (colorScheme) {
		document.documentElement.style.setProperty('color-scheme', colorScheme);
	}
	//#endregion

	const fontSize = localStorage.getItem('fontSize');
	if (fontSize) {
		document.documentElement.classList.add('f-' + fontSize);
	}

	const useSystemFont = localStorage.getItem('useSystemFont');
	if (useSystemFont) {
		document.documentElement.classList.add('useSystemFont');
	}

	const wallpaper = localStorage.getItem('wallpaper');
	if (wallpaper) {
		document.documentElement.style.backgroundImage = `url(${wallpaper})`;
	}

	const customCss = localStorage.getItem('customCss');
	if (customCss && customCss.length > 0) {
		const style = document.createElement('style');
		style.innerHTML = customCss;
		document.head.appendChild(style);
	}

	async function addStyle(styleText) {
		let css = document.createElement('style');
		css.appendChild(document.createTextNode(styleText));
		document.head.appendChild(css);
	}

	async function renderError(code, details) {
		// Cannot set property 'innerHTML' of null を回避
		if (document.readyState === 'loading') {
			await new Promise(resolve => window.addEventListener('DOMContentLoaded', resolve));
		}

		let errorsElement = document.getElementById('errors');

		if (!errorsElement) {
			document.body.innerHTML = `
			<svg class="icon-warning" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
				<path d="M12 9v2m0 4v.01"></path>
				<path d="M5 19h14a2 2 0 0 0 1.84 -2.75l-7.1 -12.25a2 2 0 0 0 -3.5 0l-7.1 12.25a2 2 0 0 0 1.75 2.75"></path>
			</svg>
			<h1>Failed to load<br>読み込みに失敗しました</h1>
			<button class="button-big" onclick="location.reload(true);">
				<span class="button-label-big">Reload / リロード</span>
			</button>
			<p><b>The following actions may solve the problem. / 以下を行うと解決する可能性があります。</b></p>
			<p>Update your os and browser / ブラウザおよびOSを最新バージョンに更新する</p>
			<p>Disable an adblocker / アドブロッカーを無効にする</p>
			<p>Clear the browser cache / ブラウザのキャッシュをクリアする</p>
			<p>&#40;Tor Browser&#41; Set dom.webaudio.enabled to true / dom.webaudio.enabledをtrueに設定する</p>
			<details style="color: #86b300;">
				<summary>Other options / その他のオプション</summary>
				<a href="/flush">
					<button class="button-small">
						<span class="button-label-small">Clear preferences and cache</span>
					</button>
				</a>
				<br>
				<a href="/cli">
					<button class="button-small">
						<span class="button-label-small">Start the simple client</span>
					</button>
				</a>
				<br>
				<a href="/bios">
					<button class="button-small">
						<span class="button-label-small">Start the repair tool</span>
					</button>
				</a>
			</details>
			<br>
			<div id="errors"></div>
			`;
			errorsElement = document.getElementById('errors');
		}
		const detailsElement = document.createElement('details');
		detailsElement.id = 'errorInfo';
		detailsElement.innerHTML = `
		<br>
		<summary>
			<code>ERROR CODE: ${code}</code>
		</summary>
		<code>${details.toString()} ${JSON.stringify(details)}</code>`;
		errorsElement.appendChild(detailsElement);
		addStyle(`
		* {
			font-family: Segoe UI, HelveticaNeue, BIZ UDGothic, Roboto, Arial, sans-serif;
		}

		#misskey_app,
		#splash {
			display: none !important;
		}

		body,
		html {
			background-color: #222;
			color: #dfddcc;
			justify-content: center;
			margin: auto;
			padding: 10px;
			text-align: center;
		}

		button {
			border-radius: 999px;
			padding: 0px 12px 0px 12px;
			border: none;
			cursor: pointer;
			margin-bottom: 12px;
		}

		.button-big {
			background: linear-gradient(90deg, rgb(134, 179, 0), rgb(74, 179, 0));
			line-height: 50px;
		}

		.button-big:hover {
			background: rgb(153, 204, 0);
		}

		.button-small {
			background: #444;
			line-height: 40px;
		}

		.button-small:hover {
			background: #555;
		}

		.button-label-big {
			color: #222;
			font-weight: bold;
			font-size: 1.2em;
			padding: 12px;
		}

		.button-label-small {
			color: rgb(153, 204, 0);
			font-size: 16px;
			padding: 12px;
		}

		a {
			color: rgb(134, 179, 0);
			text-decoration: none;
		}

		p,
		li {
			font-size: 16px;
		}

		.icon-warning {
			color: #dec340;
			height: 4rem;
			padding-top: 2rem;
		}

		h1 {
			font-size: 1.5em;
			margin: 1em;
		}

		code {
			font-family: Fira, FiraCode, monospace;
		}

		#errorInfo {
			background: #333;
			margin-bottom: 2rem;
			padding: 0.5rem 1rem;
			width: 40rem;
			border-radius: 10px;
			justify-content: center;
			margin: auto;
		}

		#errorInfo summary {
			cursor: pointer;
		}

		#errorInfo summary > * {
			display: inline;
		}

		@media screen and (max-width: 500px) {
			#errorInfo {
				width: 50%;
			}
		}`);
	}
})();
