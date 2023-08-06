<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<XWidgets :edit="editMode" :widgets="widgets" @addWidget="addWidget" @removeWidget="removeWidget" @updateWidget="updateWidget" @updateWidgets="updateWidgets" @exit="editMode = false"/>

	<button v-if="editMode" class="_textButton" style="font-size: 0.9em;" @click="editMode = false"><i class="ti ti-check"></i> {{ i18n.ts.editWidgetsExit }}</button>
	<button v-else class="_textButton" data-cy-widget-edit :class="$style.edit" style="font-size: 0.9em;" @click="editMode = true"><i class="ti ti-pencil"></i> {{ i18n.ts.editWidgets }}</button>
</div>
</template>

<script lang="ts">
let editMode = $ref(false);
</script>
<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import XWidgets from '@/components/MkWidgets.vue';
import { i18n } from '@/i18n';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	// null = 全てのウィジェットを表示
	// left = place: leftだけを表示
	// right = rightとnullを表示
	place?: 'left' | null | 'right';
}>(), {
	place: null,
});

const widgets = $computed(() => {
	if (props.place === null) return defaultStore.reactiveState.widgets.value;
	if (props.place === 'left') return defaultStore.reactiveState.widgets.value.filter(w => w.place === 'left');
	return defaultStore.reactiveState.widgets.value.filter(w => w.place !== 'left');
});

function addWidget(widget) {
	defaultStore.set('widgets', [{
		...widget,
		place: props.place,
	}, ...defaultStore.state.widgets]);
}

function removeWidget(widget) {
	defaultStore.set('widgets', defaultStore.state.widgets.filter(w => w.id !== widget.id));
}

function updateWidget({ id, data }) {
	defaultStore.set('widgets', defaultStore.state.widgets.map(w => w.id === id ? {
		...w,
		data,
		place: props.place,
	} : w));
}

function updateWidgets(thisWidgets) {
	if (props.place === null) {
		defaultStore.set('widgets', thisWidgets);
		return;
	}
	if (props.place === 'left') {
		defaultStore.set('widgets', [
			...thisWidgets.map(w => ({ ...w, place: 'left' })),
			...defaultStore.state.widgets.filter(w => w.place !== 'left' && !thisWidgets.some(t => w.id === t.id)),
		]);
		return;
	}
	defaultStore.set('widgets', [
		...defaultStore.state.widgets.filter(w => w.place === 'left' && !thisWidgets.some(t => w.id === t.id)),
		...thisWidgets.map(w => ({ ...w, place: 'right' })),
	]);
}
</script>

<style lang="scss" module>
.edit {
	width: 100%;
}
</style>
