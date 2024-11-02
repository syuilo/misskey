/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import { IRouter, Resolved, RouteDef, RouterEvent, RouterFlag } from '@/nirax.js';

import type { App, ShallowRef } from 'vue';

/**
 * {@link Router}による画面遷移を可能とするために{@link mainRouter}をセットアップする。
 * また、{@link Router}のインスタンスを作成するためのファクトリも{@link provide}経由で公開する（`routerFactory`というキーで取得可能）
 */
export function setupRouter(app: App, routerFactory: ((path: string) => IRouter)): void {
	app.provide('routerFactory', routerFactory);

	const mainRouter = routerFactory(location.pathname + location.search + location.hash);

	window.addEventListener('popstate', (event) => {
		mainRouter.replace(location.pathname + location.search + location.hash, event.state?.key);
	});

	mainRouter.addListener('push', ctx => {
		window.history.pushState({ key: ctx.key }, '', ctx.path);
	});

	mainRouter.addListener('replace', ctx => {
		window.history.replaceState({ key: ctx.key }, '', ctx.path);
	});

	mainRouter.init();

	setMainRouter(mainRouter);
}

function getMainRouter(): IRouter {
	const router = mainRouterHolder;
	if (!router) {
		throw new Error('mainRouter is not found.');
	}

	return router;
}

/**
 * メインルータを設定する。一度設定すると、それ以降は変更できない。
 * {@link setupRouter}から呼び出されることのみを想定している。
 */
export function setMainRouter(router: IRouter) {
	if (mainRouterHolder) {
		throw new Error('mainRouter is already exists.');
	}

	mainRouterHolder = router;
}

/**
 * {@link mainRouter}用のプロキシ実装。
 * {@link mainRouter}は起動シーケンスの一部にて初期化されるため、僅かにundefinedになる期間がある。
 * その僅かな期間のためだけに型をundefined込みにしたくないのでこのクラスを緩衝材として使用する。
 */
class MainRouterProxy implements IRouter {
	private supplier: () => IRouter;

	constructor(supplier: () => IRouter) {
		this.supplier = supplier;
	}

	get current(): Resolved {
		return this.supplier().current;
	}

	get currentRef(): ShallowRef<Resolved> {
		return this.supplier().currentRef;
	}

	get currentRoute(): ShallowRef<RouteDef> {
		return this.supplier().currentRoute;
	}

	get navHook(): ((path: string, flag?: RouterFlag) => boolean) | null {
		return this.supplier().navHook;
	}

	set navHook(value) {
		this.supplier().navHook = value;
	}

	getCurrentKey(): string {
		return this.supplier().getCurrentKey();
	}

	getCurrentPath(): string {
		return this.supplier().getCurrentPath();
	}

	push(path: string, flag?: RouterFlag): void {
		this.supplier().push(path, flag);
	}

	replace(path: string, key?: string | null): void {
		this.supplier().replace(path, key);
	}

	resolve(path: string): Resolved | null {
		return this.supplier().resolve(path);
	}

	init(): void {
		this.supplier().init();
	}

	eventNames(): Array<EventEmitter.EventNames<RouterEvent>> {
		return this.supplier().eventNames();
	}

	listeners<T extends EventEmitter.EventNames<RouterEvent>>(
		event: T,
	): Array<EventEmitter.EventListener<RouterEvent, T>> {
		return this.supplier().listeners(event);
	}

	listenerCount(
		event: EventEmitter.EventNames<RouterEvent>,
	): number {
		return this.supplier().listenerCount(event);
	}

	emit<T extends EventEmitter.EventNames<RouterEvent>>(
		event: T,
		...args: EventEmitter.EventArgs<RouterEvent, T>
	): boolean {
		return this.supplier().emit(event, ...args);
	}

	on<T extends EventEmitter.EventNames<RouterEvent>>(
		event: T,
		fn: EventEmitter.EventListener<RouterEvent, T>,
		context?: any,
	): this {
		this.supplier().on(event, fn, context);
		return this;
	}

	addListener<T extends EventEmitter.EventNames<RouterEvent>>(
		event: T,
		fn: EventEmitter.EventListener<RouterEvent, T>,
		context?: any,
	): this {
		this.supplier().addListener(event, fn, context);
		return this;
	}

	once<T extends EventEmitter.EventNames<RouterEvent>>(
		event: T,
		fn: EventEmitter.EventListener<RouterEvent, T>,
		context?: any,
	): this {
		this.supplier().once(event, fn, context);
		return this;
	}

	removeListener<T extends EventEmitter.EventNames<RouterEvent>>(
		event: T,
		fn?: EventEmitter.EventListener<RouterEvent, T>,
		context?: any,
		once?: boolean,
	): this {
		this.supplier().removeListener(event, fn, context, once);
		return this;
	}

	off<T extends EventEmitter.EventNames<RouterEvent>>(
		event: T,
		fn?: EventEmitter.EventListener<RouterEvent, T>,
		context?: any,
		once?: boolean,
	): this {
		this.supplier().off(event, fn, context, once);
		return this;
	}

	removeAllListeners(
		event?: EventEmitter.EventNames<RouterEvent>,
	): this {
		this.supplier().removeAllListeners(event);
		return this;
	}
}

let mainRouterHolder: IRouter | null = null;

export const mainRouter: IRouter = new MainRouterProxy(getMainRouter);
