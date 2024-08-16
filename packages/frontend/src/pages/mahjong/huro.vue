<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="huro.type === 'ankan'" :class="[$style.root]">
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[0])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[1])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[2])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[3])" :variation="variation" :doras="doras"/>
</div>
<div v-else-if="huro.type === 'minkan'" :class="[$style.root]">
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[0])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[1])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[2])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[3])" :variation="variation" :doras="doras"/>
</div>
<div v-else-if="huro.type === 'cii'" :class="[$style.root]">
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[0])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[1])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[2])" :variation="variation" :doras="doras"/>
</div>
<div v-else :class="[$style.root]">
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[0])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[1])" :variation="variation" :doras="doras"/>
	<XTile :tile="Mmj.findTileByIdOrFail(huro.tiles[2])" :variation="variation" :doras="doras"/>
</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Mmj from 'misskey-mahjong';
import XTile from './tile.vue';

const props = defineProps<{
	huro: Mmj.Huro;
	variation: string;
	doras: Mmj.TileType[];
}>();
</script>

<style lang="scss" module>
.root {
}
</style>
