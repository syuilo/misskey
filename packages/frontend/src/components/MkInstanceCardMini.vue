<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { yellow: instance.isNotResponding, red: instance.isBlocked, gray: instance.isSuspended }]">
	<img class="icon" :src="getInstanceIcon(instance)" alt="" loading="lazy"/>
	<div class="body">
		<span class="host">{{ instance.name ?? instance.host }}</span>
		<span class="sub _monospace"><b>{{ instance.host }}</b> / {{ instance.softwareName || '?' }} {{ instance.softwareVersion }}</span>
	</div>
	<MkMiniChart v-if="chartValues" class="chart" :src="chartValues"/>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import * as misskey from 'misskey-js';
import MkMiniChart from '@/components/MkMiniChart.vue';
import * as os from '@/os';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy';

const props = defineProps<{
	instance: misskey.entities.Instance;
}>();

let chartValues = $ref<number[] | null>(null);

os.apiGet('charts/instance', { host: props.instance.host, limit: 16 + 1, span: 'day' }).then(res => {
	// 今日のぶんの値はまだ途中の値であり、それも含めると大抵の場合前日よりも下降しているようなグラフになってしまうため今日は弾く
	res.requests.received.splice(0, 1);
	chartValues = res.requests.received;
});

function getInstanceIcon(instance): string {
	return getProxiedImageUrlNullable(instance.iconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? '/client-assets/dummy.png';
}
</script>

<style lang="scss" module>
.root {
	$bodyTitleHieght: 18px;
	$bodyInfoHieght: 16px;

	display: flex;
	align-items: center;
	padding: 16px;
	background: var(--panel);
	border-radius: 8px;

	> :global(.icon) {
		display: block;
		width: ($bodyTitleHieght + $bodyInfoHieght);
		height: ($bodyTitleHieght + $bodyInfoHieght);
		object-fit: cover;
		border-radius: 4px;
		margin-right: 10px;
	}

	> :global(.body) {
		flex: 1;
		overflow: hidden;
		font-size: 0.9em;
		color: var(--fg);
		padding-right: 8px;

		> :global(.host) {
			display: block;
			width: 100%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: $bodyTitleHieght;
		}

		> :global(.sub) {
			display: block;
			width: 100%;
			font-size: 80%;
			opacity: 0.7;
			line-height: $bodyInfoHieght;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	> :global(.chart) {
		height: 30px;
	}

	&:global(.yellow) {
		--c: rgb(255 196 0 / 15%);
		background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
		background-size: 16px 16px;
	}

	&:global(.red) {
		--c: rgb(255 0 0 / 15%);
		background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
		background-size: 16px 16px;
	}

	&:global(.gray) {
		--c: var(--bg);
		background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
		background-size: 16px 16px;
	}
}
</style>
