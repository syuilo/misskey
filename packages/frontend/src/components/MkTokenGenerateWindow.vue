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
	:canClose="false"
	@close="dialog?.close()"
	@closed="emit('closed')"
	@ok="ok()"
>
	<template #header>{{ title || i18n.ts.generateAccessToken }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<div class="_gaps_m">
			<div v-if="information">
				<MkInfo warn>{{ information }}</MkInfo>
			</div>
			<div>
				<MkInput v-model="name">
					<template #label>{{ i18n.ts.name }}</template>
				</MkInput>
			</div>
			<div><b>{{ i18n.ts.permission }}</b></div>
			<div class="_buttons">
				<MkButton inline @click="disableAll">{{ i18n.ts.disableAll }}</MkButton>
				<MkButton inline @click="enableAll">{{ i18n.ts.enableAll }}</MkButton>
			</div>
			<div class="_gaps_s">
				<MkSwitch v-for="kind in Object.keys(permissionSwitches)" :key="kind" v-model="permissionSwitches[kind]">{{ i18n.ts._permissions[kind] }}</MkSwitch>
			</div>
			<div v-if="iAmAdmin" :class="$style.adminPermissions">
				<div :class="$style.adminPermissionsHeader"><b>{{ i18n.ts.adminPermission }}</b></div>
				<div class="_gaps_s">
					<MkSwitch v-for="kind in Object.keys(permissionSwitchesForAdmin)" :key="kind" v-model="permissionSwitchesForAdmin[kind]">{{ i18n.ts._permissions[kind] }}</MkSwitch>
				</div>
			</div>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { shallowRef, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkInput from './MkInput.vue';
import MkSwitch from './MkSwitch.vue';
import MkButton from './MkButton.vue';
import MkInfo from './MkInfo.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { iAmAdmin } from '@/account.js';

const props = withDefaults(defineProps<{
	title?: string | null;
	information?: string | null;
	initialName?: string | null;
	initialPermissions?: (typeof Misskey.permissions)[number][] | null;
}>(), {
	title: null,
	information: null,
	initialName: null,
	initialPermissions: null,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'done', result: { name: string | null, permissions: string[] }): void;
}>();

const defaultPermissions = Misskey.permissions.filter(p => !p.startsWith('read:admin') && !p.startsWith('write:admin'));
const adminPermissions = Misskey.permissions.filter(p => p.startsWith('read:admin') || p.startsWith('write:admin'));

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();
const name = ref(props.initialName);
const permissionSwitches = ref(<Record<(typeof Misskey.permissions)[number], boolean>>{});
const permissionSwitchesForAdmin = ref(<Record<(typeof Misskey.permissions)[number], boolean>>{});

if (props.initialPermissions) {
	for (const kind of props.initialPermissions) {
		permissionSwitches.value[kind] = true;
	}
} else {
	for (const kind of defaultPermissions) {
		permissionSwitches.value[kind] = false;
	}

	if (iAmAdmin) {
		for (const kind of adminPermissions) {
			permissionSwitchesForAdmin.value[kind] = false;
		}
	}
}

function ok(): void {
	emit('done', {
		name: name.value,
		permissions: [
			...Object.keys(permissionSwitches.value).filter(p => permissionSwitches.value[p]),
			...(iAmAdmin ? Object.keys(permissionSwitchesForAdmin.value).filter(p => permissionSwitchesForAdmin.value[p]) : []),
		],
	});
	dialog.value?.close();
}

function disableAll(): void {
	for (const p in permissionSwitches.value) {
		permissionSwitches.value[p] = false;
	}
	if (iAmAdmin) {
		for (const p in permissionSwitchesForAdmin.value) {
			permissionSwitchesForAdmin.value[p] = false;
		}
	}
}

function enableAll(): void {
	for (const p in permissionSwitches.value) {
		permissionSwitches.value[p] = true;
	}
	if (iAmAdmin) {
		for (const p in permissionSwitchesForAdmin.value) {
			permissionSwitchesForAdmin.value[p] = true;
		}
	}
}
</script>

<style module lang="scss">
.adminPermissions {
	margin: 8px -6px 0;
	padding: 24px 6px 6px;
	border: 2px solid var(--MI_THEME-error);
	border-radius: calc(var(--MI-radius) / 2);
}

.adminPermissionsHeader {
	margin: -34px 0 6px 12px;
	padding: 0 4px;
	width: fit-content;
	color: var(--MI_THEME-error);
	background: var(--MI_THEME-panel);
}
</style>
