<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkAnimBg style="position: fixed; top: 0;"/>
	<div :class="$style.formContainer">
		<form :class="$style.form" class="_panel" @submit.prevent="submit()">
			<div :class="$style.title">
				<div>Welcome to Misskey!</div>
				<div :class="$style.version">v{{ version }}</div>
			</div>
			<div class="_gaps_m" style="padding: 32px;">
				<div>{{ i18n.ts.intro }}</div>
				<MkInput v-model="username" pattern="^[a-zA-Z0-9_]{1,20}$" :spellcheck="false" required data-cy-admin-username>
					<template #label>{{ i18n.ts.username }}</template>
					<template #prefix>@</template>
					<template #suffix>@{{ host }}</template>
				</MkInput>
				<MkInput v-model="password" type="password" data-cy-admin-password>
					<template #label>{{ i18n.ts.password }}</template>
					<template #prefix><i class="ti ti-lock"></i></template>
				</MkInput>
				<div>
					<MkButton gradate large rounded type="submit" :disabled="submitting" data-cy-admin-ok style="margin: 0 auto;">
						{{ submitting ? i18n.ts.processing : i18n.ts.done }}<MkEllipsis v-if="submitting"/>
					</MkButton>
				</div>
			</div>
		</form>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import { host, version } from '@/config';
import * as os from '@/os';
import { login } from '@/account';
import { i18n } from '@/i18n';
import MkAnimBg from '@/components/MkAnimBg.vue';

let username = $ref('');
let password = $ref('');
let submitting = $ref(false);

function submit() {
	if (submitting) return;
	submitting = true;

	os.api('admin/accounts/create', {
		username: username,
		password: password,
	}).then(res => {
		return login(res.token);
	}).catch(() => {
		submitting = false;

		os.alert({
			type: 'error',
			text: i18n.ts.somethingHappened,
		});
	});
}
</script>

<style lang="scss" module>
.formContainer {
	min-height: 100svh;
	padding: 32px 32px 64px 32px;
	box-sizing: border-box;
display: grid;
place-content: center;
}

.form {
	position: relative;
	z-index: 10;
	border-radius: var(--radius);
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
	overflow: clip;
	max-width: 500px;
}

.title {
	margin: 0;
	font-size: 1.5em;
	text-align: center;
	padding: 32px;
	background: var(--accentedBg);
	color: var(--accent);
	font-weight: bold;
}

.version {
	font-size: 70%;
	font-weight: normal;
	opacity: 0.7;
}
</style>
