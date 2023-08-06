<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="370"
	:height="400"
	@close="dialog.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.forgotPassword }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<form v-if="instance.enableEmail" @submit.prevent="onSubmit">
			<div class="_gaps_m">
				<MkInput v-model="username" type="text" pattern="^[a-zA-Z0-9_]+$" :spellcheck="false" autofocus required>
					<template #label>{{ i18n.ts.username }}</template>
					<template #prefix>@</template>
				</MkInput>

				<MkInput v-model="email" type="email" :spellcheck="false" required>
					<template #label>{{ i18n.ts.emailAddress }}</template>
					<template #caption>{{ i18n.ts._forgotPassword.enterEmail }}</template>
				</MkInput>

				<MkButton type="submit" rounded :disabled="processing" primary style="margin: 0 auto;">{{ i18n.ts.send }}</MkButton>

				<MkInfo>{{ i18n.ts._forgotPassword.ifNoEmail }}</MkInfo>
			</div>
		</form>
		<div v-else>
			{{ i18n.ts._forgotPassword.contactAdmin }}
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { instance } from '@/instance';
import { i18n } from '@/i18n';

const emit = defineEmits<{
	(ev: 'done'): void;
	(ev: 'closed'): void;
}>();

let dialog: InstanceType<typeof MkModalWindow> = $ref();

let username = $ref('');
let email = $ref('');
let processing = $ref(false);

async function onSubmit() {
	processing = true;
	await os.apiWithDialog('request-reset-password', {
		username,
		email,
	});
	emit('done');
	dialog.close();
}
</script>
