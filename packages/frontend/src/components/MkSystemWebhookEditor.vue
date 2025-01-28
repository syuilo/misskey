<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="450"
	:height="590"
	:canClose="true"
	:withOkButton="false"
	:okButtonDisabled="false"
	@click="onCancelClicked"
	@close="onCancelClicked"
	@closed="emit('closed')"
>
	<template #header>
		{{ mode === 'create' ? i18n.ts._webhookSettings.createWebhook : i18n.ts._webhookSettings.modifyWebhook }}
	</template>

	<div style="display: flex; flex-direction: column; min-height: 100%;">
		<MkSpacer :marginMin="20" :marginMax="28" style="flex-grow: 1;">
			<MkLoading v-if="loading !== 0"/>
			<div v-else :class="$style.root" class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ i18n.ts._webhookSettings.name }}</template>
				</MkInput>
				<MkInput v-model="url">
					<template #label>URL</template>
				</MkInput>
				<MkInput v-model="secret">
					<template #label>{{ i18n.ts._webhookSettings.secret }}</template>
				</MkInput>
				<MkFolder :defaultOpen="true">
					<template #label>{{ i18n.ts._webhookSettings.trigger }}</template>

					<div class="_gaps">
						<div class="_gaps_s">
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.abuseReport" :disabled="disabledEvents.abuseReport">
									<template #label>{{ i18n.ts._webhookSettings._systemEvents.abuseReport }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.abuseReport)" @click="test('abuseReport')"><i class="ti ti-send"></i></MkButton>
							</div>
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.abuseReportResolved" :disabled="disabledEvents.abuseReportResolved">
									<template #label>{{ i18n.ts._webhookSettings._systemEvents.abuseReportResolved }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.abuseReportResolved)" @click="test('abuseReportResolved')"><i class="ti ti-send"></i></MkButton>
							</div>
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.userCreated" :disabled="disabledEvents.userCreated">
									<template #label>{{ i18n.ts._webhookSettings._systemEvents.userCreated }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.userCreated)" @click="test('userCreated')"><i class="ti ti-send"></i></MkButton>
							</div>
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.inactiveModeratorsWarning" :disabled="disabledEvents.inactiveModeratorsWarning">
									<template #label>{{ i18n.ts._webhookSettings._systemEvents.inactiveModeratorsWarning }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.inactiveModeratorsWarning)" @click="test('inactiveModeratorsWarning')"><i class="ti ti-send"></i></MkButton>
							</div>
							<div :class="$style.switchBox">
								<MkSwitch v-model="events.inactiveModeratorsInvitationOnlyChanged" :disabled="disabledEvents.inactiveModeratorsInvitationOnlyChanged">
									<template #label>{{ i18n.ts._webhookSettings._systemEvents.inactiveModeratorsInvitationOnlyChanged }}</template>
								</MkSwitch>
								<MkButton v-show="mode === 'edit'" transparent :class="$style.testButton" :disabled="!(isActive && events.inactiveModeratorsInvitationOnlyChanged)" @click="test('inactiveModeratorsInvitationOnlyChanged')"><i class="ti ti-send"></i></MkButton>
							</div>
						</div>

						<div v-show="mode === 'edit'" :class="$style.description">
							{{ i18n.ts._webhookSettings.testRemarks }}
						</div>
					</div>
				</MkFolder>

				<MkSwitch v-model="isActive">
					<template #label>{{ i18n.ts.enable }}</template>
				</MkSwitch>
			</div>
		</MkSpacer>
		<div :class="$style.footer" class="_buttonsCenter">
			<MkButton primary rounded :disabled="disableSubmitButton" @click="onSubmitClicked">
				<i class="ti ti-check"></i>
				{{ i18n.ts.ok }}
			</MkButton>
			<MkButton rounded @click="onCancelClicked"><i class="ti ti-x"></i> {{ i18n.ts.cancel }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, toRefs } from 'vue';
import * as Misskey from 'misskey-js';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import type {
	MkSystemWebhookEditorProps,
	MkSystemWebhookResult,
	SystemWebhookEventType,
} from '@/components/MkSystemWebhookEditor.impl.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os.js';

type EventType = {
	abuseReport: boolean;
	abuseReportResolved: boolean;
	userCreated: boolean;
	inactiveModeratorsWarning: boolean;
	inactiveModeratorsInvitationOnlyChanged: boolean;
}

const emit = defineEmits<{
	(ev: 'submitted', result: MkSystemWebhookResult): void;
	(ev: 'canceled'): void;
	(ev: 'closed'): void;
}>();

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

const props = defineProps<MkSystemWebhookEditorProps>();

const { mode, id, requiredEvents } = toRefs(props);

const loading = ref<number>(0);

const title = ref<string>('');
const url = ref<string>('');
const secret = ref<string>('');
const events = ref<EventType>({
	abuseReport: true,
	abuseReportResolved: true,
	userCreated: true,
	inactiveModeratorsWarning: true,
	inactiveModeratorsInvitationOnlyChanged: true,
});
const isActive = ref<boolean>(true);

const disabledEvents = ref<EventType>({
	abuseReport: false,
	abuseReportResolved: false,
	userCreated: false,
	inactiveModeratorsWarning: false,
	inactiveModeratorsInvitationOnlyChanged: false,
});

const disableSubmitButton = computed(() => {
	if (!title.value) {
		return true;
	}
	if (!url.value) {
		return true;
	}
	if (!secret.value) {
		return true;
	}

	return false;
});

async function onSubmitClicked() {
	await loadingScope(async () => {
		const params = {
			isActive: isActive.value,
			name: title.value,
			url: url.value,
			secret: secret.value,
			on: Object.keys(events.value).filter(ev => events.value[ev as keyof EventType]) as SystemWebhookEventType[],
		};

		try {
			switch (mode.value) {
				case 'create': {
					const result = await misskeyApi('admin/system-webhook/create', params);
					dialogEl.value?.close();
					emit('submitted', result);
					break;
				}
				case 'edit': {
					// eslint-disable-next-line
					const result = await misskeyApi('admin/system-webhook/update', { id: id.value!, ...params });
					dialogEl.value?.close();
					emit('submitted', result);
					break;
				}
			}
			// eslint-disable-next-line
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

async function loadingScope<T>(fn: () => Promise<T>): Promise<T> {
	loading.value++;
	try {
		return await fn();
	} finally {
		loading.value--;
	}
}

async function test(type: Misskey.entities.SystemWebhook['on'][number]): Promise<void> {
	if (!id.value) {
		return Promise.resolve();
	}

	await os.apiWithDialog('admin/system-webhook/test', {
		webhookId: id.value,
		type,
		override: {
			secret: secret.value,
			url: url.value,
		},
	});
}

onMounted(async () => {
	await loadingScope(async () => {
		switch (mode.value) {
			case 'edit': {
				if (!id.value) {
					throw new Error('id is required');
				}

				try {
					const res = await misskeyApi('admin/system-webhook/show', { id: id.value });

					title.value = res.name;
					url.value = res.url;
					secret.value = res.secret;
					isActive.value = res.isActive;
					for (const ev of Object.keys(events.value)) {
						events.value[ev] = res.on.includes(ev as SystemWebhookEventType);
					}
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				} catch (ex: any) {
					const msg = ex.message ?? i18n.ts.internalServerErrorDescription;
					await os.alert({ type: 'error', title: i18n.ts.error, text: msg });
					dialogEl.value?.close();
					emit('canceled');
				}
				break;
			}
		}

		for (const ev of requiredEvents.value ?? []) {
			disabledEvents.value[ev] = true;
		}
	});
});
</script>

<style module lang="scss">
.root {
	display: flex;
	flex-direction: column;
	justify-content: center;
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

.switchBox {
	display: flex;
	align-items: center;
	justify-content: start;

	.testButton {
		$buttonSize: 28px;
		padding: 0;
		width: $buttonSize;
		min-width: $buttonSize;
		max-width: $buttonSize;
		height: $buttonSize;
		margin-left: auto;
		line-height: normal;
		font-size: 90%;
		border-radius: 9999px;
	}
}

.description {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: var(--MI_THEME-fgTransparentWeak);
}
</style>
