<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormLink @click="configure"><template #icon><i class="ti ti-settings"></i></template>{{ i18n.ts.notificationSetting }}</FormLink>
	<FormSection>
		<div class="_gaps_m">
			<FormLink @click="readAllNotifications">{{ i18n.ts.markAsReadAllNotifications }}</FormLink>
			<FormLink @click="readAllUnreadNotes">{{ i18n.ts.markAsReadAllUnreadNotes }}</FormLink>
		</div>
	</FormSection>
	<FormSection>
		<template #label>{{ i18n.ts.pushNotification }}</template>

		<div class="_gaps_m">
			<MkPushNotificationAllowButton ref="allowButton"/>
			<MkSwitch :disabled="!pushRegistrationInServer" :modelValue="sendReadMessage" @update:modelValue="onChangeSendReadMessage">
				<template #label>{{ i18n.ts.sendPushNotificationReadMessage }}</template>
				<template #caption>
					<I18n :src="i18n.ts.sendPushNotificationReadMessageCaption">
						<template #emptyPushNotificationMessage>{{ i18n.ts._notification.emptyPushNotificationMessage }}</template>
					</I18n>
				</template>
			</MkSwitch>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent } from 'vue';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkPushNotificationAllowButton from '@/components/MkPushNotificationAllowButton.vue';
import { notificationTypes } from '@/const';

let allowButton = $shallowRef<InstanceType<typeof MkPushNotificationAllowButton>>();
let pushRegistrationInServer = $computed(() => allowButton?.pushRegistrationInServer);
let sendReadMessage = $computed(() => pushRegistrationInServer?.sendReadMessage || false);

async function readAllUnreadNotes() {
	await os.api('i/read-all-unread-notes');
}

async function readAllNotifications() {
	await os.api('notifications/mark-all-as-read');
}

function configure() {
	const includingTypes = notificationTypes.filter(x => !$i!.mutingNotificationTypes.includes(x));
	os.popup(defineAsyncComponent(() => import('@/components/MkNotificationSettingWindow.vue')), {
		includingTypes,
		showGlobalToggle: false,
	}, {
		done: async (res) => {
			const { includingTypes: value } = res;
			await os.apiWithDialog('i/update', {
				mutingNotificationTypes: notificationTypes.filter(x => !value.includes(x)),
			}).then(i => {
				$i!.mutingNotificationTypes = i.mutingNotificationTypes;
			});
		},
	}, 'closed');
}

function onChangeSendReadMessage(v: boolean) {
	if (!pushRegistrationInServer) return;

	os.apiWithDialog('sw/update-registration', {
		endpoint: pushRegistrationInServer.endpoint,
		sendReadMessage: v,
	}).then(res => {
		if (!allowButton)	return;
		allowButton.pushRegistrationInServer = res;
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.notifications,
	icon: 'ti ti-bell',
});
</script>
