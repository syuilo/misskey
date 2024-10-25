<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="dndParentEl">
	<div v-for="item in items" :key="item.id" :class="$style.item">
		<component :is="getComponent(item.type)" :modelValue="item" @update:modelValue="updateItem" @remove="() => removeItem(item)"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { animations } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
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

const props = defineProps<{
	modelValue: Misskey.entities.PageBlock[];
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock[]): void;
}>();

const [dndParentEl, items] = useDragAndDrop(props.modelValue, {
	dragHandle: '.drag-handle',
	group: 'blocks',
	plugins: [animations()],
	threshold: {
		horizontal: 0.5,
		vertical: 0.5,
	},
	onDragend: () => {
		emit('update:modelValue', items.value);
	},
});

function updateItem(v: Misskey.entities.PageBlock) {
	const i = props.modelValue.findIndex(x => x.id === v.id);
	const newValue = [
		...props.modelValue.slice(0, i),
		v,
		...props.modelValue.slice(i + 1),
	];
	emit('update:modelValue', newValue);
}

function removeItem(v: Misskey.entities.PageBlock) {
	const i = props.modelValue.findIndex(x => x.id === v.id);
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
