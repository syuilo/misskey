<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	@close="dialog.close()"
	@closed="$emit('closed')"
>
	<template v-if="emoji" #header>:{{ emoji.name }}:</template>
	<template v-else #header>New emoji</template>

	<div>
		<MkSpacer :marginMin="20" :marginMax="28">
			<div class="_gaps_m">
				<div v-if="imgUrl != null" :class="$style.imgs">
					<div style="background: #000;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #222;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #ddd;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
					<div style="background: #fff;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img"/>
					</div>
				</div>
				<MkButton rounded style="margin: 0 auto;" @click="changeImage">{{ i18n.ts.selectFile }}</MkButton>
				<MkInput v-model="name" pattern="[a-z0-9_]">
					<template #label>{{ i18n.ts.name }}</template>
				</MkInput>
				<MkInput v-model="category" :datalist="customEmojiCategories">
					<template #label>{{ i18n.ts.category }}</template>
				</MkInput>
				<MkInput v-model="aliases">
					<template #label>{{ i18n.ts.tags }}</template>
					<template #caption>{{ i18n.ts.setMultipleBySeparatingWithSpace }}</template>
				</MkInput>
				<MkInput v-model="license">
					<template #label>{{ i18n.ts.license }}</template>
				</MkInput>
				<MkFolder>
					<template #label>{{ i18n.ts.rolesThatCanBeUsedThisEmojiAsReaction }}</template>
					<template #suffix>{{ rolesThatCanBeUsedThisEmojiAsReaction.length === 0 ? i18n.ts.all : rolesThatCanBeUsedThisEmojiAsReaction.length }}</template>

					<div class="_gaps">
						<MkButton rounded @click="addRole"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>

						<div v-for="role in rolesThatCanBeUsedThisEmojiAsReaction" :key="role.id" :class="$style.roleItem">
							<MkRolePreview :class="$style.role" :role="role" :forModeration="true" :detailed="false" style="pointer-events: none;"/>
							<button v-if="role.target === 'manual'" class="_button" :class="$style.roleUnassign" @click="removeRole(role, $event)"><i class="ti ti-x"></i></button>
							<button v-else class="_button" :class="$style.roleUnassign" disabled><i class="ti ti-ban"></i></button>
						</div>

						<MkInfo>{{ i18n.ts.rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription }}</MkInfo>
						<MkInfo warn>{{ i18n.ts.rolesThatCanBeUsedThisEmojiAsReactionPublicRoleWarn }}</MkInfo>
					</div>
				</MkFolder>
				<MkSwitch v-model="isSensitive">isSensitive</MkSwitch>
				<MkSwitch v-model="localOnly">{{ i18n.ts.localOnly }}</MkSwitch>
				<MkButton danger @click="del()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</div>
		</MkSpacer>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.emoji ? i18n.ts.update : i18n.ts.create }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, watch } from 'vue';
import * as misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { customEmojiCategories } from '@/custom-emojis';
import MkSwitch from '@/components/MkSwitch.vue';
import { selectFile, selectFiles } from '@/scripts/select-file';
import MkRolePreview from '@/components/MkRolePreview.vue';

const props = defineProps<{
	emoji?: any,
}>();

let dialog = $ref(null);
let name: string = $ref(props.emoji ? props.emoji.name : '');
let category: string = $ref(props.emoji ? props.emoji.category : '');
let aliases: string = $ref(props.emoji ? props.emoji.aliases.join(' ') : '');
let license: string = $ref(props.emoji ? (props.emoji.license ?? '') : '');
let isSensitive = $ref(props.emoji ? props.emoji.isSensitive : false);
let localOnly = $ref(props.emoji ? props.emoji.localOnly : false);
let roleIdsThatCanBeUsedThisEmojiAsReaction = $ref(props.emoji ? props.emoji.roleIdsThatCanBeUsedThisEmojiAsReaction : []);
let rolesThatCanBeUsedThisEmojiAsReaction = $ref([]);
let file = $ref<misskey.entities.DriveFile>();

watch($$(roleIdsThatCanBeUsedThisEmojiAsReaction), async () => {
	rolesThatCanBeUsedThisEmojiAsReaction = (await Promise.all(roleIdsThatCanBeUsedThisEmojiAsReaction.map((id) => os.api('admin/roles/show', { roleId: id }).catch(() => null)))).filter(x => x != null);
}, { immediate: true });

const imgUrl = computed(() => file ? file.url : props.emoji ? `/emoji/${props.emoji.name}.webp` : null);

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: any; created?: any }): void,
	(ev: 'closed'): void
}>();

async function changeImage(ev) {
	file = await selectFile(ev.currentTarget ?? ev.target, null);
	const candidate = file.name.replace(/\.(.+)$/, '');
	if (candidate.match(/^[a-z0-9_]+$/)) {
		name = candidate;
	}
}

async function addRole() {
	const roles = await os.api('admin/roles/list');
	const currentRoleIds = rolesThatCanBeUsedThisEmojiAsReaction.map(x => x.id);

	const { canceled, result: role } = await os.select({
		items: roles.filter(r => r.isPublic).filter(r => !currentRoleIds.includes(r.id)).map(r => ({ text: r.name, value: r })),
	});
	if (canceled) return;

	rolesThatCanBeUsedThisEmojiAsReaction.push(role);
}

async function removeRole(role, ev) {
	rolesThatCanBeUsedThisEmojiAsReaction = rolesThatCanBeUsedThisEmojiAsReaction.filter(x => x.id !== role.id);
}

async function done() {
	const params = {
		name,
		category: category === '' ? null : category,
		aliases: aliases.split(' ').filter(x => x !== ''),
		license: license === '' ? null : license,
		isSensitive,
		localOnly,
		roleIdsThatCanBeUsedThisEmojiAsReaction: rolesThatCanBeUsedThisEmojiAsReaction.map(x => x.id),
	};

	if (file) {
		params.fileId = file.id;
	}

	if (props.emoji) {
		await os.apiWithDialog('admin/emoji/update', {
			id: props.emoji.id,
			...params,
		});

		emit('done', {
			updated: {
				id: props.emoji.id,
				...params,
			},
		});

		dialog.close();
	} else {
		const created = await os.apiWithDialog('admin/emoji/add', params);

		emit('done', {
			created: created,
		});

		dialog.close();
	}
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: name }),
	});
	if (canceled) return;

	os.api('admin/emoji/delete', {
		id: props.emoji.id,
	}).then(() => {
		emit('done', {
			deleted: true,
		});
		dialog.close();
	});
}
</script>

<style lang="scss" module>
.imgs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}

.imgContainer {
	padding: 8px;
	border-radius: 6px;
}

.img {
	display: block;
	height: 64px;
	width: 64px;
	object-fit: contain;
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
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--divider);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
