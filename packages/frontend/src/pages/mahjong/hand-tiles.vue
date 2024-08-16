<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root]">
	<div
		v-for="tile in Mmj.sortTiles(separateLast ? tiles.slice(0, tiles.length - 1) : tiles)"
		:class="[$style.tile, { [$style.tileNonSelectable]: selectableTiles != null && !selectableTiles.includes(mj$type(tile)), [$style.tileDora]: doras.includes(mj$type(tile)) }]"
		@click="chooseTile(tile, $event)"
	>
		<div :class="$style.tileInner">
			<div :class="$style.tileBg1"></div>
			<div :class="$style.tileBg2"></div>
			<div :class="$style.tileBg3"></div>
			<img :src="`/client-assets/mahjong/tiles/${mj$(tile).red ? mj$type(tile) + 'r' : mj$type(tile)}.png`" :class="$style.tileFg1"/>
			<div :class="$style.tileFg2"></div>
		</div>
	</div>
	<div
		v-if="separateLast"
		style="display: inline-block; margin-left: 5px;"
		:class="[$style.tile, { [$style.tileNonSelectable]: selectableTiles != null && !selectableTiles.includes(mj$type(tiles.at(-1))), [$style.tileDora]: doras.includes(mj$type(tiles.at(-1))) }]"
		@click="chooseTile(tiles.at(-1), $event)"
	>
		<div :class="$style.tileInner">
			<div :class="$style.tileBg1"></div>
			<div :class="$style.tileBg2"></div>
			<div :class="$style.tileBg3"></div>
			<img :src="`/client-assets/mahjong/tiles/${mj$(tiles.at(-1)).red ? mj$type(tiles.at(-1)) + 'r' : mj$type(tiles.at(-1))}.png`" :class="$style.tileFg1"/>
			<div :class="$style.tileFg2"></div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Mmj from 'misskey-mahjong';

//#region syntax suger
function mj$(tid: Mmj.TileId): Mmj.TileInstance {
	return Mmj.findTileByIdOrFail(tid);
}

function mj$type(tid: Mmj.TileId): Mmj.TileType {
	return mj$(tid).t;
}
//#endregion

const props = defineProps<{
	tiles: Mmj.TileId[];
	doras: Mmj.TileType[];
	selectableTiles: Mmj.TileType[] | null;
	separateLast: boolean;
}>();

const emit = defineEmits<{
	(event: 'choose', tile: Mmj.TileId): void;
}>();

function chooseTile(tile: Mmj.TileId, event: MouseEvent) {
	if (props.selectableTiles != null && !props.selectableTiles.includes(mj$type(tile))) return;
	emit('choose', tile);
}
</script>

<style lang="scss" module>
@keyframes shine {
	0% { translate: -20%; }
	100% { translate: -70%; }
}

.root {

}

.tile {
	display: inline-block;
	vertical-align: bottom;
	position: relative;
	width: 35px;
	aspect-ratio: 0.7;
	cursor: pointer;
}
.tileInner {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: clip;
	border-radius: 4px;
	transition: translate 0.1s ease;
}
.tile:hover > .tileInner {
	translate: 0 -10px;
}
.tileNonSelectable {
	filter: grayscale(1);
	opacity: 0.7;
	pointer-events: none;
}

.tileDora > .tileInner {
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
}

.tileBg1 {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	user-select: none;
	background: #E38A45;
}
.tileBg2 {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 95%;
	pointer-events: none;
	user-select: none;
	background: #DFDEDD;
	border-radius: 3px 3px 0 0;

	&:after {
		content: "";
		display: block;
		position: absolute;
		bottom: 78%;
		left: 0;
		width: 100%;
		height: 6%;
		pointer-events: none;
		user-select: none;
		background: linear-gradient(0deg, #fff 0%, #fff0 100%);
	}
}
.tileBg3 {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 75%;
	pointer-events: none;
	user-select: none;
	background: #fff;
}
.tileFg1 {
	position: absolute;
	bottom: 5%;
	left: 0;
	width: 100%;
	height: 65%;
	object-fit: contain;
	pointer-events: none;
	user-select: none;
}
.tileFg2 {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 100%;
	height: 100%;
	box-shadow: 0 0 1px #000 inset;
	pointer-events: none;
	user-select: none;
}
</style>
