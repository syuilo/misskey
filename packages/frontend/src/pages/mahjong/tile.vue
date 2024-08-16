<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.h]: ['3', '4', '5'].includes(variation), [$style.v]: ['1', '2'].includes(variation), [$style.isDora]: isDora }]">
	<img :src="`/client-assets/mahjong/putted-tile-${variation}.png`" :class="$style.bg"/>
	<img :src="`/client-assets/mahjong/tiles/${tile.red ? tile.t + 'r' : tile.t}.png`" :class="$style.fg"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Mmj from 'misskey-mahjong';

const props = defineProps<{
	tile: Mmj.TileInstance;
	variation: string;
	doras: Mmj.TileType[];
}>();

const isDora = computed(() => props.doras.includes(props.tile.t));
</script>

<style lang="scss" module>
@keyframes shine {
	0% { translate: -30px; }
	100% { translate: -130px; }
}

.root {
	display: inline-block;
	position: relative;
	width: 72px;
	height: 72px;
	margin: -17px;
}
.h {
	margin: -14px -19px -5px;
}
.v {
	margin: -14px -18px -11px;
}
.bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
}
.fg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	margin: auto;
	width: 53%;
	height: 53%;
	object-fit: contain;
}
/*
.isDora {
	&:after {
		content: "";
		display: block;
		position: absolute;
		top: 30px;
		width: 200px;
		height: 8px;
		rotate: -45deg;
		translate: -30px;
		background: #ffffffee;
		animation: shine 2s infinite;
		pointer-events: none;
	}
}*/
</style>
