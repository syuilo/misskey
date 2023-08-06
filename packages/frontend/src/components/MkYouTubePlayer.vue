<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow :initialWidth="640" :initialHeight="402" :canResize="true" :closeButton="true">
	<template #header>
		<i class="icon ti ti-brand-youtube" style="margin-right: 0.5em;"></i>
		<span>{{ title ?? 'YouTube' }}</span>
	</template>

	<div class="poamfof">
		<Transition :name="defaultStore.state.animation ? 'fade' : ''" mode="out-in">
			<div v-if="player.url && (player.url.startsWith('http://') || player.url.startsWith('https://'))" class="player">
				<iframe v-if="!fetching" :src="player.url + (player.url.match(/\?/) ? '&autoplay=1&auto_play=1' : '?autoplay=1&auto_play=1')" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen/>
			</div>
			<span v-else>invalid url</span>
		</Transition>
		<MkLoading v-if="fetching"/>
		<MkError v-else-if="!player.url" @retry="ytFetch()"/>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
// @ts-nocheck
import MkWindow from '@/components/MkWindow.vue';
import { versatileLang } from '@/scripts/intl-const';
import { defaultStore } from '@/store';

const props = defineProps<{
	url: string;
}>();

const requestUrl = new URL(props.url);
if (!['http:', 'https:'].includes(requestUrl.protocol)) throw new Error('invalid url');

let fetching = $ref(true);
let title = $ref<string | null>(null);
let player = $ref({
	url: null,
	width: null,
	height: null,
});

const ytFetch = (): void => {
	fetching = true;
	window.fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${versatileLang}`).then(res => {
		res.json().then(info => {
			if (info.url == null) return;
			title = info.title;
			fetching = false;
			player = info.player;
		});
	});
};

ytFetch();

</script>

<style lang="scss">
.poamfof {
	position: relative;
	overflow: hidden;
	height: 100%;

	.player {
		position: absolute;
		inset: 0;

		iframe {
			width: 100%;
			height: 100%;
		}
	}
}
</style>
