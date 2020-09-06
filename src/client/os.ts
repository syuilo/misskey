import { Component, defineAsyncComponent } from 'vue';
import Stream from '@/scripts/stream';
import { store } from '@/store';
import { apiUrl } from '@/config';

const ua = navigator.userAgent.toLowerCase();
export const isMobile = /mobile|iphone|ipad|android/.test(ua);

export const stream = new Stream();

export function api(endpoint: string, data: Record<string, any> = {}, token?: string | null | undefined) {
	store.commit('beginApiRequest');

	const onFinally = () => {
		store.commit('endApiRequest');
	};

	const promise = new Promise((resolve, reject) => {
		// Append a credential
		if (store.getters.isSignedIn) (data as any).i = store.state.i.token;
		if (token !== undefined) (data as any).i = token;

		// Send request
		fetch(endpoint.indexOf('://') > -1 ? endpoint : `${apiUrl}/${endpoint}`, {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'omit',
			cache: 'no-cache'
		}).then(async (res) => {
			const body = res.status === 204 ? null : await res.json();

			if (res.status === 200) {
				resolve(body);
			} else if (res.status === 204) {
				resolve();
			} else {
				reject(body.error);
			}
		}).catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
}

export function popup(component: Component, props: Record<string, any>, eventHandler?: Function, closedCallback?: Function) {
	const id = Math.random().toString(); // TODO: uuidとか使う
	const destroy = () => {
		store.commit('removePopup', id);
		if (closedCallback) closedCallback();
	};
	const popup = {
		component,
		props: {
			...props,
			destroy,
			emit: (...args) => {
				if (eventHandler) eventHandler(...args);
			}
		},
		id,
	};
	store.commit('addPopup', popup);
	return destroy;
}

export function dialog(props: Record<string, any>) {
	return new Promise((res, rej) => {
		popup(defineAsyncComponent(() => import('@/components/dialog.vue')), props, res);
	});
}

export function menu(props: Record<string, any>) {
	return new Promise((res, rej) => {
		return popup(defineAsyncComponent(() => import('@/components/menu.vue')), props, res);
	});
}

export function sound(type: string) {
	if (store.state.device.sfxVolume === 0) return;
	const sound = store.state.device['sfx' + type.substr(0, 1).toUpperCase() + type.substr(1)];
	if (sound == null) return;
	const audio = new Audio(`/assets/sounds/${sound}.mp3`);
	audio.volume = store.state.device.sfxVolume;
	audio.play();
}
