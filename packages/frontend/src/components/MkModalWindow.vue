<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" @click="onBgClick" @closed="$emit('closed')">
	<div ref="rootEl" :class="$style.root" :style="{ width: `${width}px`, height: `min(${height}px, 100%)` }" @keydown="onKeydown">
		<div ref="headerEl" :class="$style.header">
			<button v-if="withOkButton" :class="$style.headerButton" class="_button" @click="$emit('close')"><i class="ti ti-x"></i></button>
			<span :class="$style.title">
				<slot name="header"></slot>
			</span>
			<button v-if="!withOkButton" :class="$style.headerButton" class="_button" data-cy-modal-window-close @click="$emit('close')"><i class="ti ti-x"></i></button>
			<button v-if="withOkButton" :class="$style.headerButton" class="_button" :disabled="okButtonDisabled" @click="$emit('ok')"><i class="ti ti-check"></i></button>
		</div>
		<div :class="$style.body">
			<slot :width="bodyWidth" :height="bodyHeight"></slot>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, onUnmounted } from 'vue';
import MkModal from './MkModal.vue';

const props = withDefaults(defineProps<{
	withOkButton: boolean;
	okButtonDisabled: boolean;
	width: number;
	height: number;
}>(), {
	withOkButton: false,
	okButtonDisabled: false,
	width: 400,
	height: 500,
});

const emit = defineEmits<{
	(event: 'click'): void;
	(event: 'close'): void;
	(event: 'closed'): void;
	(event: 'ok'): void;
}>();

let modal = $shallowRef<InstanceType<typeof MkModal>>();
let rootEl = $shallowRef<HTMLElement>();
let headerEl = $shallowRef<HTMLElement>();
let bodyWidth = $ref(0);
let bodyHeight = $ref(0);

const close = () => {
	modal.close();
};

const onBgClick = () => {
	emit('click');
};

const onKeydown = (evt) => {
	if (evt.which === 27) { // Esc
		evt.preventDefault();
		evt.stopPropagation();
		close();
	}
};

const ro = new ResizeObserver((entries, observer) => {
	bodyWidth = rootEl.offsetWidth;
	bodyHeight = rootEl.offsetHeight - headerEl.offsetHeight;
});

onMounted(() => {
	bodyWidth = rootEl.offsetWidth;
	bodyHeight = rootEl.offsetHeight - headerEl.offsetHeight;
	ro.observe(rootEl);
});

onUnmounted(() => {
	ro.disconnect();
});

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	contain: content;
	border-radius: var(--radius);

	--root-margin: 24px;

	@media (max-width: 500px) {
		--root-margin: 16px;
	}

	--headerHeight: 46px;
	--headerHeightNarrow: 42px;
}

.header {
	display: flex;
	flex-shrink: 0;
	background: var(--windowHeader);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}

.headerButton {
	height: var(--headerHeight);
	width: var(--headerHeight);

	@media (max-width: 500px) {
		height: var(--headerHeightNarrow);
		width: var(--headerHeightNarrow);
	}
}

.title {
	flex: 1;
	line-height: var(--headerHeight);
	padding-left: 32px;
	font-weight: bold;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	pointer-events: none;

	@media (max-width: 500px) {
		line-height: var(--headerHeightNarrow);
		padding-left: 16px;
	}
}

.headerButton + .title {
	padding-left: 0;
}

.body {
	flex: 1;
	overflow: auto;
	background: var(--panel);
	container-type: size;
}
</style>
