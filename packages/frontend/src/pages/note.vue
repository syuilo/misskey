<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div>
			<Transition :name="defaultStore.state.animation ? 'fade' : ''" mode="out-in">
				<div v-if="note">
					<div v-if="showNext" class="_margin">
						<MkNotes class="" :pagination="nextPagination" :noGap="true"/>
					</div>

					<div class="_margin">
						<MkButton v-if="!showNext && hasNext" :class="$style.loadNext" @click="showNext = true"><i class="ti ti-chevron-up"></i></MkButton>
						<div class="_margin _gaps_s">
							<MkRemoteCaution v-if="note.user.host != null" :href="note.url ?? note.uri"/>
							<MkNoteDetailed :key="note.id" v-model:note="note" :class="$style.note"/>
						</div>
						<div v-if="clips && clips.length > 0" class="_margin">
							<div style="font-weight: bold; padding: 12px;">{{ i18n.ts.clip }}</div>
							<div class="_gaps">
								<MkA v-for="item in clips" :key="item.id" :to="`/clips/${item.id}`">
									<MkClipPreview :clip="item"/>
								</MkA>
							</div>
						</div>
						<MkButton v-if="!showPrev && hasPrev" :class="$style.loadPrev" @click="showPrev = true"><i class="ti ti-chevron-down"></i></MkButton>
					</div>

					<div v-if="showPrev" class="_margin">
						<MkNotes class="" :pagination="prevPagination" :noGap="true"/>
					</div>
				</div>
				<MkError v-else-if="error" @retry="fetchNote()"/>
				<MkLoading v-else/>
			</Transition>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, watch } from 'vue';
import * as misskey from 'misskey-js';
import MkNoteDetailed from '@/components/MkNoteDetailed.vue';
import MkNotes from '@/components/MkNotes.vue';
import MkRemoteCaution from '@/components/MkRemoteCaution.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';
import { dateString } from '@/filters/date';
import MkClipPreview from '@/components/MkClipPreview.vue';
import { defaultStore } from '@/store';

const props = defineProps<{
	noteId: string;
}>();

let note = $ref<null | misskey.entities.Note>();
let clips = $ref();
let hasPrev = $ref(false);
let hasNext = $ref(false);
let showPrev = $ref(false);
let showNext = $ref(false);
let error = $ref();

const prevPagination = {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => note ? ({
		userId: note.userId,
		untilId: note.id,
	}) : null),
};

const nextPagination = {
	reversed: true,
	endpoint: 'users/notes' as const,
	limit: 10,
	params: computed(() => note ? ({
		userId: note.userId,
		sinceId: note.id,
	}) : null),
};

function fetchNote() {
	hasPrev = false;
	hasNext = false;
	showPrev = false;
	showNext = false;
	note = null;
	os.api('notes/show', {
		noteId: props.noteId,
	}).then(res => {
		note = res;
		Promise.all([
			os.api('notes/clips', {
				noteId: note.id,
			}),
			os.api('users/notes', {
				userId: note.userId,
				untilId: note.id,
				limit: 1,
			}),
			os.api('users/notes', {
				userId: note.userId,
				sinceId: note.id,
				limit: 1,
			}),
		]).then(([_clips, prev, next]) => {
			clips = _clips;
			hasPrev = prev.length !== 0;
			hasNext = next.length !== 0;
		});
	}).catch(err => {
		error = err;
	});
}

watch(() => props.noteId, fetchNote, {
	immediate: true,
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => note ? {
	title: i18n.ts.note,
	subtitle: dateString(note.createdAt),
	avatar: note.user,
	path: `/notes/${note.id}`,
	share: {
		title: i18n.t('noteOf', { user: note.user.name }),
		text: note.text,
	},
} : null));
</script>

<style lang="scss" module>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.loadNext,
.loadPrev {
	min-width: 0;
	margin: 0 auto;
	border-radius: 999px;
}

.loadNext {
	margin-bottom: var(--margin);
}

.loadPrev {
	margin-top: var(--margin);
}

.note {
	border-radius: var(--radius);
	background: var(--panel);
}
</style>
