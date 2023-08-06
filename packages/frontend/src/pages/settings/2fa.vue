<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<FormSection :first="first">
	<template #label>{{ i18n.ts['2fa'] }}</template>

	<div v-if="$i" class="_gaps_s">
		<MkFolder>
			<template #icon><i class="ti ti-shield-lock"></i></template>
			<template #label>{{ i18n.ts.totp }}</template>
			<template #caption>{{ i18n.ts.totpDescription }}</template>
			<div v-if="$i.twoFactorEnabled" class="_gaps_s">
				<div v-text="i18n.ts._2fa.alreadyRegistered"/>
				<template v-if="$i.securityKeysList.length > 0">
					<MkButton @click="renewTOTP">{{ i18n.ts._2fa.renewTOTP }}</MkButton>
					<MkInfo>{{ i18n.ts._2fa.whyTOTPOnlyRenew }}</MkInfo>
				</template>
				<MkButton v-else @click="unregisterTOTP">{{ i18n.ts.unregister }}</MkButton>
			</div>

			<MkButton v-else-if="!twoFactorData && !$i.twoFactorEnabled" @click="registerTOTP">{{ i18n.ts._2fa.registerTOTP }}</MkButton>
		</MkFolder>

		<MkFolder>
			<template #icon><i class="ti ti-key"></i></template>
			<template #label>{{ i18n.ts.securityKeyAndPasskey }}</template>
			<div class="_gaps_s">
				<MkInfo>
					{{ i18n.ts._2fa.securityKeyInfo }}<br>
					<br>
					{{ i18n.ts._2fa.chromePasskeyNotSupported }}
				</MkInfo>

				<MkInfo v-if="!supportsCredentials" warn>
					{{ i18n.ts._2fa.securityKeyNotSupported }}
				</MkInfo>

				<MkInfo v-else-if="supportsCredentials && !$i.twoFactorEnabled" warn>
					{{ i18n.ts._2fa.registerTOTPBeforeKey }}
				</MkInfo>

				<template v-else>
					<MkButton primary @click="addSecurityKey">{{ i18n.ts._2fa.registerSecurityKey }}</MkButton>
					<MkFolder v-for="key in $i.securityKeysList" :key="key.id">
						<template #label>{{ key.name }}</template>
						<template #suffix><I18n :src="i18n.ts.lastUsedAt"><template #t><MkTime :time="key.lastUsed"/></template></I18n></template>
						<div class="_buttons">
							<MkButton @click="renameKey(key)"><i class="ti ti-forms"></i> {{ i18n.ts.rename }}</MkButton>
							<MkButton danger @click="unregisterKey(key)"><i class="ti ti-trash"></i> {{ i18n.ts.unregister }}</MkButton>
						</div>
					</MkFolder>
				</template>
			</div>
		</MkFolder>

		<MkSwitch :disabled="!$i.twoFactorEnabled || $i.securityKeysList.length === 0" :modelValue="usePasswordLessLogin" @update:modelValue="v => updatePasswordLessLogin(v)">
			<template #label>{{ i18n.ts.passwordLessLogin }}</template>
			<template #caption>{{ i18n.ts.passwordLessLoginDescription }}</template>
		</MkSwitch>
	</div>
</FormSection>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref, defineAsyncComponent } from 'vue';
import { hostname } from '@/config';
import { byteify, hexify, stringify } from '@/scripts/2fa';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os';
import { $i } from '@/account';
import { i18n } from '@/i18n';

// メモ: 各エンドポイントはmeUpdatedを発行するため、refreshAccountは不要

withDefaults(defineProps<{
	first?: boolean;
}>(), {
	first: false,
});

const twoFactorData = ref<any>(null);
const supportsCredentials = ref(!!navigator.credentials);
const usePasswordLessLogin = $computed(() => $i!.usePasswordLessLogin);

async function registerTOTP() {
	const password = await os.inputText({
		title: i18n.ts._2fa.registerTOTP,
		text: i18n.ts._2fa.passwordToTOTP,
		type: 'password',
		autocomplete: 'current-password',
	});
	if (password.canceled) return;

	const twoFactorData = await os.apiWithDialog('i/2fa/register', {
		password: password.result,
	});

	const qrdialog = await new Promise<boolean>(res => {
		os.popup(defineAsyncComponent(() => import('./2fa.qrdialog.vue')), {
			twoFactorData,
		}, {
			'ok': () => res(true),
			'cancel': () => res(false),
		}, 'closed');
	});
	if (!qrdialog) return;

	const token = await os.inputNumber({
		title: i18n.ts._2fa.step3Title,
		text: i18n.ts._2fa.step3,
		autocomplete: 'one-time-code',
	});
	if (token.canceled) return;

	await os.apiWithDialog('i/2fa/done', {
		token: token.result.toString(),
	});

	await os.alert({
		type: 'success',
		text: i18n.ts._2fa.step4,
	});
}

function unregisterTOTP() {
	os.inputText({
		title: i18n.ts.password,
		type: 'password',
		autocomplete: 'current-password',
	}).then(({ canceled, result: password }) => {
		if (canceled) return;
		os.apiWithDialog('i/2fa/unregister', {
			password: password,
		}).catch(error => {
			os.alert({
				type: 'error',
				text: error,
			});
		});
	});
}

function renewTOTP() {
	os.confirm({
		type: 'question',
		title: i18n.ts._2fa.renewTOTP,
		text: i18n.ts._2fa.renewTOTPConfirm,
		okText: i18n.ts._2fa.renewTOTPOk,
		cancelText: i18n.ts._2fa.renewTOTPCancel,
	}).then(({ canceled }) => {
		if (canceled) return;
		registerTOTP();
	});
}

async function unregisterKey(key) {
	const confirm = await os.confirm({
		type: 'question',
		title: i18n.ts._2fa.removeKey,
		text: i18n.t('_2fa.removeKeyConfirm', { name: key.name }),
	});
	if (confirm.canceled) return;

	const password = await os.inputText({
		title: i18n.ts.password,
		type: 'password',
		autocomplete: 'current-password',
	});
	if (password.canceled) return;

	await os.apiWithDialog('i/2fa/remove-key', {
		password: password.result,
		credentialId: key.id,
	});
	os.success();
}

async function renameKey(key) {
	const name = await os.inputText({
		title: i18n.ts.rename,
		default: key.name,
		type: 'text',
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	await os.apiWithDialog('i/2fa/update-key', {
		name: name.result,
		credentialId: key.id,
	});
}

async function addSecurityKey() {
	const password = await os.inputText({
		title: i18n.ts.password,
		type: 'password',
		autocomplete: 'current-password',
	});
	if (password.canceled) return;

	const challenge: any = await os.apiWithDialog('i/2fa/register-key', {
		password: password.result,
	});

	const name = await os.inputText({
		title: i18n.ts._2fa.registerSecurityKey,
		text: i18n.ts._2fa.securityKeyName,
		type: 'text',
		minLength: 1,
		maxLength: 30,
	});
	if (name.canceled) return;

	const webAuthnCreation = navigator.credentials.create({
		publicKey: {
			challenge: byteify(challenge.challenge, 'base64'),
			rp: {
				id: hostname,
				name: 'Misskey',
			},
			user: {
				id: byteify($i!.id, 'ascii'),
				name: $i!.username,
				displayName: $i!.name,
			},
			pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
			timeout: 60000,
			attestation: 'direct',
		},
	}) as Promise<PublicKeyCredential & { response: AuthenticatorAttestationResponse; } | null>;

	const credential = await os.promiseDialog(
		webAuthnCreation,
		null,
		() => {}, // ユーザーのキャンセルはrejectなのでエラーダイアログを出さない
		i18n.ts._2fa.tapSecurityKey,
	);
	if (!credential) return;

	await os.apiWithDialog('i/2fa/key-done', {
		password: password.result,
		name: name.result,
		challengeId: challenge.challengeId,
		// we convert each 16 bits to a string to serialise
		clientDataJSON: stringify(credential.response.clientDataJSON),
		attestationObject: hexify(credential.response.attestationObject),
	});
}

async function updatePasswordLessLogin(value: boolean) {
	await os.apiWithDialog('i/2fa/password-less', {
		value,
	});
}
</script>
