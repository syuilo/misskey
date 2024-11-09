/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FORCE_RE_RENDER, FORCE_REMOUNT } from '@storybook/core-events';
import { addons } from '@storybook/preview-api';
import { type Preview, setup } from '@storybook/vue3';
import isChromatic from 'chromatic/isChromatic';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { userDetailed } from './fakes.js';
import locale from './locale.js';
import { commonHandlers, onUnhandledRequest } from './mocks.js';
import themes from './themes.js';
import '../src/style.scss';

const appInitialized = Symbol();

let lastStory: string | null = null;
let moduleInitialized = false;
let unobserve = () => {};
let misskeyOS = null;

function loadTheme(applyTheme: typeof import('../src/scripts/theme')['applyTheme']) {
	unobserve();
	const theme = themes[document.documentElement.dataset.misskeyTheme];
	if (theme) {
		applyTheme(themes[document.documentElement.dataset.misskeyTheme]);
	} else {
		applyTheme(themes['l-light']);
	}
	const observer = new MutationObserver((entries) => {
		for (const entry of entries) {
			if (entry.attributeName === 'data-misskey-theme') {
				const target = entry.target as HTMLElement;
				const theme = themes[target.dataset.misskeyTheme];
				if (theme) {
					applyTheme(themes[target.dataset.misskeyTheme]);
				} else {
					target.removeAttribute('style');
				}
			}
		}
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-misskey-theme'],
	});
	unobserve = () => observer.disconnect();
}

function initLocalStorage() {
	localStorage.clear();
	localStorage.setItem('account', JSON.stringify({
		...userDetailed(),
		policies: {},
	}));
	localStorage.setItem('locale', JSON.stringify(locale));
}

initialize({
	onUnhandledRequest,
});
initLocalStorage();
queueMicrotask(() => {
	Promise.all([
		import('../src/directives/index.js'),
		import('../src/components/index.js'),
		import('../src/widgets/index.js'),
		import('../src/scripts/theme.js'),
		import('../src/store.js'),
		import('../src/os.js'),
	]).then(([{ default: directives }, { default: components }, { default: widgets }, { applyTheme }, { defaultStore }, os]) => {
		setup((app) => {
			moduleInitialized = true;
			if (app[appInitialized]) {
				return;
			}
			app[appInitialized] = true;
			loadTheme(applyTheme);
			directives(app);
			components(app);
			widgets(app);
			misskeyOS = os;
			if (isChromatic()) {
				defaultStore.set('animation', false);
			}
		});
	});
});

const preview = {
	decorators: [
		(Story, context) => {
			if (lastStory === context.id) {
				lastStory = null;
			} else {
				lastStory = context.id;
				const channel = addons.getChannel();
				const resetIndexedDBPromise = globalThis.indexedDB?.databases
					? indexedDB.databases().then((r) => {
							for (var i = 0; i < r.length; i++) {
								indexedDB.deleteDatabase(r[i].name!);
							}
						}).catch(() => {})
					: Promise.resolve();
				const resetDefaultStorePromise = import('../src/store').then(({ defaultStore }) => {
					// @ts-expect-error
					defaultStore.init();
				}).catch(() => {});
				Promise.all([resetIndexedDBPromise, resetDefaultStorePromise]).then(() => {
					initLocalStorage();
					channel.emit(FORCE_RE_RENDER, { storyId: context.id });
				});
			}
			const story = Story();
			if (!moduleInitialized) {
				const channel = addons.getChannel();
				(globalThis.requestIdleCallback || setTimeout)(() => {
					channel.emit(FORCE_REMOUNT, { storyId: context.id });
				});
			}
			return story;
		},
		(Story, context) => {
			return {
				setup() {
					return {
						context,
						popups: misskeyOS.popups,
					};
				},
				template:
					'<component :is="popup.component" v-for="popup in popups" :key="popup.id" v-bind="popup.props" v-on="popup.events"/>' +
					'<story />',
			};
		},
	],
	loaders: [mswLoader],
	parameters: {
		controls: {
			exclude: /^__/,
		},
		msw: {
			handlers: commonHandlers,
		},
	},
} satisfies Preview;

export default preview;
