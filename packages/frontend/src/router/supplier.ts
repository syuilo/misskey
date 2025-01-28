/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { inject } from 'vue';
import { Router } from '@/nirax.js';
import type { IRouter } from '@/nirax.js';
import { mainRouter } from '@/router/main.js';

/**
 * メインの{@link Router}を取得する。
 * あらかじめ{@link setupRouter}を実行しておく必要がある（{@link provide}により{@link IRouter}のインスタンスを注入可能であるならばこの限りではない）
 */
export function useRouter(): IRouter {
	return inject<Router | null>('router', null) ?? mainRouter;
}

/**
 * 任意の{@link Router}を取得するためのファクトリを取得する。
 * あらかじめ{@link setupRouter}を実行しておく必要がある。
 */
export function useRouterFactory(): (path: string) => IRouter {
	const factory = inject<(path: string) => IRouter>('routerFactory');
	if (!factory) {
		console.error('routerFactory is not defined.');
		throw new Error('routerFactory is not defined.');
	}

	return factory;
}
