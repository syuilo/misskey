<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkAnimBg style="position: fixed; top: 0;"/>
	<div :class="$style.formContainer">
		<form :class="$style.form" class="_panel" @submit.prevent="submit()">
			<div :class="$style.banner">
				<i class="ti ti-user-check"></i>
			</div>
			<div class="_gaps_m" style="padding: 32px;">
				<div>{{ i18n.t('clickToFinishEmailVerification', { ok: i18n.ts.gotIt }) }}</div>
				<div>
					<MkButton gradate large rounded type="submit" :disabled="submitting" data-cy-admin-ok style="margin: 0 auto;">
						{{ submitting ? i18n.ts.processing : i18n.ts.gotIt }}<MkEllipsis v-if="submitting"/>
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
import MkAnimBg from '@/components/MkAnimBg.vue';
import { login } from '@/account';
import { i18n } from '@/i18n';
import * as os from '@/os';

let submitting = $ref(false);

const props = defineProps<{
	code: string;
}>();

function submit() {
	if (submitting) return;
	submitting = true;

	os.api('signup-pending', {
		code: props.code,
	}).then(res => {
		return login(res.i, '/');
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

.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--accentedBg);
	color: var(--accent);
}
</style>
