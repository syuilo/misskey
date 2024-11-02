<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => emit('remove')">
	<template #header><i class="ti ti-note"></i> {{ i18n.ts._pages.blocks.note }}</template>

	<section style="padding: 16px;" class="_gaps_s">
		<MkInput v-model="id">
			<template #label>{{ i18n.ts._pages.blocks._note.id }}</template>
			<template #caption>{{ i18n.ts._pages.blocks._note.idDescription }}</template>
		</MkInput>
		<MkSwitch v-model="props.modelValue.detailed"><span>{{ i18n.ts._pages.blocks._note.detailed }}</span></MkSwitch>

		<MkNote v-if="note && !props.modelValue.detailed" :key="note.id + ':normal'" v-model:note="note" style="margin-bottom: 16px;"/>
		<MkNoteDetailed v-if="note && props.modelValue.detailed" :key="note.id + ':detail'" v-model:note="note" style="margin-bottom: 16px;"/>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XContainer from '../page-editor.container.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkNote from '@/components/MkNote.vue';
import MkNoteDetailed from '@/components/MkNoteDetailed.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	modelValue: Misskey.entities.PageBlock & { type: 'note' };
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'note' }): void;
}>();

const id = ref(props.modelValue.note);
const note = ref<Misskey.entities.Note | null>(null);

watch(id, async () => {
	if (id.value && (id.value.startsWith('http://') || id.value.startsWith('https://'))) {
		id.value = (id.value.endsWith('/') ? id.value.slice(0, -1) : id.value).split('/').pop() ?? null;
	}

	if (!id.value) {
		note.value = null;
		return;
	}

	emit('update:modelValue', {
		...props.modelValue,
		note: id.value,
	});
	note.value = await misskeyApi('notes/show', { noteId: id.value });
}, {
	immediate: true,
});
</script>
