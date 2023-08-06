<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
		<FormSuspense :p="init">
			<div class="_gaps_m">
				<MkFolder>
					<template #icon><i class="ti ti-shield"></i></template>
					<template #label>{{ i18n.ts.botProtection }}</template>
					<template v-if="enableHcaptcha" #suffix>hCaptcha</template>
					<template v-else-if="enableRecaptcha" #suffix>reCAPTCHA</template>
					<template v-else-if="enableTurnstile" #suffix>Turnstile</template>
					<template v-else #suffix>{{ i18n.ts.none }} ({{ i18n.ts.notRecommended }})</template>

					<XBotProtection/>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-eye-off"></i></template>
					<template #label>{{ i18n.ts.sensitiveMediaDetection }}</template>
					<template v-if="sensitiveMediaDetection === 'all'" #suffix>{{ i18n.ts.all }}</template>
					<template v-else-if="sensitiveMediaDetection === 'local'" #suffix>{{ i18n.ts.localOnly }}</template>
					<template v-else-if="sensitiveMediaDetection === 'remote'" #suffix>{{ i18n.ts.remoteOnly }}</template>
					<template v-else #suffix>{{ i18n.ts.none }}</template>

					<div class="_gaps_m">
						<span>{{ i18n.ts._sensitiveMediaDetection.description }}</span>

						<MkRadios v-model="sensitiveMediaDetection">
							<option value="none">{{ i18n.ts.none }}</option>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="local">{{ i18n.ts.localOnly }}</option>
							<option value="remote">{{ i18n.ts.remoteOnly }}</option>
						</MkRadios>

						<MkRange v-model="sensitiveMediaDetectionSensitivity" :min="0" :max="4" :step="1" :textConverter="(v) => `${v + 1}`">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.sensitivity }}</template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.sensitivityDescription }}</template>
						</MkRange>

						<MkSwitch v-model="enableSensitiveMediaDetectionForVideos">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.analyzeVideos }}<span class="_beta">{{ i18n.ts.beta }}</span></template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.analyzeVideosDescription }}</template>
						</MkSwitch>

						<MkSwitch v-model="setSensitiveFlagAutomatically">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.setSensitiveFlagAutomatically }} ({{ i18n.ts.notRecommended }})</template>
							<template #caption>{{ i18n.ts._sensitiveMediaDetection.setSensitiveFlagAutomaticallyDescription }}</template>
						</MkSwitch>

						<!-- 現状 false positive が多すぎて実用に耐えない
						<MkSwitch v-model="disallowUploadWhenPredictedAsPorn">
							<template #label>{{ i18n.ts._sensitiveMediaDetection.disallowUploadWhenPredictedAsPorn }}</template>
						</MkSwitch>
						-->

						<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Active Email Validation</template>
					<template v-if="enableActiveEmailValidation" #suffix>Enabled</template>
					<template v-else #suffix>Disabled</template>

					<div class="_gaps_m">
						<span>{{ i18n.ts.activeEmailValidationDescription }}</span>
						<MkSwitch v-model="enableActiveEmailValidation" @update:modelValue="save">
							<template #label>Enable</template>
						</MkSwitch>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Log IP address</template>
					<template v-if="enableIpLogging" #suffix>Enabled</template>
					<template v-else #suffix>Disabled</template>

					<div class="_gaps_m">
						<MkSwitch v-model="enableIpLogging" @update:modelValue="save">
							<template #label>Enable</template>
						</MkSwitch>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Summaly Proxy</template>

					<div class="_gaps_m">
						<MkInput v-model="summalyProxy">
							<template #prefix><i class="ti ti-link"></i></template>
							<template #label>Summaly Proxy URL</template>
						</MkInput>

						<MkButton primary @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import XBotProtection from './bot-protection.vue';
import XHeader from './_header_.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSuspense from '@/components/form/suspense.vue';
import MkRange from '@/components/MkRange.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let summalyProxy: string = $ref('');
let enableHcaptcha: boolean = $ref(false);
let enableRecaptcha: boolean = $ref(false);
let enableTurnstile: boolean = $ref(false);
let sensitiveMediaDetection: string = $ref('none');
let sensitiveMediaDetectionSensitivity: number = $ref(0);
let setSensitiveFlagAutomatically: boolean = $ref(false);
let enableSensitiveMediaDetectionForVideos: boolean = $ref(false);
let enableIpLogging: boolean = $ref(false);
let enableActiveEmailValidation: boolean = $ref(false);

async function init() {
	const meta = await os.api('admin/meta');
	summalyProxy = meta.summalyProxy;
	enableHcaptcha = meta.enableHcaptcha;
	enableRecaptcha = meta.enableRecaptcha;
	enableTurnstile = meta.enableTurnstile;
	sensitiveMediaDetection = meta.sensitiveMediaDetection;
	sensitiveMediaDetectionSensitivity =
		meta.sensitiveMediaDetectionSensitivity === 'veryLow' ? 0 :
		meta.sensitiveMediaDetectionSensitivity === 'low' ? 1 :
		meta.sensitiveMediaDetectionSensitivity === 'medium' ? 2 :
		meta.sensitiveMediaDetectionSensitivity === 'high' ? 3 :
		meta.sensitiveMediaDetectionSensitivity === 'veryHigh' ? 4 : 0;
	setSensitiveFlagAutomatically = meta.setSensitiveFlagAutomatically;
	enableSensitiveMediaDetectionForVideos = meta.enableSensitiveMediaDetectionForVideos;
	enableIpLogging = meta.enableIpLogging;
	enableActiveEmailValidation = meta.enableActiveEmailValidation;
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		summalyProxy,
		sensitiveMediaDetection,
		sensitiveMediaDetectionSensitivity:
			sensitiveMediaDetectionSensitivity === 0 ? 'veryLow' :
			sensitiveMediaDetectionSensitivity === 1 ? 'low' :
			sensitiveMediaDetectionSensitivity === 2 ? 'medium' :
			sensitiveMediaDetectionSensitivity === 3 ? 'high' :
			sensitiveMediaDetectionSensitivity === 4 ? 'veryHigh' :
			0,
		setSensitiveFlagAutomatically,
		enableSensitiveMediaDetectionForVideos,
		enableIpLogging,
		enableActiveEmailValidation,
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.security,
	icon: 'ti ti-lock',
});
</script>
