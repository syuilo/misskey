<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<FormSuspense :p="init">
		<div class="_gaps_m">
			<MkRadios v-model="provider">
				<option :value="null">{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</option>
				<option value="hcaptcha">hCaptcha</option>
				<option value="recaptcha">reCAPTCHA</option>
				<option value="turnstile">Turnstile</option>
			</MkRadios>

			<template v-if="provider === 'hcaptcha'">
				<MkInput v-model="hcaptchaSiteKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.hcaptchaSiteKey }}</template>
				</MkInput>
				<MkInput v-model="hcaptchaSecretKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.hcaptchaSecretKey }}</template>
				</MkInput>
				<FormSlot>
					<template #label>{{ i18n.ts.preview }}</template>
					<MkCaptcha provider="hcaptcha" :sitekey="hcaptchaSiteKey || '10000000-ffff-ffff-ffff-000000000001'"/>
				</FormSlot>
			</template>
			<template v-else-if="provider === 'recaptcha'">
				<MkInput v-model="recaptchaSiteKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.recaptchaSiteKey }}</template>
				</MkInput>
				<MkInput v-model="recaptchaSecretKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.recaptchaSecretKey }}</template>
				</MkInput>
				<FormSlot v-if="recaptchaSiteKey">
					<template #label>{{ i18n.ts.preview }}</template>
					<MkCaptcha provider="recaptcha" :sitekey="recaptchaSiteKey"/>
				</FormSlot>
			</template>
			<template v-else-if="provider === 'turnstile'">
				<MkInput v-model="turnstileSiteKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.turnstileSiteKey }}</template>
				</MkInput>
				<MkInput v-model="turnstileSecretKey">
					<template #prefix><i class="ti ti-key"></i></template>
					<template #label>{{ i18n.ts.turnstileSecretKey }}</template>
				</MkInput>
				<FormSlot>
					<template #label>{{ i18n.ts.preview }}</template>
					<MkCaptcha provider="turnstile" :sitekey="turnstileSiteKey || '1x00000000000000000000AA'"/>
				</FormSlot>
			</template>

			<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
		</div>
	</FormSuspense>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent } from 'vue';
import MkRadios from '@/components/MkRadios.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSlot from '@/components/form/slot.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';

const MkCaptcha = defineAsyncComponent(() => import('@/components/MkCaptcha.vue'));

let provider = $ref(null);
let hcaptchaSiteKey: string | null = $ref(null);
let hcaptchaSecretKey: string | null = $ref(null);
let recaptchaSiteKey: string | null = $ref(null);
let recaptchaSecretKey: string | null = $ref(null);
let turnstileSiteKey: string | null = $ref(null);
let turnstileSecretKey: string | null = $ref(null);

async function init() {
	const meta = await os.api('admin/meta');
	hcaptchaSiteKey = meta.hcaptchaSiteKey;
	hcaptchaSecretKey = meta.hcaptchaSecretKey;
	recaptchaSiteKey = meta.recaptchaSiteKey;
	recaptchaSecretKey = meta.recaptchaSecretKey;
	turnstileSiteKey = meta.turnstileSiteKey;
	turnstileSecretKey = meta.turnstileSecretKey;

	provider = meta.enableHcaptcha ? 'hcaptcha' : meta.enableRecaptcha ? 'recaptcha' : meta.enableTurnstile ? 'turnstile' : null;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		enableHcaptcha: provider === 'hcaptcha',
		hcaptchaSiteKey,
		hcaptchaSecretKey,
		enableRecaptcha: provider === 'recaptcha',
		recaptchaSiteKey,
		recaptchaSecretKey,
		enableTurnstile: provider === 'turnstile',
		turnstileSiteKey,
		turnstileSecretKey,
	}).then(() => {
		fetchInstance();
	});
}
</script>
