<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :manualShowing="manualShowing" :zPriority="'high'" :src="src" :transparentBg="true" :returnFocusTo="returnFocusTo" @click="click" @close="onModalClose" @closed="onModalClosed">
	<MkMenu :items="items" :align="align" :width="width" :max-height="maxHeight" :asDrawer="type === 'drawer'" :returnFocusTo="returnFocusTo" :class="{ [$style.drawer]: type === 'drawer' }" @close="onMenuClose" @hide="hide"/>
</MkModal>
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import MkModal from './MkModal.vue';
import MkMenu from './MkMenu.vue';
import type { MenuItem } from '@/types/menu.js';

defineProps<{
	items: MenuItem[];
	align?: 'center' | string;
	width?: number;
	src?: HTMLElement | null;
	returnFocusTo?: HTMLElement | null;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'closing'): void;
}>();

const modal = shallowRef<InstanceType<typeof MkModal>>();
const manualShowing = ref(true);
const hiding = ref(false);

function click() {
	close();
}

function onModalClose() {
	emit('closing');
}

function onMenuClose() {
	close();
	if (hiding.value) {
		// hidingであればclosedを発火
		emit('closed');
	}
}

function onModalClosed() {
	if (!hiding.value) {
		// hidingでなければclosedを発火
		emit('closed');
	}
}

function hide() {
	manualShowing.value = false;
	hiding.value = true;

	// closeは呼ぶ必要がある
	modal.value?.close();
}

function close() {
	manualShowing.value = false;

	// closeは呼ぶ必要がある
	modal.value?.close();
}
</script>

<style lang="scss" module>
.drawer {
	border-radius: 24px;
	border-bottom-right-radius: 0;
	border-bottom-left-radius: 0;
}
</style>
