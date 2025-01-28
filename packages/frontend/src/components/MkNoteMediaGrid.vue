<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<template v-for="file in note.files">
	<div
		v-if="(defaultStore.state.nsfw === 'force' || file.isSensitive) && defaultStore.state.nsfw !== 'ignore' && !showingFiles.has(file.id)"
		:class="[$style.filePreview, { [$style.square]: square }]"
		@click="showingFiles.add(file.id)"
	>
		<MkDriveFileThumbnail
			:file="file"
			fit="cover"
			:highlightWhenSensitive="defaultStore.state.highlightSensitiveMedia"
			:forceBlurhash="true"
			:large="true"
			:class="$style.file"
		/>
		<div :class="$style.sensitive">
			<div>
				<div><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}</div>
				<div>{{ i18n.ts.clickToShow }}</div>
			</div>
		</div>
	</div>
	<MkA v-else :class="[$style.filePreview, { [$style.square]: square }]" :to="notePage(note)">
		<MkDriveFileThumbnail
			:file="file"
			fit="cover"
			:highlightWhenSensitive="defaultStore.state.highlightSensitiveMedia"
			:large="true"
			:class="$style.file"
		/>
	</MkA>
</template>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { notePage } from '@/filters/note.js';
import { i18n } from '@/i18n.js';
import * as Misskey from 'misskey-js';
import { defaultStore } from '@/store.js';

import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';

defineProps<{
	note: Misskey.entities.Note;
	square?: boolean;
}>();

const showingFiles = ref<Set<string>>(new Set());
</script>

<style lang="scss" module>
.square {
	width: 100%;
	height: auto;
	aspect-ratio: 1;
}

.filePreview {
	position: relative;
	height: 128px;
	border-radius: calc(var(--MI-radius) / 2);
	overflow: clip;

	&:hover {
		text-decoration: none;
	}

	&.square {
		height: 100%;
	}
}

.file {
	width: 100%;
	height: 100%;
	border-radius: calc(var(--MI-radius) / 2);
}

.sensitive {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
  place-items: center;
	font-size: 0.8em;
	color: #fff;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(5px);
	cursor: pointer;
}
</style>
