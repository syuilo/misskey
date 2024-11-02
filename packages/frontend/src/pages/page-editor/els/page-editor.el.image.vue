<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => emit('remove')">
	<template #header><i class="ti ti-photo"></i> {{ i18n.ts._pages.blocks.image }}</template>
	<template #func>
		<button @click="choose()">
			<i class="ti ti-folder"></i>
		</button>
	</template>

	<section>
		<MkDriveFileThumbnail v-if="file" style="height: 150px;" :file="file" fit="contain" @click="choose()"/>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '../page-editor.container.vue';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	modelValue: Misskey.entities.PageBlock & { type: 'image' };
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'image' }): void;
	(ev: 'remove'): void;
}>();

const file = ref<Misskey.entities.DriveFile | null>(null);

async function choose() {
	os.selectDriveFile(false).then((fileResponse) => {
		file.value = fileResponse[0];
		emit('update:modelValue', {
			...props.modelValue,
			fileId: file.value.id,
		});
	});
}

onMounted(async () => {
	if (props.modelValue.fileId == null) {
		await choose();
	} else {
		misskeyApi('drive/files/show', {
			fileId: props.modelValue.fileId,
		}).then(fileResponse => {
			file.value = fileResponse;
		});
	}
});
</script>
