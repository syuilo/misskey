<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-panel
	:class="[$style.root, {
		[$style.sensitiveHighlight]: highlightWhenSensitive && file.isSensitive,
		[$style.large]: large,
	}]"
>
	<ImgWithBlurhash
		v-if="isThumbnailAvailable"
		:hash="file.blurhash"
		:src="file.thumbnailUrl"
		:alt="file.name"
		:title="file.name"
		:cover="fit !== 'contain'"
		:forceBlurhash="forceBlurhash"
	/>
	<i v-else-if="is === 'image'" class="ti ti-photo" :class="$style.icon"></i>
	<i v-else-if="is === 'video'" class="ti ti-video" :class="$style.icon"></i>
	<i v-else-if="is === 'audio' || is === 'midi'" class="ti ti-file-music" :class="$style.icon"></i>
	<i v-else-if="is === 'csv'" class="ti ti-file-text" :class="$style.icon"></i>
	<i v-else-if="is === 'pdf'" class="ti ti-file-text" :class="$style.icon"></i>
	<i v-else-if="is === 'textfile'" class="ti ti-file-text" :class="$style.icon"></i>
	<i v-else-if="is === 'archive'" class="ti ti-file-zip" :class="$style.icon"></i>
	<i v-else class="ti ti-file" :class="$style.icon"></i>

	<i v-if="isThumbnailAvailable && is === 'video'" class="ti ti-video" :class="$style.iconSub"></i>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';

const props = defineProps<{
	file: Misskey.entities.DriveFile;
	fit: 'cover' | 'contain';
	highlightWhenSensitive?: boolean;
	forceBlurhash?: boolean;
	large?: boolean;
}>();

const is = computed(() => {
	if (props.file.type.startsWith('image/')) return 'image';
	if (props.file.type.startsWith('video/')) return 'video';
	if (props.file.type === 'audio/midi') return 'midi';
	if (props.file.type.startsWith('audio/')) return 'audio';
	if (props.file.type.endsWith('/csv')) return 'csv';
	if (props.file.type.endsWith('/pdf')) return 'pdf';
	if (props.file.type.startsWith('text/')) return 'textfile';
	if ([
		'application/zip',
		'application/x-cpio',
		'application/x-bzip',
		'application/x-bzip2',
		'application/java-archive',
		'application/x-rar-compressed',
		'application/x-tar',
		'application/gzip',
		'application/x-7z-compressed',
	].some(archiveType => archiveType === props.file.type)) return 'archive';
	return 'unknown';
});

const isThumbnailAvailable = computed(() => {
	return props.file.thumbnailUrl
		? (is.value === 'image' || is.value === 'video')
		: false;
});
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;
	background: var(--MI_THEME-panel);
	border-radius: 8px;
	overflow: clip;
}

.sensitiveHighlight::after {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	border-radius: inherit;
	box-shadow: inset 0 0 0 4px var(--MI_THEME-warn);
}

.iconSub {
	position: absolute;
	width: 30%;
	height: auto;
	margin: 0;
	right: 4%;
	bottom: 4%;
}

.icon {
	pointer-events: none;
	margin: auto;
	font-size: 32px;
	color: #777;
}

.large .icon {
	font-size: 40px;
}
</style>
