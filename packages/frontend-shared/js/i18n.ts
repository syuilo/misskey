/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ILocale, ParameterizedString } from '../../../locales/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TODO = any;

type FlattenKeys<T extends ILocale, TPrediction> = keyof {
	[K in keyof T as T[K] extends ILocale
		? FlattenKeys<T[K], TPrediction> extends infer C extends string
			? `${K & string}.${C}`
			: never
		: T[K] extends TPrediction
			? K
			: never]: T[K];
};

type ParametersOf<T extends ILocale, TKey extends FlattenKeys<T, ParameterizedString>> = TKey extends `${infer K}.${infer C}`
	// @ts-expect-error -- C は明らかに FlattenKeys<T[K], ParameterizedString> になるが、型システムはここでは TKey がドット区切りであることのコンテキストを持たないので、型システムに合法にて示すことはできない。
	? ParametersOf<T[K], C>
	: TKey extends keyof T
		? T[TKey] extends ParameterizedString<infer P>
			? P
			: never
		: never;

type Tsx<T extends ILocale> = {
	readonly [K in keyof T as T[K] extends string ? never : K]: T[K] extends ParameterizedString<infer P>
		? (arg: { readonly [_ in P]: string | number }) => string
		// @ts-expect-error -- 証明省略
		: Tsx<T[K]>;
};

export class I18n<T extends ILocale> {
	private tsxCache?: Tsx<T>;
	private devMode: boolean;

	constructor(public locale: T, devMode = false) {
		this.devMode = devMode;

		//#region BIND
		this.t = this.t.bind(this);
		//#endregion
	}

	public get ts(): T {
		if (this.devMode) {
			class Handler<TTarget extends ILocale> implements ProxyHandler<TTarget> {
				get(target: TTarget, p: string | symbol): unknown {
					const value = target[p as keyof TTarget];

					if (typeof value === 'object') {
						return new Proxy(value, new Handler<TTarget[keyof TTarget] & ILocale>());
					}

					if (typeof value === 'string') {
						const parameters = Array.from(value.matchAll(/\{(\w+)\}/g), ([, parameter]) => parameter);

						if (parameters.length) {
							console.error(`Missing locale parameters: ${parameters.join(', ')} at ${String(p)}`);
						}

						return value;
					}

					console.error(`Unexpected locale key: ${String(p)}`);

					return p;
				}
			}

			return new Proxy(this.locale, new Handler());
		}

		return this.locale;
	}

	public get tsx(): Tsx<T> {
		if (this.devMode) {
			if (this.tsxCache) {
				return this.tsxCache;
			}

			class Handler<TTarget extends ILocale> implements ProxyHandler<TTarget> {
				get(target: TTarget, p: string | symbol): unknown {
					const value = target[p as keyof TTarget];

					if (typeof value === 'object') {
						return new Proxy(value, new Handler<TTarget[keyof TTarget] & ILocale>());
					}

					if (typeof value === 'string') {
						const quasis: string[] = [];
						const expressions: string[] = [];
						let cursor = 0;

						while (~cursor) {
							const start = value.indexOf('{', cursor);

							if (!~start) {
								quasis.push(value.slice(cursor));
								break;
							}

							quasis.push(value.slice(cursor, start));

							const end = value.indexOf('}', start);

							expressions.push(value.slice(start + 1, end));

							cursor = end + 1;
						}

						if (!expressions.length) {
							console.error(`Unexpected locale key: ${String(p)}`);

							return () => value;
						}

						return (arg: TODO) => {
							let str = quasis[0];

							for (let i = 0; i < expressions.length; i++) {
								if (!Object.hasOwn(arg, expressions[i])) {
									console.error(`Missing locale parameters: ${expressions[i]} at ${String(p)}`);
								}

								str += arg[expressions[i]] + quasis[i + 1];
							}

							return str;
						};
					}

					console.error(`Unexpected locale key: ${String(p)}`);

					return p;
				}
			}

			return this.tsxCache = new Proxy(this.locale, new Handler()) as unknown as Tsx<T>;
		}

		if (this.tsxCache) {
			return this.tsxCache;
		}

		function build(target: ILocale): Tsx<T> {
			const result = {} as Tsx<T>;

			for (const k in target) {
				if (!Object.hasOwn(target, k)) {
					continue;
				}

				const value = target[k as keyof typeof target];

				if (typeof value === 'object') {
					(result as TODO)[k] = build(value as ILocale);
				} else if (typeof value === 'string') {
					const quasis: string[] = [];
					const expressions: string[] = [];
					let cursor = 0;

					while (~cursor) {
						const start = value.indexOf('{', cursor);

						if (!~start) {
							quasis.push(value.slice(cursor));
							break;
						}

						quasis.push(value.slice(cursor, start));

						const end = value.indexOf('}', start);

						expressions.push(value.slice(start + 1, end));

						cursor = end + 1;
					}

					if (!expressions.length) {
						continue;
					}

					(result as TODO)[k] = (arg: TODO) => {
						let str = quasis[0];

						for (let i = 0; i < expressions.length; i++) {
							str += arg[expressions[i]] + quasis[i + 1];
						}

						return str;
					};
				}
			}
			return result;
		}

		return this.tsxCache = build(this.locale);
	}

	/**
	 * @deprecated なるべくこのメソッド使うよりも ts 直接参照の方が vue のキャッシュ効いてパフォーマンスが良いかも
	 */
	public t<TKey extends FlattenKeys<T, string>>(key: TKey): string;
	/**
	 * @deprecated なるべくこのメソッド使うよりも tsx 直接参照の方が vue のキャッシュ効いてパフォーマンスが良いかも
	 */
	public t<TKey extends FlattenKeys<T, ParameterizedString>>(key: TKey, args: { readonly [_ in ParametersOf<T, TKey>]: string | number }): string;
	public t(key: string, args?: { readonly [_: string]: string | number }) {
		let str: string | ParameterizedString | ILocale = this.locale;

		for (const k of key.split('.')) {
			str = (str as TODO)[k];

			if (this.devMode) {
				if (typeof str === 'undefined') {
					console.error(`Unexpected locale key: ${key}`);
					return key;
				}
			}
		}

		if (args) {
			if (this.devMode) {
				const missing = Array.from((str as string).matchAll(/\{(\w+)\}/g), ([, parameter]) => parameter).filter(parameter => !Object.hasOwn(args, parameter));

				if (missing.length) {
					console.error(`Missing locale parameters: ${missing.join(', ')} at ${key}`);
				}
			}

			for (const [k, v] of Object.entries(args)) {
				const search = `{${k}}`;

				if (this.devMode) {
					if (!(str as string).includes(search)) {
						console.error(`Unexpected locale parameter: ${k} at ${key}`);
					}
				}

				str = (str as string).replace(search, v.toString());
			}
		}

		return str;
	}
}
