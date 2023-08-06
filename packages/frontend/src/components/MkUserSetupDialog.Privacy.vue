<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInfo>{{ i18n.ts._initialAccountSetting.theseSettingsCanEditLater }}</MkInfo>

	<MkFolder>
		<template #label>{{ i18n.ts.makeFollowManuallyApprove }}</template>
		<template #icon><i class="ti ti-lock"></i></template>
		<template #suffix>{{ isLocked ? i18n.ts.on : i18n.ts.off }}</template>

		<MkSwitch v-model="isLocked">{{ i18n.ts.makeFollowManuallyApprove }}<template #caption>{{ i18n.ts.lockedAccountInfo }}</template></MkSwitch>
	</MkFolder>

	<MkFolder>
		<template #label>{{ i18n.ts.hideOnlineStatus }}</template>
		<template #icon><i class="ti ti-eye-off"></i></template>
		<template #suffix>{{ hideOnlineStatus ? i18n.ts.on : i18n.ts.off }}</template>

		<MkSwitch v-model="hideOnlineStatus">{{ i18n.ts.hideOnlineStatus }}<template #caption>{{ i18n.ts.hideOnlineStatusDescription }}</template></MkSwitch>
	</MkFolder>

	<MkFolder>
		<template #label>{{ i18n.ts.noCrawle }}</template>
		<template #icon><i class="ti ti-world-x"></i></template>
		<template #suffix>{{ noCrawle ? i18n.ts.on : i18n.ts.off }}</template>

		<MkSwitch v-model="noCrawle">{{ i18n.ts.noCrawle }}<template #caption>{{ i18n.ts.noCrawleDescription }}</template></MkSwitch>
	</MkFolder>

	<MkFolder>
		<template #label>{{ i18n.ts.preventAiLearning }}</template>
		<template #icon><i class="ti ti-photo-shield"></i></template>
		<template #suffix>{{ preventAiLearning ? i18n.ts.on : i18n.ts.off }}</template>

		<MkSwitch v-model="preventAiLearning">{{ i18n.ts.preventAiLearning }}<template #caption>{{ i18n.ts.preventAiLearningDescription }}</template></MkSwitch>
	</MkFolder>

	<MkInfo>{{ i18n.ts._initialAccountSetting.youCanEditMoreSettingsInSettingsPageLater }}</MkInfo>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, ref, watch } from 'vue';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os';
import { $i } from '@/account';

let isLocked = ref(false);
let hideOnlineStatus = ref(false);
let noCrawle = ref(false);
let preventAiLearning = ref(true);

watch([isLocked, hideOnlineStatus, noCrawle, preventAiLearning], () => {
	os.api('i/update', {
		isLocked: !!isLocked.value,
		hideOnlineStatus: !!hideOnlineStatus.value,
		noCrawle: !!noCrawle.value,
		preventAiLearning: !!preventAiLearning.value,
	});
});
</script>

<style lang="scss" module>

</style>
