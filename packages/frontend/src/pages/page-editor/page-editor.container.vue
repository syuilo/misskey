<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="containerRootEl"
	:class="[$style.blockContainerRoot, {
		[$style.dragging]: isDragging,
		[$style.draggingOver]: isDraggingOver,
	}]"
	@focus.capture="toggleFocus"
	@blur.capture="toggleFocus"
	@dragover="dragOver"
	@dragleave="dragLeave"
	@drop="drop"
>
	<header :class="$style.blockContainerHeader" tabindex="1">
		<div :class="$style.title"><slot name="header"></slot></div>
		<div :class="$style.buttons">
			<div v-if="$slots.actions != null"><slot name="actions"></slot></div>
			<button v-if="removable" :class="$style.blockContainerActionButton" class="_button" @click="remove()">
				<i class="ti ti-trash"></i>
			</button>
			<template v-if="draggable">
				<div :class="$style.divider"></div>
				<button
					:class="$style.blockContainerActionButton"
					class="_button"
					@click="() => emit('move', 'up')"
				>
					<i class="ti ti-arrow-up"></i>
				</button>
				<button
					:class="$style.blockContainerActionButton"
					class="_button"
					@click="() => emit('move', 'down')"
				>
					<i class="ti ti-arrow-down"></i>
				</button>
				<button
					draggable="true"
					:class="$style.blockContainerActionButton"
					class="_button"
					:data-block-id="blockId"
					@dragstart="dragStart"
					@dragend="dragEnd"
				>
					<i class="ti ti-menu-2"></i>
				</button>
			</template>
		</div>
	</header>
	<div :class="$style.blockContainerBody" tabindex="0">
		<slot :focus="focus"></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n';

const props = withDefaults(defineProps<{
	blockId: string;
	expanded?: boolean;
	removable?: boolean;
	draggable?: boolean;
}>(), {
	expanded: true,
	removable: true,
});

const emit = defineEmits<{
	(ev: 'remove'): void;
	(ev: 'move', direction: 'up' | 'down'): void;
}>();

async function remove() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts._pages.blockDeleteAreYouSure,
	});
	if (canceled) return;

	emit('remove');
}

const containerRootEl = useTemplateRef('containerRootEl');
const focus = ref(false);
function toggleFocus() {
	focus.value = containerRootEl.value?.contains(document.activeElement) ?? false;
}

const isDragging = ref(false);
function dragStart(ev: DragEvent) {
	ev.dataTransfer?.setData('application/x-misskey-pageblock-id', props.blockId);
	isDragging.value = true;
}
function dragEnd() {
	isDragging.value = false;
}

const isDraggingOver = ref(false);
function dragOver(ev: DragEvent) {
	if (isDragging.value) {
		// ブロックの中にドロップできるのは自分自身だけ
		ev.preventDefault();
		isDraggingOver.value = true;
	}
}
function dragLeave() {
	isDraggingOver.value = false;
}
function drop() {
	// 自分自身しかドロップできないので何もしない
	isDraggingOver.value = false;
}
</script>

<style lang="scss" module>
.blockContainerRoot {
	position: relative;
}

.blockContainerHeader {
	position: absolute;
	box-sizing: border-box;
	top: 0;
	right: 0;
	transform: translateY(-100%);
	z-index: 1;
	display: none;
	gap: 8px;

	height: 42px;
	padding: 6px 8px;
	background-color: var(--MI_THEME-panel);
	border: 2px solid var(--MI_THEME-accent);
	border-bottom: none;
	border-radius: 8px 8px 0 0;

	> .title {
		line-height: 26px;
		padding-left: 2px;
		padding-right: 8px;
		border-right: 0.5px solid var(--MI_THEME-divider);
	}

	> .buttons {
		display: flex;
		align-items: center;
		gap: 8px;

		> .divider {
			width: 0.5px;
			height: 26px;
			background-color: var(--MI_THEME-divider);
		}
	}
}

.blockContainerActionButton {
	display: block;
	width: 26px;
	height: 26px;
	line-height: 26px;
	text-align: center;
}

.blockContainerBody {
	position: relative;
	overflow: hidden;
	background: var(--MI_THEME-panel);
	border: solid 2px var(--MI_THEME-X12);
	border-radius: 8px;

	&:hover {
		border: solid 2px var(--MI_THEME-X13);
	}
}

.blockContainerRoot.dragging {
	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--MI_THEME-bg);
		z-index: 1;
		border-radius: 8px 0 8px 8px;
	}

	&.draggingOver::after {
		outline: dashed 2px var(--MI_THEME-accent);
		outline-offset: -2px;
	}

	.blockContainerHeader {
		display: flex;
	}

	.blockContainerBody {
		border: solid 2px var(--MI_THEME-accent);
		border-top-right-radius: 0;
	}
}

@container (min-width: 700px) {
	.blockContainerRoot:focus-within {
		.blockContainerHeader {
			display: flex;
		}

		.blockContainerBody {
			border: solid 2px var(--MI_THEME-accent);
			border-top-right-radius: 0;
		}
	}
}
</style>
