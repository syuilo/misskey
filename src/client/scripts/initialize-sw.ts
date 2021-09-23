import { instance } from '@client/instance';
import { $i } from '@client/account';
import { api } from '@client/os';
import { lang } from '@client/config';

export async function initializeSw() {
	if (instance.swPublickey &&
		('serviceWorker' in navigator) &&
		('PushManager' in window) &&
		$i && $i.token) {
		navigator.serviceWorker.register(`/sw.js`);

		navigator.serviceWorker.ready.then(registration => {
			registration.active?.postMessage({
				msg: 'initialize',
				lang,
			});

			// SEE: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe#Parameters
			registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(instance.swPublickey)
			}).then(subscription => {
				function encode(buffer: ArrayBuffer | null) {
					return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
				}

				// Register
				api('sw/register', {
					endpoint: subscription.endpoint,
					auth: encode(subscription.getKey('auth')),
					publickey: encode(subscription.getKey('p256dh'))
				});
			})
			// When subscribe failed
			.catch(async (err: Error) => {
				// 通知が許可されていなかったとき
				if (err.name === 'NotAllowedError') {
					return;
				}

				// 違うapplicationServerKey (または gcm_sender_id)のサブスクリプションが
				// 既に存在していることが原因でエラーになった可能性があるので、
				// そのサブスクリプションを解除しておく
				const subscription = await registration.pushManager.getSubscription();
				if (subscription) subscription.unsubscribe();
			});
		});
	}
}

/**
 * Convert the URL safe base64 string to a Uint8Array
 * @param base64String base64 string
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
