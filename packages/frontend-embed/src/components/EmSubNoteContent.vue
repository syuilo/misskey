<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.collapsed]: collapsed }]">
	<div>
		<span v-if="note.isHidden" style="opacity: 0.5">({{ i18n.ts.private }})</span>
		<span v-if="note.deletedAt" style="opacity: 0.5">({{ i18n.ts.deletedNote }})</span>
		<EmA v-if="note.replyId" :class="$style.reply" :to="`/notes/${note.replyId}`"><i class="ti ti-arrow-back-up"></i></EmA>
		<EmMfm v-if="note.text" :text="note.text" :author="note.user" :nyaize="'respect'" :emojiUrls="note.emojis"/>
		<EmA v-if="note.renoteId" :class="$style.rp" :to="`/notes/${note.renoteId}`">RN: ...</EmA>
	</div>
	<details v-if="note.files && note.files.length > 0">
		<summary>({{ i18n.tsx.withNFiles({ n: note.files.length }) }})</summary>
		<EmMediaList :mediaList="note.files" :originalEntityUrl="`${url}/notes/${note.id}`"/>
	</details>
	<details v-if="note.poll">
		<summary>{{ i18n.ts.poll }}</summary>
		<EmPoll :noteId="note.id" :poll="note.poll"/>
	</details>
	<button v-if="isLong && collapsed" :class="$style.fade" class="_button" @click="collapsed = false">
		<span :class="$style.fadeLabel">{{ i18n.ts.showMore }}</span>
	</button>
	<button v-else-if="isLong && !collapsed" :class="$style.showLess" class="_button" @click="collapsed = true">
		<span :class="$style.showLessLabel">{{ i18n.ts.showLess }}</span>
	</button>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import EmMediaList from '@/components/EmMediaList.vue';
import EmPoll from '@/components/EmPoll.vue';
import { i18n } from '@/i18n.js';
import { url } from '@@/js/config.js';
import { shouldCollapse } from '@@/js/collapsed.js';
import EmA from '@/components/EmA.vue';
import EmMfm from '@/components/EmMfm.js';

const props = defineProps<{
	note: Misskey.entities.Note;
}>();

const isLong = shouldCollapse(props.note, 13.5);

const collapsed = ref(isLong);
</script>

<style lang="scss" module>
.root {
	overflow-wrap: break-word;

	&.collapsed {
		position: relative;
		max-height: 9em;
		overflow: clip;

		> .fade {
			display: block;
			position: absolute;
			bottom: 0;
			left: 0;
			width: 100%;
			height: 64px;
			background: linear-gradient(0deg, var(--MI_THEME-panel), color(from var(--MI_THEME-panel) srgb r g b / 0));

			> .fadeLabel {
				display: inline-block;
				background: var(--MI_THEME-panel);
				padding: 6px 10px;
				font-size: 0.8em;
				border-radius: 999px;
				box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
			}

			&:hover {
				> .fadeLabel {
					background: var(--MI_THEME-panelHighlight);
				}
			}
		}
	}
}

.reply {
	margin-right: 6px;
	color: var(--MI_THEME-accent);
}

.rp {
	margin-left: 4px;
	font-style: oblique;
	color: var(--MI_THEME-renote);
}

.showLess {
	width: 100%;
	margin-top: 14px;
	position: sticky;
	bottom: calc(var(--stickyBottom, 0px) + 14px);
}

.showLessLabel {
	display: inline-block;
	background: var(--MI_THEME-popup);
	padding: 6px 10px;
	font-size: 0.8em;
	border-radius: 999px;
	box-shadow: 0 2px 6px rgb(0 0 0 / 20%);
}
</style>
