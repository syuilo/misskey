<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	@close="dialog?.close()"
	@closed="emit('closed')"
>
	<template v-if="announcement" #header>:{{ announcement.title }}:</template>
	<template v-else #header>New announcement</template>

	<div>
		<MkSpacer :marginMin="20" :marginMax="28">
			<div class="_gaps_m">
				<MkInput v-model="title">
					<template #label>{{ i18n.ts.title }}</template>
				</MkInput>
				<MkTextarea v-model="text">
					<template #label>{{ i18n.ts.text }}</template>
				</MkTextarea>
				<MkRadios v-model="icon">
					<template #label>{{ i18n.ts.icon }}</template>
					<option value="info"><i class="ti ti-info-circle"></i></option>
					<option value="warning"><i class="ti ti-alert-triangle" style="color: var(--MI_THEME-warn);"></i></option>
					<option value="error"><i class="ti ti-circle-x" style="color: var(--MI_THEME-error);"></i></option>
					<option value="success"><i class="ti ti-check" style="color: var(--MI_THEME-success);"></i></option>
				</MkRadios>
				<MkRadios v-model="display">
					<template #label>{{ i18n.ts.display }}</template>
					<option value="normal">{{ i18n.ts.normal }}</option>
					<option value="banner">{{ i18n.ts.banner }}</option>
					<option value="dialog">{{ i18n.ts.dialog }}</option>
				</MkRadios>
				<MkSwitch v-model="needConfirmationToRead">
					{{ i18n.ts._announcement.needConfirmationToRead }}
					<template #caption>{{ i18n.ts._announcement.needConfirmationToReadDescription }}</template>
				</MkSwitch>
				<MkButton v-if="announcement" danger @click="del()"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</div>
		</MkSpacer>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done"><i class="ti ti-check"></i> {{ props.announcement ? i18n.ts.update : i18n.ts.create }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkRadios from '@/components/MkRadios.vue';

type AdminAnnouncementType = Misskey.entities.AdminAnnouncementsCreateRequest & { id: string; }

const props = defineProps<{
	user: Misskey.entities.User,
	announcement?: Required<AdminAnnouncementType>,
}>();

const emit = defineEmits<{
	(ev: 'done', v: { deleted?: boolean; updated?: AdminAnnouncementType; created?: AdminAnnouncementType; }): void,
	(ev: 'closed'): void
}>();

const dialog = ref<InstanceType<typeof MkModalWindow> | null>(null);
const title = ref(props.announcement ? props.announcement.title : '');
const text = ref(props.announcement ? props.announcement.text : '');
const icon = ref(props.announcement ? props.announcement.icon : 'info');
const display = ref(props.announcement ? props.announcement.display : 'dialog');
const needConfirmationToRead = ref(props.announcement ? props.announcement.needConfirmationToRead : false);

async function done() {
	const params = {
		title: title.value,
		text: text.value,
		icon: icon.value,
		imageUrl: null,
		display: display.value,
		needConfirmationToRead: needConfirmationToRead.value,
		userId: props.user.id,
	} satisfies Misskey.entities.AdminAnnouncementsCreateRequest;

	if (props.announcement) {
		await os.apiWithDialog('admin/announcements/update', {
			...params,
			id: props.announcement.id,
		});

		emit('done', {
			updated: {
				...params,
				id: props.announcement.id,
			},
		});

		dialog.value?.close();
	} else {
		const created = await os.apiWithDialog('admin/announcements/create', params);

		emit('done', {
			created: created,
		});

		dialog.value?.close();
	}
}

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.removeAreYouSure({ x: title.value }),
	});
	if (canceled) return;

	if (props.announcement) {
		await misskeyApi('admin/announcements/delete', {
			id: props.announcement.id,
		});
	}

	emit('done', {
		deleted: true,
	});
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.footer {
	position: sticky;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>
