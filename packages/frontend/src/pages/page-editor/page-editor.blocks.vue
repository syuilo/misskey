<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Sortable :modelValue="modelValue" tag="div" itemKey="id" handle=".drag-handle" :group="{ name: 'blocks' }" :animation="150" :swapThreshold="0.5" @update:modelValue="v => emit('update:modelValue', v)">
	<template #item="{element}">
		<div :class="$style.item">
			<!-- divが無いとエラーになる https://github.com/SortableJS/vue.draggable.next/issues/189 -->
			<component :is="getComponent(element.type)" :modelValue="element" @update:modelValue="updateItem" @remove="() => removeItem(element)"/>
		</div>
	</template>
</Sortable>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import XSection from './els/page-editor.el.section.vue';
import XText from './els/page-editor.el.text.vue';
import XImage from './els/page-editor.el.image.vue';
import XNote from './els/page-editor.el.note.vue';

function getComponent(type: string) {
	switch (type) {
		case 'section': return XSection;
		case 'text': return XText;
		case 'image': return XImage;
		case 'note': return XNote;
		default: return null;
	}
}

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const props = defineProps<{
	modelValue: Misskey.entities.Page['content'];
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.Page['content']): void;
}>();

function updateItem(v) {
	const i = props.modelValue.findIndex(x => x.id === v.id);
	const newValue = [
		...props.modelValue.slice(0, i),
		v,
		...props.modelValue.slice(i + 1),
	];
	emit('update:modelValue', newValue);
}

function removeItem(el) {
	const i = props.modelValue.findIndex(x => x.id === el.id);
	const newValue = [
		...props.modelValue.slice(0, i),
		...props.modelValue.slice(i + 1),
	];
	emit('update:modelValue', newValue);
}
</script>

<style lang="scss" module>
.item {
	& + .item {
		margin-top: 16px;
	}
}
</style>
