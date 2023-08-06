<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<FormSuspense :p="init">
				<div class="_gaps_m">
					<MkSwitch v-model="enableRegistration">
						<template #label>{{ i18n.ts.enableRegistration }}</template>
					</MkSwitch>

					<MkSwitch v-model="emailRequiredForSignup">
						<template #label>{{ i18n.ts.emailRequiredForSignup }}</template>
					</MkSwitch>

					<FormLink to="/admin/server-rules">{{ i18n.ts.serverRules }}</FormLink>

					<MkInput v-model="tosUrl">
						<template #prefix><i class="ti ti-link"></i></template>
						<template #label>{{ i18n.ts.tosUrl }}</template>
					</MkInput>

					<MkTextarea v-model="preservedUsernames">
						<template #label>{{ i18n.ts.preservedUsernames }}</template>
						<template #caption>{{ i18n.ts.preservedUsernamesDescription }}</template>
					</MkTextarea>

					<MkTextarea v-model="sensitiveWords">
						<template #label>{{ i18n.ts.sensitiveWords }}</template>
						<template #caption>{{ i18n.ts.sensitiveWordsDescription }}<br>{{ i18n.ts.sensitiveWordsDescription2 }}</template>
					</MkTextarea>
				</div>
			</FormSuspense>
		</MkSpacer>
		<template #footer>
			<div :class="$style.footer">
				<MkSpacer :contentMax="700" :marginMin="16" :marginMax="16">
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				</MkSpacer>
			</div>
		</template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import XHeader from './_header_.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSection from '@/components/form/section.vue';
import FormSplit from '@/components/form/split.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkButton from '@/components/MkButton.vue';
import FormLink from '@/components/form/link.vue';

let enableRegistration: boolean = $ref(false);
let emailRequiredForSignup: boolean = $ref(false);
let sensitiveWords: string = $ref('');
let preservedUsernames: string = $ref('');
let tosUrl: string | null = $ref(null);

async function init() {
	const meta = await os.api('admin/meta');
	enableRegistration = !meta.disableRegistration;
	emailRequiredForSignup = meta.emailRequiredForSignup;
	sensitiveWords = meta.sensitiveWords.join('\n');
	preservedUsernames = meta.preservedUsernames.join('\n');
	tosUrl = meta.tosUrl;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		disableRegistration: !enableRegistration,
		emailRequiredForSignup,
		tosUrl,
		sensitiveWords: sensitiveWords.split('\n'),
		preservedUsernames: preservedUsernames.split('\n'),
	}).then(() => {
		fetchInstance();
	});
}

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.moderation,
	icon: 'ti ti-shield',
});
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
