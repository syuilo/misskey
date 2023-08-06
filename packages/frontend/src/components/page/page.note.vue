<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div style="margin: 1em 0;">
	<MkNote v-if="note && !block.detailed" :key="note.id + ':normal'" v-model:note="note"/>
	<MkNoteDetailed v-if="note && block.detailed" :key="note.id + ':detail'" v-model:note="note"/>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, Ref, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { NoteBlock } from './block.type';
import MkNote from '@/components/MkNote.vue';
import MkNoteDetailed from '@/components/MkNoteDetailed.vue';
import * as os from '@/os';

const props = defineProps<{
	block: NoteBlock,
	page: Misskey.entities.Page,
}>();

const note: Ref<Misskey.entities.Note | null> = ref(null);

onMounted(() => {
	os.api('notes/show', { noteId: props.block.note })
		.then(result => {
			note.value = result;
		});
});
</script>
