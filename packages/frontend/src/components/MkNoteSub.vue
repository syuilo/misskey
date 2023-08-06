<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.children]: depth > 1 }]">
	<div :class="$style.main">
		<div v-if="note.channel" :class="$style.colorBar" :style="{ background: note.channel.color }"></div>
		<MkAvatar :class="$style.avatar" :user="note.user" link preview/>
		<div :class="$style.body">
			<MkNoteHeader :class="$style.header" :note="note" :mini="true"/>
			<div>
				<p v-if="note.cw != null" :class="$style.cw">
					<Mfm v-if="note.cw != ''" style="margin-right: 8px;" :text="note.cw" :author="note.user" :i="$i"/>
					<MkCwButton v-model="showContent" :note="note"/>
				</p>
				<div v-show="note.cw == null || showContent">
					<MkSubNoteContent :class="$style.text" :note="note"/>
				</div>
			</div>
		</div>
	</div>
	<template v-if="depth < 5">
		<MkNoteSub v-for="reply in replies" :key="reply.id" :note="reply" :class="$style.reply" :detail="true" :depth="depth + 1"/>
	</template>
	<div v-else :class="$style.more">
		<MkA class="_link" :to="notePage(note)">{{ i18n.ts.continueThread }} <i class="ti ti-chevron-double-right"></i></MkA>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkNoteHeader from '@/components/MkNoteHeader.vue';
import MkSubNoteContent from '@/components/MkSubNoteContent.vue';
import MkCwButton from '@/components/MkCwButton.vue';
import { notePage } from '@/filters/note';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { $i } from '@/account';

const props = withDefaults(defineProps<{
	note: misskey.entities.Note;
	detail?: boolean;

	// how many notes are in between this one and the note being viewed in detail
	depth?: number;
}>(), {
	depth: 1,
});

let showContent = $ref(false);
let replies: misskey.entities.Note[] = $ref([]);

if (props.detail) {
	os.api('notes/children', {
		noteId: props.note.id,
		limit: 5,
	}).then(res => {
		replies = res;
	});
}
</script>

<style lang="scss" module>
.root {
	padding: 16px 32px;
	font-size: 0.9em;
	position: relative;

	&.children {
		padding: 10px 0 0 16px;
		font-size: 1em;
	}
}

.main {
	display: flex;
}

.colorBar {
	position: absolute;
	top: 8px;
	left: 8px;
	width: 5px;
	height: calc(100% - 8px);
	border-radius: 999px;
	pointer-events: none;
}

.avatar {
	flex-shrink: 0;
	display: block;
	margin: 0 8px 0 0;
	width: 38px;
	height: 38px;
	border-radius: 8px;
}

.body {
	flex: 1;
	min-width: 0;
}

.header {
	margin-bottom: 2px;
}

.cw {
	cursor: default;
	display: block;
	margin: 0;
	padding: 0;
	overflow-wrap: break-word;
}

.text {
	margin: 0;
	padding: 0;
}

.reply, .more {
	border-left: solid 0.5px var(--divider);
	margin-top: 10px;
}

.more {
	padding: 10px 0 0 16px;
}

@container (max-width: 450px) {
	.root {
		padding: 14px 16px;

		&.children {
			padding: 10px 0 0 8px;
		}
	}
}
</style>
