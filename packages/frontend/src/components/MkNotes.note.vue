<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div>
		<KeepAlive :max="2">
			<XEmpty v-if="skipRendering" :height="height" />
			<MkNote
				v-else
				ref="noteComponent"
				:note="note"
				:pinned="pinned"
				:mock="mock"
				:withHardMute="withHardMute"
				@mounted="onNoteMounted"
			/>
		</KeepAlive>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { defaultStore } from '@/store.js';
import MkNote from '@/components/MkNote.vue';
import XEmpty from '@/components/MkNotes.note.empty.vue';

const props = withDefaults(defineProps<{
	note: Misskey.entities.Note;
	pinned?: boolean;
	mock?: boolean;
	withHardMute?: boolean;

	visible?: boolean;
}>(), {
	visible: true,
});

const height = ref<number>(150);
const heightResolved = ref(false);
const skipRendering = computed(() => defaultStore.state.skipNoteRender === 'js' && !props.visible && heightResolved.value);
let observer: ResizeObserver | null = null;

function onNoteMounted(el: HTMLElement) {
	if (defaultStore.state.skipNoteRender !== 'js') return;

	height.value = el.getBoundingClientRect().height ?? 150;
	heightResolved.value = true;

	watch(() => props.visible, (to) => {
		if (to) {
			heightResolved.value = false;
			height.value = el.getBoundingClientRect().height ?? 150;
			heightResolved.value = true;
			observer = new ResizeObserver(() => {
				height.value = el.getBoundingClientRect().height ?? 150;
			});
			observer.observe(el!);
		} else {
			observer?.disconnect();
		}
	}, { flush: 'post', immediate: true });
}
</script>
