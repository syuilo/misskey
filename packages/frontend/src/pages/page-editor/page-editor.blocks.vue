<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<div
	@dragstart.capture="dragStart"
	@dragend.capture="dragEnd"
	@drop.capture="dragEnd"
>
	<div
		data-after-id="__FIRST__"
		:class="[$style.insertBetweenRoot, {
			[$style.insertBetweenDraggingOver]: draggingOverAfterId === '__FIRST__' && draggingBlockId !== modelValue[0]?.id,
		}]"
		@click="insertNewBlock('__FIRST__')"
		@dragover="insertBetweenDragOver($event, '__FIRST__')"
		@dragleave="insertBetweenDragLeave"
		@drop="insertBetweenDrop($event, '__FIRST__')"
	>
		<div :class="$style.insertBetweenBorder"></div>
		<span :class="$style.insertBetweenText"><i v-if="!isDragging" class="ti ti-plus"></i> {{ isDragging ? i18n.ts._pages.moveToHere : i18n.ts.add }}</span>
	</div>

	<div v-for="block, index in modelValue" :key="block.id" :class="$style.item">
		<component
			:is="getComponent(block.type)"
			:modelValue="block"
			@update:modelValue="updateItem"
			@remove="() => removeItem(block)"
			@move="(direction: 'up' | 'down') => moveItem(block.id, direction)"
		/>
		<div
			:data-after-id="block.id"
			:class="[$style.insertBetweenRoot, {
				[$style.insertBetweenDraggingOver]: draggingOverAfterId === block.id && draggingBlockId !== block.id && draggingBlockId !== modelValue[index + 1]?.id,
			}]"
			@click="insertNewBlock(block.id)"
			@dragover="insertBetweenDragOver($event, block.id, modelValue[index + 1]?.id)"
			@dragleave="insertBetweenDragLeave"
			@drop="insertBetweenDrop($event, block.id, modelValue[index + 1]?.id)"
		>
			<div :class="$style.insertBetweenBorder"></div>
			<span :class="$style.insertBetweenText"><i v-if="!isDragging" class="ti ti-plus"></i> {{ isDragging ? i18n.ts._pages.moveToHere : i18n.ts.add }}</span>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { getScrollContainer } from '@@/js/scroll.js';
import { getPageBlockList } from '@/pages/page-editor/common.js';
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
	scrollContainer?: HTMLElement | null;
	modelValue: Misskey.entities.Page['content'];
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.Page['content']): void;
}>();

const isDragging = ref(false);
const draggingOverAfterId = ref<string | null>(null);
const draggingBlockId = ref<string | null>(null);

function dragStart(ev: DragEvent) {
	if (ev.target instanceof HTMLElement) {
		const blockId = ev.target.dataset.blockId;
		if (blockId != null) {
			console.log('dragStart', blockId);
			isDragging.value = true;
			draggingBlockId.value = blockId;
			document.addEventListener('dragover', watchForMouseMove);
		}
	}
}

function dragEnd() {
	isDragging.value = false;
	draggingBlockId.value = null;
	document.removeEventListener('dragover', watchForMouseMove);
}

function watchForMouseMove(ev: DragEvent) {
	if (isDragging.value) {
		// 画面上部・下部1/4のときにスクロールする
		const scrollContainer = getScrollContainer(props.scrollContainer ?? null) ?? document.scrollingElement;
		if (scrollContainer != null) {
			const rect = scrollContainer.getBoundingClientRect();
			const y = ev.clientY - rect.top;
			const h = rect.height;
			const scrollSpeed = 30;
			if (y < h / 4) {
				const acceralation = Math.max(0, 1 - (y / (h / 4)));
				scrollContainer.scrollBy({
					top: -scrollSpeed * acceralation,
				});
			} else if (y > (h / 4 * 3)) {
				const acceralation = Math.max(0, 1 - ((h - y) / (h / 4)));
				scrollContainer.scrollBy({
					top: scrollSpeed * acceralation,
				});
			}
		}
	}
}

function insertBetweenDragOver(ev: DragEvent, id: string, nextId?: string) {
	if (
		draggingBlockId.value === id ||
		draggingBlockId.value === nextId ||
		![...(ev.dataTransfer?.types ?? [])].includes('application/x-misskey-pageblock-id')
	) return;

	ev.preventDefault();
	if (ev.target instanceof HTMLElement) {
		const afterId = ev.target.dataset.afterId;
		if (afterId != null) {
			draggingOverAfterId.value = afterId;
		}
	}
}

function insertBetweenDragLeave() {
	draggingOverAfterId.value = null;
}

function insertBetweenDrop(ev: DragEvent, id: string, nextId?: string) {
	if (
		draggingBlockId.value === id ||
		draggingBlockId.value === nextId ||
		![...(ev.dataTransfer?.types ?? [])].includes('application/x-misskey-pageblock-id')
	) return;

	ev.preventDefault();
	if (ev.target instanceof HTMLElement) {
		const afterId = ev.target.dataset.afterId; // insert after this
		const moveId = ev.dataTransfer?.getData('application/x-misskey-pageblock-id');
		if (afterId != null && moveId != null) {
			const oldValue = props.modelValue.filter((x) => x.id !== moveId);
			const afterIdAt = afterId === '__FIRST__' ? 0 : oldValue.findIndex((x) => x.id === afterId);
			const movingBlock = props.modelValue.find((x) => x.id === moveId);
			if (afterId === '__FIRST__' && movingBlock != null) {
				const newValue = [
					movingBlock,
					...oldValue,
				];
				emit('update:modelValue', newValue);
			} else if (afterIdAt >= 0 && movingBlock != null) {
				const newValue = [
					...oldValue.slice(0, afterIdAt + 1),
					movingBlock,
					...oldValue.slice(afterIdAt + 1),
				];
				emit('update:modelValue', newValue);
			}
		}
	}
	isDragging.value = false;
	draggingOverAfterId.value = null;
}

async function insertNewBlock(id: string) {
	const { canceled, result: type } = await os.select({
		title: i18n.ts._pages.chooseBlock,
		items: getPageBlockList(),
	});
	if (canceled || type == null) return;

	const blockId = uuid();

	let newValue: Misskey.entities.Page['content'];

	if (id === '__FIRST__') {
		newValue = [
			{ id: blockId, type },
			...props.modelValue,
		];
	} else {
		const afterIdAt = props.modelValue.findIndex((x) => x.id === id);
		newValue = [
			...props.modelValue.slice(0, afterIdAt + 1),
			{ id: blockId, type },
			...props.modelValue.slice(afterIdAt + 1),
		];
	}

	emit('update:modelValue', newValue);
}

function moveItem(id: string, direction: 'up' | 'down') {
	const i = props.modelValue.findIndex(x => x.id === id);
	if (i === -1) return;

	const newValue = [...props.modelValue];
	const [removed] = newValue.splice(i, 1);
	if (direction === 'up') {
		newValue.splice(i - 1, 0, removed);
	} else {
		newValue.splice(i + 1, 0, removed);
	}

	emit('update:modelValue', newValue);
}

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
.insertBetweenRoot {
	height: calc(var(--MI-margin) * 2);
	width: 100%;
	padding: 8px 0;
	border-radius: 2px;
	position: relative;

	&:hover {
		cursor: pointer;

		.insertBetweenBorder {
			display: block;
		}
		.insertBetweenText {
			display: inline-block;
		}
	}
}

.insertBetweenBorder {
	position: absolute;
	top: 50%;
	left: 0;
	transform: translateY(-50%);
	height: 4px;
	width: 100%;
	border-radius: 2px;
	background-color: var(--MI_THEME-accent);
	display: none;
}

.insertBetweenText {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: var(--MI_THEME-fgOnAccent);
	padding: 0 14px;
	font-size: 13px;
	line-height: 24px;
	border-radius: 999px;
	display: none;
	background-color: var(--MI_THEME-accent);
}

.insertBetweenBorder,
.insertBetweenText {
	pointer-events: none;
}

.insertBetweenDraggingOver {
	.insertBetweenBorder {
		display: block;
	}
	.insertBetweenText {
		display: inline-block;
	}
}
</style>
