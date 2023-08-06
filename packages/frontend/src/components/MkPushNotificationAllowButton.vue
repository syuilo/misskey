<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkButton
	v-if="supported && !pushRegistrationInServer"
	type="button"
	primary
	:gradate="gradate"
	:rounded="rounded"
	:inline="inline"
	:autofocus="autofocus"
	:wait="wait"
	:full="full"
	@click="subscribe"
>
	{{ i18n.ts.subscribePushNotification }}
</MkButton>
<MkButton
	v-else-if="!showOnlyToRegister && ($i ? pushRegistrationInServer : pushSubscription)"
	type="button"
	:primary="false"
	:gradate="gradate"
	:rounded="rounded"
	:inline="inline"
	:autofocus="autofocus"
	:wait="wait"
	:full="full"
	@click="unsubscribe"
>
	{{ i18n.ts.unsubscribePushNotification }}
</MkButton>
<MkButton v-else-if="$i && pushRegistrationInServer" disabled :rounded="rounded" :inline="inline" :wait="wait" :full="full">
	{{ i18n.ts.pushNotificationAlreadySubscribed }}
</MkButton>
<MkButton v-else-if="!supported" disabled :rounded="rounded" :inline="inline" :wait="wait" :full="full">
	{{ i18n.ts.pushNotificationNotSupported }}
</MkButton>
</template>

<script setup lang="ts">
// @ts-nocheck
import { $i, getAccounts } from '@/account';
import MkButton from '@/components/MkButton.vue';
import { instance } from '@/instance';
import { api, apiWithDialog, promiseDialog } from '@/os';
import { i18n } from '@/i18n';

defineProps<{
	primary?: boolean;
	gradate?: boolean;
	rounded?: boolean;
	inline?: boolean;
	link?: boolean;
	to?: string;
	autofocus?: boolean;
	wait?: boolean;
	danger?: boolean;
	full?: boolean;
	showOnlyToRegister?: boolean;
}>();

// ServiceWorker registration
let registration = $ref<ServiceWorkerRegistration | undefined>();
// If this browser supports push notification
let supported = $ref(false);
// If this browser has already subscribed to push notification
let pushSubscription = $ref<PushSubscription | null>(null);
let pushRegistrationInServer = $ref<{ state?: string; key?: string; userId: string; endpoint: string; sendReadMessage: boolean; } | undefined>();

function subscribe() {
	if (!registration || !supported || !instance.swPublickey) return;

	// SEE: https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe#Parameters
	return promiseDialog(registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(instance.swPublickey),
	})
		.then(async subscription => {
			pushSubscription = subscription;

			// Register
			pushRegistrationInServer = await api('sw/register', {
				endpoint: subscription.endpoint,
				auth: encode(subscription.getKey('auth')),
				publickey: encode(subscription.getKey('p256dh')),
			});
		}, async err => { // When subscribe failed
		// 通知が許可されていなかったとき
			if (err?.name === 'NotAllowedError') {
				console.info('User denied the notification permission request.');
				return;
			}

			// 違うapplicationServerKey (または gcm_sender_id)のサブスクリプションが
			// 既に存在していることが原因でエラーになった可能性があるので、
			// そのサブスクリプションを解除しておく
			// （これは実行されなさそうだけど、おまじない的に古い実装から残してある）
			await unsubscribe();
		}), null, null);
}

async function unsubscribe() {
	if (!pushSubscription) return;

	const endpoint = pushSubscription.endpoint;
	const accounts = await getAccounts();

	pushRegistrationInServer = undefined;

	if ($i && accounts.length >= 2) {
		apiWithDialog('sw/unregister', {
			i: $i.token,
			endpoint,
		});
	} else {
		pushSubscription.unsubscribe();
		apiWithDialog('sw/unregister', {
			endpoint,
		});
		pushSubscription = null;
	}
}

function encode(buffer: ArrayBuffer | null) {
	return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
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

if (navigator.serviceWorker == null) {
	// TODO: よしなに？
} else {
	navigator.serviceWorker.ready.then(async swr => {
		registration = swr;

		pushSubscription = await registration.pushManager.getSubscription();

		if (instance.swPublickey && ('PushManager' in window) && $i && $i.token) {
			supported = true;

			if (pushSubscription) {
				const res = await api('sw/show-registration', {
					endpoint: pushSubscription.endpoint,
				});

				if (res) {
					pushRegistrationInServer = res;
				}
			}
		}
	});
}

defineExpose({
	pushRegistrationInServer: $$(pushRegistrationInServer),
});
</script>
