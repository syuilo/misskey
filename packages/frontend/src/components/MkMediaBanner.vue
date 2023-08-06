<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div v-if="media.isSensitive && hide" :class="$style.sensitive" @click="hide = false">
		<span style="font-size: 1.6em;"><i class="ti ti-alert-triangle"></i></span>
		<b>{{ i18n.ts.sensitive }}</b>
		<span>{{ i18n.ts.clickToShow }}</span>
	</div>
	<div v-else-if="media.type.startsWith('audio') && media.type !== 'audio/midi'" :class="$style.audio">
		<audio
			ref="audioEl"
			:src="media.url"
			:title="media.name"
			controls
			preload="metadata"
			@volumechange="volumechange"
		/>
	</div>
	<a
		v-else :class="$style.download"
		:href="media.url"
		:title="media.name"
		:download="media.name"
	>
		<span style="font-size: 1.6em;"><i class="ti ti-download"></i></span>
		<b>{{ media.name }}</b>
	</a>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted } from 'vue';
import * as misskey from 'misskey-js';
import { soundConfigStore } from '@/scripts/sound';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	media: misskey.entities.DriveFile;
}>(), {
});

const audioEl = $shallowRef<HTMLAudioElement | null>();
let hide = $ref(true);

function volumechange() {
	if (audioEl) soundConfigStore.set('mediaVolume', audioEl.volume);
}

onMounted(() => {
	if (audioEl) audioEl.volume = soundConfigStore.state.mediaVolume;
});
</script>

<style lang="scss" module>
.root {
	width: 100%;
	border-radius: 4px;
	margin-top: 4px;
	overflow: clip;
}

.download,
.sensitive {
	display: flex;
	align-items: center;
	font-size: 12px;
	padding: 8px 12px;
	white-space: nowrap;
}

.download {
	background: var(--noteAttachedFile);
}

.sensitive {
	background: #111;
	color: #fff;
}

.audio {
	border-radius: 8px;
	overflow: clip;
}
</style>
