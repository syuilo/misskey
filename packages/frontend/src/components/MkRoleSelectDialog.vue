<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="windowEl"
	:withOkButton="false"
	:okButtonDisabled="false"
	:width="400"
	:height="500"
	@close="onCloseModalWindow"
	@closed="console.log('MkRoleSelectDialog: closed') ; $emit('dispose')"
>
	<template #header>{{ title }}</template>
	<MkSpacer :marginMin="20" :marginMax="28">
		<MkLoading v-if="fetching"/>
		<div v-else class="_gaps" :class="$style.root">
			<div :class="$style.header">
				<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
			</div>

			<div v-if="selectedRoles.length > 0" class="_gaps" :class="$style.roleItemArea">
				<div v-for="role in selectedRoles" :key="role.id" :class="$style.roleItem">
					<MkRolePreview :class="$style.role" :role="role" :forModeration="true" :detailed="false" style="pointer-events: none;"/>
					<button class="_button" :class="$style.roleUnAssign" @click="removeRole(role.id)"><i class="ti ti-x"></i></button>
				</div>
			</div>
			<div v-else :class="$style.roleItemArea" style="text-align: center">
				{{ i18n.ts._roleSelectDialog.notSelected }}
			</div>

			<MkInfo v-if="infoMessage">{{ infoMessage }}</MkInfo>

			<div :class="$style.buttons">
				<MkButton primary @click="onOkClicked">{{ i18n.ts.ok }}</MkButton>
				<MkButton @click="onCancelClicked">{{ i18n.ts.cancel }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import * as os from '@/os.js';
import MkSpacer from '@/components/global/MkSpacer.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkLoading from '@/components/global/MkLoading.vue';

const emit = defineEmits<{
	(ev: 'done', value: Misskey.entities.Role[]),
	(ev: 'close'),
	(ev: 'dispose'),
}>();

const props = withDefaults(defineProps<{
	initialRoleIds?: string[],
	infoMessage?: string,
	title?: string,
	publicOnly: boolean,
}>(), {
	initialRoleIds: undefined,
	infoMessage: undefined,
	title: undefined,
	publicOnly: true,
});

const { initialRoleIds, infoMessage, title, publicOnly } = toRefs(props);

const windowEl = ref<InstanceType<typeof MkModalWindow>>();
const roles = ref<Misskey.entities.Role[]>([]);
const selectedRoleIds = ref<string[]>(initialRoleIds.value ?? []);
const fetching = ref(false);

const selectedRoles = computed(() => {
	const r = roles.value.filter(role => selectedRoleIds.value.includes(role.id));
	r.sort((a, b) => {
		if (a.displayOrder !== b.displayOrder) {
			return b.displayOrder - a.displayOrder;
		}

		return a.id.localeCompare(b.id);
	});
	return r;
});

async function fetchRoles() {
	fetching.value = true;
	const result = await misskeyApi('admin/roles/list', {});
	roles.value = result.filter(it => publicOnly.value ? it.isPublic : true);
	fetching.value = false;
}

async function addRole() {
	const items = roles.value
		.filter(r => r.isPublic)
		.filter(r => !selectedRoleIds.value.includes(r.id))
		.map(r => ({ text: r.name, value: r }));

	const { canceled, result: role } = await os.select({ items });
	if (canceled) {
		return;
	}

	selectedRoleIds.value.push(role.id);
}

async function removeRole(roleId: string) {
	selectedRoleIds.value = selectedRoleIds.value.filter(x => x !== roleId);
}

function onOkClicked() {
	emit('done', selectedRoles.value);
	windowEl.value?.close();
}

function onCancelClicked() {
	emit('close');
	windowEl.value?.close();
}

function onCloseModalWindow() {
	emit('close');
	windowEl.value?.close();
}

fetchRoles();
</script>

<style module lang="scss">
.root {
	max-height: 410px;
	height: 410px;
	display: flex;
	flex-direction: column;
}

.roleItemArea {
	background-color: var(--MI_THEME-acrylicBg);
	border-radius: var(--MI-radius);
	padding: 12px;
	overflow-y: auto;
}

.roleItem {
	display: flex;
}

.role {
	flex: 1;
}

.roleUnAssign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
}

.header {
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.title {
	flex: 1;
}

.addRoleButton {
	min-width: 32px;
	min-height: 32px;
	max-width: 32px;
	max-height: 32px;
	margin-left: 8px;
	align-self: center;
	padding: 0;
}

.buttons {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
	margin-top: auto;
}

.divider {
	border-top: solid 0.5px var(--MI_THEME-divider);
}

</style>
