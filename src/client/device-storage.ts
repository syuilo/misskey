import { ref } from 'vue';

const PREFIX = 'miux:';

/**
 * 常にメモリにロードしておく必要がないような設定情報を保管するストレージ
 */
export class ColdDeviceStorage {
	public static default = {
		sound_masterVolume: 0.3,
		sound_note: { type: 'syuilo/down', volume: 1 },
		sound_noteMy: { type: 'syuilo/up', volume: 1 },
		sound_notification: { type: 'syuilo/pope2', volume: 1 },
		sound_chat: { type: 'syuilo/pope1', volume: 1 },
		sound_chatBg: { type: 'syuilo/waon', volume: 1 },
		sound_antenna: { type: 'syuilo/triple', volume: 1 },
		sound_channel: { type: 'syuilo/square-pico', volume: 1 },
		sound_reversiPutBlack: { type: 'syuilo/kick', volume: 0.3 },
		sound_reversiPutWhite: { type: 'syuilo/snare', volume: 0.3 },
	};

	public static get<T extends keyof typeof ColdDeviceStorage.default>(key: T): typeof ColdDeviceStorage.default[T] {
		// TODO: indexedDBにする
		//       ただしその際はnullチェックではなくキー存在チェックにしないとダメ
		//       (indexedDBはnullを保存できるため、ユーザーが意図してnullを格納した可能性がある)
		const value = localStorage.getItem(PREFIX + key);
		if (value == null) {
			return ColdDeviceStorage.default[key];
		} else {
			return JSON.parse(value);
		}
	}

	public static set(key: keyof typeof ColdDeviceStorage.default, value: any): any {
		localStorage.setItem(PREFIX + key, JSON.stringify(value));
	}
}

/**
 * 頻繁にアクセスされる設定情報を保管するストレージ
 */
class HotDeviceStorage {
	public static default = {
		animation: true,
	};

	public readonly state = { ...HotDeviceStorage.default };

	constructor() {
		for (const key of Object.keys(HotDeviceStorage.default)) {
			// TODO: indexedDBにする
			//       ただしその際はnullチェックではなくキー存在チェックにしないとダメ
			//       (indexedDBはnullを保存できるため、ユーザーが意図してnullを格納した可能性がある)
			const value = localStorage.getItem(PREFIX + key);
			if (value != null) {
				this.state[key] = JSON.parse(value);
			}
		}
	}

	set(key: keyof typeof HotDeviceStorage.default, value: any): any {
		localStorage.setItem(PREFIX + key, JSON.stringify(value));
		this.state[key] = value;
	}

	/**
	 * 特定のキーの、簡易的なgetter/setterを作ります
	 * 主にvue場で設定コントロールのmodelとして使う用
	 */
	makeGetterSetter(key: keyof typeof HotDeviceStorage.default) {
		const valueRef = ref(this.state[key]);
		return {
			get: () => { return valueRef.value; },
			set: (value) => {
				this.set(key, value);
				valueRef.value = value;
			}
		};
	}
}

export const hotDeviceStorage = new HotDeviceStorage();
