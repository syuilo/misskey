<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="true"
	@close="windowEl?.close()"
	@closed="emit('closed')"
>
	<template v-if="avatarDecoration" #header>{{ avatarDecoration.name }}</template>
	<template v-else #header>New decoration</template>

	<div style="display: flex; flex-direction: column; min-height: 100%;">
		<MkSpacer :marginMin="20" :marginMax="28" style="flex-grow: 1;">
			<div class="_gaps_m">
				<div :class="$style.preview">
					<div :class="[$style.previewItem, $style.light]">
						<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="url != '' ? [{ url }] : []" forceShowDecoration/>
					</div>
					<div :class="[$style.previewItem, $style.dark]">
						<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="url != '' ? [{ url }] : []" forceShowDecoration/>
					</div>
				</div>
				<MkInput v-model="name">
					<template #label>{{ i18n.ts.name }}</template>
				</MkInput>
				<MkInput v-model="url">
					<template #label>{{ i18n.ts.imageUrl }}</template>
				</MkInput>
				<MkTextarea v-model="description">
					<template #label>{{ i18n.ts.description }}</template>
				</MkTextarea>
				<MkFolder>
					<template #label>{{ i18n.ts.availableRoles }}</template>
					<template #suffix>{{ rolesThatCanBeUsedThisDecoration.length === 0 ? i18n.ts.all : rolesThatCanBeUsedThisDecoration.length }}</template>

					<div class="_gaps">
						<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

						<div v-for="role in rolesThatCanBeUsedThisDecoration" :key="role.id" :class="$style.roleItem">
							<MkRolePreview :class="$style.role" :role="role" :forModeration="true" :detailed="false" style="pointer-events: none;"/>
							<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnassign" @click="removeRole(role, $event)"><i class="ti ti-x"></i></button>
							<button v-else class="_button" :class="$style.roleUnassign" disabled><i class="ti ti-ban"></i></button>
						</div>
					</div>
				</MkFolder>
				<MkButton v-if="avatarDecoration" danger @click="del()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</div>
		</MkSpacer>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.avatarDecoration ? i18n.ts.update : i18n.ts.create }}</MkButton>
		</div>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkWindow from '@/components/MkWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import { signinRequired } from '@/account.js';

const $i = signinRequired();

const props = defineProps<{
	avatarDecoration?: any,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: any; created?: any }): void,
	(ev: 'closed'): void
}>();

const windowEl = ref<InstanceType<typeof MkWindow> | null>(null);
const url = ref<string>(props.avatarDecoration ? props.avatarDecoration.url : '');
const name = ref<string>(props.avatarDecoration ? props.avatarDecoration.name : '');
const description = ref<string>(props.avatarDecoration ? props.avatarDecoration.description : '');
const roleIdsThatCanBeUsedThisDecoration = ref(props.avatarDecoration ? props.avatarDecoration.roleIdsThatCanBeUsedThisDecoration : []);
const rolesThatCanBeUsedThisDecoration = ref<Misskey.entities.Role[]>([]);

watch(roleIdsThatCanBeUsedThisDecoration, async () => {
	rolesThatCanBeUsedThisDecoration.value = (await Promise.all(roleIdsThatCanBeUsedThisDecoration.value.map((id) => misskeyApi('admin/roles/show', { roleId: id }).catch(() => null)))).filter(x => x != null);
}, { immediate: true });

async function addRole() {
	const roles = await misskeyApi('admin/roles/list');
	const currentRoleIds = rolesThatCanBeUsedThisDecoration.value.map(x => x.id);

	const { canceled, result: role } = await os.select({
		items: roles.filter(r => r.isPublic).filter(r => !currentRoleIds.includes(r.id)).map(r => ({ text: r.name, value: r })),
	});
	if (canceled || role == null) return;

	rolesThatCanBeUsedThisDecoration.value.push(role);
}

async function removeRole(role, ev) {
	rolesThatCanBeUsedThisDecoration.value = rolesThatCanBeUsedThisDecoration.value.filter(x => x.id !== role.id);
}

async function done() {
	const params = {
		url: url.value,
		name: name.value,
		description: description.value,
		roleIdsThatCanBeUsedThisDecoration: rolesThatCanBeUsedThisDecoration.value.map(x => x.id),
	};

	if (props.avatarDecoration) {
		await os.apiWithDialog('admin/avatar-decorations/update', {
			id: props.avatarDecoration.id,
			...params,
		});

		emit('done', {
			updated: {
				id: props.avatarDecoration.id,
				...params,
			},
		});

		windowEl.value?.close();
	} else {
		const created = await os.apiWithDialog('admin/avatar-decorations/create', params);

		emit('done', {
			created: created,
		});

		windowEl.value?.close();
	}
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.removeAreYouSure({ x: name.value }),
	});
	if (canceled) return;

	misskeyApi('admin/avatar-decorations/delete', {
		id: props.avatarDecoration.id,
	}).then(() => {
		emit('done', {
			deleted: true,
		});
		windowEl.value?.close();
	});
}
</script>

<style lang="scss" module>
.preview {
	display: grid;
	place-items: center;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	gap: var(--MI-margin);
}

.previewItem {
	width: 100%;
	height: 100%;
	min-height: 160px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--MI-radius);

	&.light {
		background: #eee;
	}

	&.dark {
		background: #222;
	}
}

.roleItem {
	display: flex;
}

.role {
	flex: 1;
}

.roleUnassign {
	width: 32px;
	height: 32px;
	margin-left: 8px;
	align-self: center;
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
</style>
