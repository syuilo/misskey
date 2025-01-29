<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.sortOrderArea">
	<div :class="$style.sortOrderAreaTags">
		<MkTagItem
			v-for="order in currentOrders"
			:key="order.key"
			:iconClass="order.direction === '+' ? 'ti ti-arrow-up' : 'ti ti-arrow-down'"
			:exButtonIconClass="'ti ti-x'"
			:content="order.key"
			:class="$style.sortOrderTag"
			@click="onToggleSortOrderButtonClicked(order)"
			@exButtonClick="onRemoveSortOrderButtonClicked(order)"
		/>
	</div>
	<MkButton :class="$style.sortOrderAddButton" @click="onAddSortOrderButtonClicked">
		<span class="ti ti-plus"></span>
	</MkButton>
</div>
</template>

<script setup lang="ts" generic="T extends string">
import { toRefs } from 'vue';
import MkTagItem from '@/components/MkTagItem.vue';
import MkButton from '@/components/MkButton.vue';
import { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { SortOrder } from '@/components/MkSortOrderEditor.define.js';

const emit = defineEmits<{
	(ev: 'update', sortOrders: SortOrder<T>[]): void;
}>();

const props = defineProps<{
	baseOrderKeyNames: T[];
	currentOrders: SortOrder<T>[];
}>();

const { currentOrders } = toRefs(props);

function onToggleSortOrderButtonClicked(order: SortOrder<T>) {
	switch (order.direction) {
		case '+':
			order.direction = '-';
			break;
		case '-':
			order.direction = '+';
			break;
	}

	emitOrder(currentOrders.value);
}

function onAddSortOrderButtonClicked(ev: MouseEvent) {
	const menuItems: MenuItem[] = props.baseOrderKeyNames
		.filter(baseKey => !currentOrders.value.map(it => it.key).includes(baseKey))
		.map(it => {
			return {
				text: it,
				action: () => {
					emitOrder([...currentOrders.value, { key: it, direction: '+' }]);
				},
			};
		});
	os.contextMenu(menuItems, ev);
}

function onRemoveSortOrderButtonClicked(order: SortOrder<T>) {
	emitOrder(currentOrders.value.filter(it => it.key !== order.key));
}

function emitOrder(sortOrders: SortOrder<T>[]) {
	emit('update', sortOrders);
}

</script>

<style module lang="scss">
.sortOrderArea {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: flex-start;
}

.sortOrderAreaTags {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: flex-start;
	flex-wrap: wrap;
	gap: 8px;
}

.sortOrderAddButton {
	display: flex;
	justify-content: center;
	align-items: center;
	box-sizing: border-box;
	min-width: 2.0em;
	min-height: 2.0em;
	max-width: 2.0em;
	max-height: 2.0em;
	padding: 8px;
	margin-left: auto;
	border-radius: 9999px;
	background-color: var(--MI_THEME-buttonBg);
}

.sortOrderTag {
	user-select: none;
	cursor: pointer;
}
</style>
