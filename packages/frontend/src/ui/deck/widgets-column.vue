<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :naked="true" :column="column" :isStacked="isStacked">
	<template #header><i class="ti ti-apps" style="margin-right: 8px;"></i>{{ column.name }}</template>

	<div :class="$style.root">
		<div v-if="!(column.widgets && column.widgets.length > 0) && !edit" :class="$style.intro">{{ i18n.ts._deck.widgetsIntroduction }}</div>
		<XWidgets :edit="edit" :widgets="column.widgets ?? []" @addWidget="addWidget" @removeWidget="removeWidget" @updateWidget="updateWidget" @updateWidgets="updateWidgets" @exit="edit = false"/>
	</div>
</XColumn>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import XColumn from './column.vue';
import { addColumnWidget, removeColumnWidget, setColumnWidgets, updateColumnWidget } from './deck-store.js';
import type { Column } from './deck-store.js';
import XWidgets from '@/components/MkWidgets.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

const edit = ref(false);

function addWidget(widget) {
	addColumnWidget(props.column.id, widget);
}

function removeWidget(widget) {
	removeColumnWidget(props.column.id, widget);
}

function updateWidget({ id, data }) {
	updateColumnWidget(props.column.id, id, data);
}

function updateWidgets(widgets) {
	setColumnWidgets(props.column.id, widgets);
}

function func() {
	edit.value = !edit.value;
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.editWidgets,
	action: func,
}];
</script>

<style lang="scss" module>
.root {
	--MI-margin: 8px;
	--MI_THEME-panelBorder: none;

	padding: 0 var(--MI-margin);
}

.intro {
	padding: 16px;
	text-align: center;
}
</style>
