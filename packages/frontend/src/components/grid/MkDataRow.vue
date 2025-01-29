<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	class="mk_grid_tr"
	:class="[
		$style.row,
		row.ranged ? $style.ranged : {},
		...(row.additionalStyles ?? []).map(it => it.className ?? {}),
	]"
	:style="[
		...(row.additionalStyles ?? []).map(it => it.style ?? {}),
	]"
	:data-grid-row="row.index"
>
	<MkNumberCell
		v-if="setting.showNumber"
		:content="(row.index + 1).toString()"
		:row="row"
	/>
	<MkDataCell
		v-for="cell in cells"
		:key="cell.address.col"
		:vIf="cell.column.setting.type !== 'hidden'"
		:cell="cell"
		:rowSetting="setting"
		:bus="bus"
		@operation:beginEdit="(sender) => emit('operation:beginEdit', sender)"
		@operation:endEdit="(sender) => emit('operation:endEdit', sender)"
		@change:value="(sender, newValue) => emit('change:value', sender, newValue)"
		@change:contentSize="(sender, newSize) => emit('change:contentSize', sender, newSize)"
	/>
</div>
</template>

<script setup lang="ts">
import { GridEventEmitter, Size } from '@/components/grid/grid.js';
import MkDataCell from '@/components/grid/MkDataCell.vue';
import MkNumberCell from '@/components/grid/MkNumberCell.vue';
import { CellValue, GridCell } from '@/components/grid/cell.js';
import { GridRow, GridRowSetting } from '@/components/grid/row.js';

const emit = defineEmits<{
	(ev: 'operation:beginEdit', sender: GridCell): void;
	(ev: 'operation:endEdit', sender: GridCell): void;
	(ev: 'change:value', sender: GridCell, newValue: CellValue): void;
	(ev: 'change:contentSize', sender: GridCell, newSize: Size): void;
}>();
defineProps<{
	row: GridRow,
	cells: GridCell[],
	setting: GridRowSetting,
	bus: GridEventEmitter,
}>();

</script>

<style module lang="scss">
.row {
	display: flex;
	flex-direction: row;
	align-items: center;
	width: fit-content;

	&.ranged {
		background-color: var(--MI_THEME-accentedBg);
	}
}
</style>
