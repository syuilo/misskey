<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="400"
	:height="490"
	:withOkButton="false"
	:okButtonDisabled="false"
	@close="onCancelClicked"
	@closed="emit('closed')"
>
	<template #header>
		{{ mode === 'create' ? i18n.ts._abuseReport._notificationRecipient.createRecipient : i18n.ts._abuseReport._notificationRecipient.modifyRecipient }}
	</template>
	<div v-if="loading === 0" style="display: flex; flex-direction: column; min-height: 100%;">
		<MkSpacer :marginMin="20" :marginMax="28" style="flex-grow: 1;">
			<div :class="$style.root" class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ i18n.ts.title }}</template>
				</MkInput>
				<MkSelect v-model="method">
					<template #label>{{ i18n.ts._abuseReport._notificationRecipient.recipientType }}</template>
					<option value="email">{{ i18n.ts._abuseReport._notificationRecipient._recipientType.mail }}</option>
					<option value="webhook">{{ i18n.ts._abuseReport._notificationRecipient._recipientType.webhook }}</option>
					<template #caption>
						{{ methodCaption }}
					</template>
				</MkSelect>
				<div>
					<MkSelect v-if="method === 'email'" v-model="userId">
						<template #label>{{ i18n.ts._abuseReport._notificationRecipient.notifiedUser }}</template>
						<option v-for="user in moderators" :key="user.id" :value="user.id">
							{{ user.name ? `${user.name}(${user.username})` : user.username }}
						</option>
					</MkSelect>
					<div v-else-if="method === 'webhook'" :class="$style.systemWebhook">
						<MkSelect v-model="systemWebhookId" style="flex: 1">
							<template #label>{{ i18n.ts._abuseReport._notificationRecipient.notifiedWebhook }}</template>
							<option v-for="webhook in systemWebhooks" :key="webhook.id ?? undefined" :value="webhook.id">
								{{ webhook.name }}
							</option>
						</MkSelect>
						<MkButton rounded :class="$style.systemWebhookEditButton" @click="onEditSystemWebhookClicked">
							<span v-if="systemWebhookId === null" class="ti ti-plus" style="line-height: normal"/>
							<span v-else class="ti ti-settings" style="line-height: normal"/>
						</MkButton>
					</div>
				</div>

				<MkDivider/>

				<MkSwitch v-model="isActive">
					<template #label>{{ i18n.ts.enable }}</template>
				</MkSwitch>
			</div>
		</MkSpacer>

		<div :class="$style.footer" class="_buttonsCenter">
			<MkButton primary rounded :disabled="disableSubmitButton" @click="onSubmitClicked"><i class="ti ti-check"></i> {{ i18n.ts.ok }}</MkButton>
			<MkButton rounded @click="onCancelClicked"><i class="ti ti-x"></i> {{ i18n.ts.cancel }}</MkButton>
		</div>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, shallowRef, toRefs } from 'vue';
import { entities } from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkSelect from '@/components/MkSelect.vue';
import { showSystemWebhookEditorDialog } from '@/components/MkSystemWebhookEditor.impl.js';
import type { MkSystemWebhookResult } from '@/components/MkSystemWebhookEditor.impl.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkDivider from '@/components/MkDivider.vue';
import * as os from '@/os.js';

type NotificationRecipientMethod = 'email' | 'webhook';

const emit = defineEmits<{
	(ev: 'submitted'): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const props = defineProps<{
	mode: 'create' | 'edit';
	id?: string;
}>();

const { mode, id } = toRefs(props);

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

const loading = ref<number>(0);

const title = ref<string>('');
const method = ref<NotificationRecipientMethod>('email');
const userId = ref<string | null>(null);
const systemWebhookId = ref<string | null>(null);
const isActive = ref<boolean>(true);

const moderators = ref<entities.User[]>([]);
const systemWebhooks = ref<(entities.SystemWebhook | { id: null, name: string })[]>([]);

const methodCaption = computed(() => {
	switch (method.value) {
		case 'email': {
			return i18n.ts._abuseReport._notificationRecipient._recipientType._captions.mail;
		}
		case 'webhook': {
			return i18n.ts._abuseReport._notificationRecipient._recipientType._captions.webhook;
		}
		default: {
			return '';
		}
	}
});

const disableSubmitButton = computed(() => {
	if (!title.value) {
		return true;
	}

	switch (method.value) {
		case 'email': {
			return userId.value === null;
		}
		case 'webhook': {
			return systemWebhookId.value === null;
		}
		default: {
			return true;
		}
	}
});

async function onSubmitClicked() {
	await loadingScope(async () => {
		const _userId = (method.value === 'email') ? userId.value : null;
		const _systemWebhookId = (method.value === 'webhook') ? systemWebhookId.value : null;
		const params = {
			isActive: isActive.value,
			name: title.value,
			method: method.value,
			userId: _userId ?? undefined,
			systemWebhookId: _systemWebhookId ?? undefined,
		};

		try {
			switch (mode.value) {
				case 'create': {
					await misskeyApi('admin/abuse-report/notification-recipient/create', params);
					break;
				}
				case 'edit': {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					await misskeyApi('admin/abuse-report/notification-recipient/update', { id: id.value!, ...params });
					break;
				}
			}

			dialogEl.value?.close();
			emit('submitted');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (ex: any) {
			const msg = ex.message ?? i18n.ts.internalServerErrorDescription;
			await os.alert({ type: 'error', title: i18n.ts.error, text: msg });
			dialogEl.value?.close();
			emit('canceled');
		}
	});
}

function onCancelClicked() {
	dialogEl.value?.close();
	emit('canceled');
}

async function onEditSystemWebhookClicked() {
	let result: MkSystemWebhookResult | null;
	if (systemWebhookId.value === null) {
		result = await showSystemWebhookEditorDialog({
			mode: 'create',
		});
	} else {
		result = await showSystemWebhookEditorDialog({
			mode: 'edit',
			id: systemWebhookId.value,
		});
	}
	if (!result) {
		return;
	}

	await fetchSystemWebhooks();
	systemWebhookId.value = result.id ?? null;
}

async function fetchSystemWebhooks() {
	await loadingScope(async () => {
		systemWebhooks.value = [
			{ id: null, name: i18n.ts.createNew },
			...await misskeyApi('admin/system-webhook/list', { }),
		];
	});
}

async function fetchModerators() {
	await loadingScope(async () => {
		const users = Array.of<entities.User>();
		for (; ;) {
			const res = await misskeyApi('admin/show-users', {
				limit: 100,
				state: 'adminOrModerator',
				origin: 'local',
				offset: users.length,
			});

			if (res.length === 0) {
				break;
			}

			users.push(...res);
		}

		moderators.value = users;
	});
}

async function loadingScope<T>(fn: () => Promise<T>): Promise<T> {
	loading.value++;
	try {
		return await fn();
	} finally {
		loading.value--;
	}
}

onMounted(async () => {
	await loadingScope(async () => {
		await fetchModerators();
		await fetchSystemWebhooks();

		if (mode.value === 'edit') {
			if (!id.value) {
				throw new Error('id is required');
			}

			try {
				const res = await misskeyApi('admin/abuse-report/notification-recipient/show', { id: id.value });

				title.value = res.name;
				method.value = res.method;
				userId.value = res.userId ?? null;
				systemWebhookId.value = res.systemWebhookId ?? null;
				isActive.value = res.isActive;
				// eslint-disable-next-line
			} catch (ex: any) {
				const msg = ex.message ?? i18n.ts.internalServerErrorDescription;
				await os.alert({ type: 'error', title: i18n.ts.error, text: msg });
				dialogEl.value?.close();
				emit('canceled');
			}
		} else {
			userId.value = moderators.value[0]?.id ?? null;
			systemWebhookId.value = systemWebhooks.value[0]?.id ?? null;
		}
	});
});

</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: stretch;
}

.footer {
	position: sticky;
	z-index: 10000;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	background: var(--MI_THEME-acrylicBg);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}

.systemWebhook {
	display: flex;
	flex-direction: row;
	justify-content: stretch;
	align-items: flex-end;
	gap: 8px;
}

.systemWebhookEditButton {
	min-width: 0;
	min-height: 0;
	width: 34px;
	height: 34px;
	flex-shrink: 0;
	box-sizing: border-box;
	margin: 1px 0;
	padding: 6px;
}
</style>
