<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkInput v-model="name">
		<template #label>{{ i18n.ts._webhookSettings.name }}</template>
	</MkInput>

	<MkInput v-model="url" type="url">
		<template #label>URL</template>
	</MkInput>

	<MkInput v-model="secret">
		<template #prefix><i class="ti ti-lock"></i></template>
		<template #label>{{ i18n.ts._webhookSettings.secret }}</template>
	</MkInput>

	<FormSection>
		<template #label>{{ i18n.ts._webhookSettings.events }}</template>

		<div class="_gaps_s">
			<MkSwitch v-model="event_follow">{{ i18n.ts._webhookSettings._events.follow }}</MkSwitch>
			<MkSwitch v-model="event_followed">{{ i18n.ts._webhookSettings._events.followed }}</MkSwitch>
			<MkSwitch v-model="event_note">{{ i18n.ts._webhookSettings._events.note }}</MkSwitch>
			<MkSwitch v-model="event_reply">{{ i18n.ts._webhookSettings._events.reply }}</MkSwitch>
			<MkSwitch v-model="event_renote">{{ i18n.ts._webhookSettings._events.renote }}</MkSwitch>
			<MkSwitch v-model="event_reaction">{{ i18n.ts._webhookSettings._events.reaction }}</MkSwitch>
			<MkSwitch v-model="event_mention">{{ i18n.ts._webhookSettings._events.mention }}</MkSwitch>
		</div>
	</FormSection>

	<div class="_buttons">
		<MkButton primary inline @click="create"><i class="ti ti-check"></i> {{ i18n.ts.create }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import MkInput from '@/components/MkInput.vue';
import FormSection from '@/components/form/section.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let name = $ref('');
let url = $ref('');
let secret = $ref('');

let event_follow = $ref(true);
let event_followed = $ref(true);
let event_note = $ref(true);
let event_reply = $ref(true);
let event_renote = $ref(true);
let event_reaction = $ref(true);
let event_mention = $ref(true);

async function create(): Promise<void> {
	const events = [];
	if (event_follow) events.push('follow');
	if (event_followed) events.push('followed');
	if (event_note) events.push('note');
	if (event_reply) events.push('reply');
	if (event_renote) events.push('renote');
	if (event_reaction) events.push('reaction');
	if (event_mention) events.push('mention');

	os.apiWithDialog('i/webhooks/create', {
		name,
		url,
		secret,
		on: events,
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: 'Create new webhook',
	icon: 'ti ti-webhook',
});
</script>
