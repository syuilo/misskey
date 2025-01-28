<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<button v-for="item in items" class="_button item" :class="{ disabled: item.hidden }" @click="onClick(item)">
		<span class="box" :style="{ background: type === 'line' ? item.strokeStyle?.toString() : item.fillStyle?.toString() }"></span>
		{{ item.text }}
	</button>
</div>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import { Chart } from 'chart.js';
import type { LegendItem } from 'chart.js';

const chart = shallowRef<Chart>();
const type = shallowRef<string>();
const items = shallowRef<LegendItem[]>([]);

function update(_chart: Chart, _items: LegendItem[]) {
	chart.value = _chart,
	items.value = _items;
	if ('type' in _chart.config) type.value = _chart.config.type;
}

function onClick(item: LegendItem) {
	if (chart.value == null) return;
	if (type.value === 'pie' || type.value === 'doughnut') {
		// Pie and doughnut charts only have a single dataset and visibility is per item
		if (item.index != null) chart.value.toggleDataVisibility(item.index);
	} else {
		if (item.datasetIndex != null) chart.value.setDatasetVisibility(item.datasetIndex, !chart.value.isDatasetVisible(item.datasetIndex));
	}
	chart.value.update();
}

defineExpose({
	update,
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 8px;

	&:global {
		> .item {
			font-size: 85%;
			padding: 4px 12px 4px 8px;
			border: solid 1px var(--MI_THEME-divider);
			border-radius: 999px;

			&:hover {
				border-color: var(--MI_THEME-inputBorderHover);
			}

			&.disabled {
				text-decoration: line-through;
				opacity: 0.5;
			}

			> .box {
				display: inline-block;
				width: 12px;
				height: 12px;
				border-radius: 100%;
				vertical-align: -10%;
			}
		}
	}
}

@container (max-width: 500px) {
	.root {
		font-size: 90%;
		gap: 6px;
	}
}
</style>
