<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
// @ts-nocheck
import { } from 'vue';
import XColumn from './column.vue';
import { addColumnWidget, Column, removeColumnWidget, setColumnWidgets, updateColumnWidget } from './deck-store';
import XWidgets from '@/components/MkWidgets.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

let edit = $ref(false);

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
	edit = !edit;
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.editWidgets,
	action: func,
}];
</script>

<style lang="scss" module>
.root {
	--margin: 8px;
	--panelBorder: none;

	padding: 0 var(--margin);
}

.intro {
	padding: 16px;
	text-align: center;
}
</style>
