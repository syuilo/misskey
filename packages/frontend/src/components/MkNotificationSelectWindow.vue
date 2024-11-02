<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	:withOkButton="true"
	:okButtonDisabled="false"
	@ok="ok()"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.notificationSetting }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<div class="_gaps_m">
			<MkInfo>{{ i18n.ts.notificationSettingDesc }}</MkInfo>
			<div class="_buttons">
				<MkButton inline @click="disableAll">{{ i18n.ts.disableAll }}</MkButton>
				<MkButton inline @click="enableAll">{{ i18n.ts.enableAll }}</MkButton>
			</div>
			<MkSwitch v-for="ntype in notificationTypes" :key="ntype" v-model="typesMap[ntype].value">{{ i18n.ts._notification._types[ntype] }}</MkSwitch>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, Ref, shallowRef } from 'vue';
import MkSwitch from './MkSwitch.vue';
import MkInfo from './MkInfo.vue';
import MkButton from './MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { notificationTypes } from '@@/js/const.js';
import { i18n } from '@/i18n.js';

type TypesMap = Record<typeof notificationTypes[number], Ref<boolean>>

const emit = defineEmits<{
	(ev: 'done', v: { excludeTypes: string[] }): void,
	(ev: 'closed'): void,
}>();

const props = withDefaults(defineProps<{
	excludeTypes?: typeof notificationTypes[number][];
}>(), {
	excludeTypes: () => [],
});

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();

const typesMap = notificationTypes.reduce((p, t) => ({ ...p, [t]: ref<boolean>(!props.excludeTypes.includes(t)) }), {} as TypesMap);

function ok() {
	emit('done', {
		excludeTypes: (Object.keys(typesMap) as typeof notificationTypes[number][])
			.filter(type => !typesMap[type].value),
	});

	if (dialog.value) dialog.value.close();
}

function disableAll() {
	for (const type of notificationTypes) {
		typesMap[type].value = false;
	}
}

function enableAll() {
	for (const type of notificationTypes) {
		typesMap[type].value = true;
	}
}
</script>
