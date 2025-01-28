/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// PIZZAX --- A lightweight store

import { onUnmounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { BroadcastChannel } from 'broadcast-channel';
import { $i } from '@/account.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { get, set } from '@/scripts/idb-proxy.js';
import { defaultStore } from '@/store.js';
import { useStream } from '@/stream.js';
import { deepClone } from '@/scripts/clone.js';
import { deepMerge } from '@/scripts/merge.js';

type StateDef = Record<string, {
	where: 'account' | 'device' | 'deviceAccount';
	default: any;
}>;

type State<T extends StateDef> = { [K in keyof T]: T[K]['default']; };
type ReactiveState<T extends StateDef> = { [K in keyof T]: Ref<T[K]['default']>; };

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

type PizzaxChannelMessage<T extends StateDef> = {
	where: 'device' | 'deviceAccount';
	key: keyof T;
	value: T[keyof T]['default'];
	userId?: string;
};

export class Storage<T extends StateDef> {
	public readonly ready: Promise<void>;
	public readonly loaded: Promise<void>;

	public readonly key: string;
	public readonly deviceStateKeyName: `pizzax::${this['key']}`;
	public readonly deviceAccountStateKeyName: `pizzax::${this['key']}::${string}` | '';
	public readonly registryCacheKeyName: `pizzax::${this['key']}::cache::${string}` | '';

	public readonly def: T;

	// TODO: これが実装されたらreadonlyにしたい: https://github.com/microsoft/TypeScript/issues/37487
	public readonly state: State<T>;
	public readonly reactiveState: ReactiveState<T>;

	private pizzaxChannel: BroadcastChannel<PizzaxChannelMessage<T>>;

	// 簡易的にキューイングして占有ロックとする
	private currentIdbJob: Promise<any> = Promise.resolve();
	private addIdbSetJob<T>(job: () => Promise<T>) {
		const promise = this.currentIdbJob.then(job, err => {
			console.error('Pizzax failed to save data to idb!', err);
			return job();
		});
		this.currentIdbJob = promise;
		return promise;
	}

	constructor(key: string, def: T) {
		this.key = key;
		this.deviceStateKeyName = `pizzax::${key}`;
		this.deviceAccountStateKeyName = $i ? `pizzax::${key}::${$i.id}` : '';
		this.registryCacheKeyName = $i ? `pizzax::${key}::cache::${$i.id}` : '';
		this.def = def;

		this.pizzaxChannel = new BroadcastChannel(`pizzax::${key}`);

		this.state = {} as State<T>;
		this.reactiveState = {} as ReactiveState<T>;

		for (const [k, v] of Object.entries(def) as [keyof T, T[keyof T]['default']][]) {
			this.state[k] = v.default;
			this.reactiveState[k] = ref(v.default);
		}

		this.ready = this.init();
		this.loaded = this.ready.then(() => this.load());
	}

	private isPureObject(value: unknown): value is Record<string | number | symbol, unknown> {
		return typeof value === 'object' && value !== null && !Array.isArray(value);
	}

	private mergeState<X>(value: X, def: X): X {
		if (this.isPureObject(value) && this.isPureObject(def)) {
			const merged = deepMerge(value, def);

			if (_DEV_) console.log('Merging state. Incoming: ', value, ' Default: ', def, ' Result: ', merged);

			return merged as X;
		}
		return value;
	}

	private async init(): Promise<void> {
		await this.migrate();

		const deviceState: State<T> = await get(this.deviceStateKeyName) || {};
		const deviceAccountState = $i ? await get(this.deviceAccountStateKeyName) || {} : {};
		const registryCache = $i ? await get(this.registryCacheKeyName) || {} : {};

		for (const [k, v] of Object.entries(this.def) as [keyof T, T[keyof T]['default']][]) {
			if (v.where === 'device' && Object.prototype.hasOwnProperty.call(deviceState, k)) {
				this.reactiveState[k].value = this.state[k] = this.mergeState<T[keyof T]['default']>(deviceState[k], v.default);
			} else if (v.where === 'account' && $i && Object.prototype.hasOwnProperty.call(registryCache, k)) {
				this.reactiveState[k].value = this.state[k] = this.mergeState<T[keyof T]['default']>(registryCache[k], v.default);
			} else if (v.where === 'deviceAccount' && Object.prototype.hasOwnProperty.call(deviceAccountState, k)) {
				this.reactiveState[k].value = this.state[k] = this.mergeState<T[keyof T]['default']>(deviceAccountState[k], v.default);
			} else {
				this.reactiveState[k].value = this.state[k] = v.default;
				if (_DEV_) console.log('Use default value', k, v.default);
			}
		}

		this.pizzaxChannel.addEventListener('message', ({ where, key, value, userId }) => {
			// アカウント変更すればunisonReloadが効くため、このreturnが発火することは
			// まずないと思うけど一応弾いておく
			if (where === 'deviceAccount' && !($i && userId !== $i.id)) return;
			this.reactiveState[key].value = this.state[key] = value;
		});

		if ($i) {
			const connection = useStream().useChannel('main');

			// streamingのuser storage updateイベントを監視して更新
			connection.on('registryUpdated', ({ scope, key, value }: { scope?: string[], key: keyof T, value: T[typeof key]['default'] }) => {
				if (!scope || scope.length !== 2 || scope[0] !== 'client' || scope[1] !== this.key || this.state[key] === value) return;

				this.reactiveState[key].value = this.state[key] = value;

				this.addIdbSetJob(async () => {
					const cache = await get(this.registryCacheKeyName);
					if (cache[key] !== value) {
						cache[key] = value;
						await set(this.registryCacheKeyName, cache);
					}
				});
			});
		}
	}

	private load(): Promise<void> {
		return new Promise((resolve, reject) => {
			if ($i) {
				// api関数と循環参照なので一応setTimeoutしておく
				window.setTimeout(async () => {
					await defaultStore.ready;

					misskeyApi('i/registry/get-all', { scope: ['client', this.key] })
						.then(kvs => {
							const cache: Partial<T> = {};
							for (const [k, v] of Object.entries(this.def) as [keyof T, T[keyof T]['default']][]) {
								if (v.where === 'account') {
									if (Object.prototype.hasOwnProperty.call(kvs, k)) {
										this.reactiveState[k].value = this.state[k] = (kvs as Partial<T>)[k];
										cache[k] = (kvs as Partial<T>)[k];
									} else {
										this.reactiveState[k].value = this.state[k] = v.default;
									}
								}
							}

							return set(this.registryCacheKeyName, cache);
						})
						.then(() => resolve());
				}, 1);
			} else {
				resolve();
			}
		});
	}

	public set<K extends keyof T>(key: K, value: T[K]['default']): Promise<void> {
		// IndexedDBやBroadcastChannelで扱うために単純なオブジェクトにする
		// (JSON.parse(JSON.stringify(value))の代わり)
		const rawValue = deepClone(value);

		if (_DEV_) console.log('set', key, rawValue, value);

		this.reactiveState[key].value = this.state[key] = rawValue;

		return this.addIdbSetJob(async () => {
			if (_DEV_) console.log(`set ${String(key)} start`);
			switch (this.def[key].where) {
				case 'device': {
					this.pizzaxChannel.postMessage({
						where: 'device',
						key,
						value: rawValue,
					});
					const deviceState = await get(this.deviceStateKeyName) || {};
					deviceState[key] = rawValue;
					await set(this.deviceStateKeyName, deviceState);
					break;
				}
				case 'deviceAccount': {
					if ($i == null) break;
					this.pizzaxChannel.postMessage({
						where: 'deviceAccount',
						key,
						value: rawValue,
						userId: $i.id,
					});
					const deviceAccountState = await get(this.deviceAccountStateKeyName) || {};
					deviceAccountState[key] = rawValue;
					await set(this.deviceAccountStateKeyName, deviceAccountState);
					break;
				}
				case 'account': {
					if ($i == null) break;
					const cache = await get(this.registryCacheKeyName) || {};
					cache[key] = rawValue;
					await set(this.registryCacheKeyName, cache);
					await misskeyApi('i/registry/set', {
						scope: ['client', this.key],
						key: key.toString(),
						value: rawValue,
					});
					break;
				}
			}
			if (_DEV_) console.log(`set ${String(key)} complete`);
		});
	}

	public push<K extends keyof T>(key: K, value: ArrayElement<T[K]['default']>): void {
		const currentState = this.state[key];
		this.set(key, [...currentState, value]);
	}

	public reset(key: keyof T) {
		this.set(key, this.def[key].default);
		return this.def[key].default;
	}

	/**
	 * 特定のキーの、簡易的なgetter/setterを作ります
	 * 主にvue上で設定コントロールのmodelとして使う用
	 */
	public makeGetterSetter<K extends keyof T, R = T[K]['default']>(
		key: K,
		getter?: (v: T[K]['default']) => R,
		setter?: (v: R) => T[K]['default'],
	): {
		get: () => R;
		set: (value: R) => void;
	} {
		const valueRef = ref(this.state[key]);

		const stop = watch(this.reactiveState[key], val => {
			valueRef.value = val;
		});

		// NOTE: vueコンポーネント内で呼ばれない限りは、onUnmounted は無意味なのでメモリリークする
		onUnmounted(() => {
			stop();
		});

		// TODO: VueのcustomRef使うと良い感じになるかも
		return {
			get: () => {
				if (getter) {
					return getter(valueRef.value);
				} else {
					return valueRef.value;
				}
			},
			set: (value) => {
				const val = setter ? setter(value) : value;
				this.set(key, val);
				valueRef.value = val;
			},
		};
	}

	// localStorage => indexedDBのマイグレーション
	private async migrate() {
		const deviceState = localStorage.getItem(this.deviceStateKeyName);
		if (deviceState) {
			await set(this.deviceStateKeyName, JSON.parse(deviceState));
			localStorage.removeItem(this.deviceStateKeyName);
		}

		const deviceAccountState = $i && localStorage.getItem(this.deviceAccountStateKeyName);
		if ($i && deviceAccountState) {
			await set(this.deviceAccountStateKeyName, JSON.parse(deviceAccountState));
			localStorage.removeItem(this.deviceAccountStateKeyName);
		}

		const registryCache = $i && localStorage.getItem(this.registryCacheKeyName);
		if ($i && registryCache) {
			await set(this.registryCacheKeyName, JSON.parse(registryCache));
			localStorage.removeItem(this.registryCacheKeyName);
		}
	}
}
