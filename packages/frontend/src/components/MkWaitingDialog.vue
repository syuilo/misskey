<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" :zPriority="'high'" @click="success ? done() : () => {}" @closed="emit('closed')">
	<div :class="[$style.root, { [$style.iconOnly]: (text == null) || success }]">
		<i v-if="success" :class="[$style.icon, $style.success]" class="ti ti-check"></i>
		<MkLoading v-else :class="[$style.icon, $style.waiting]" :em="true"/>
		<div v-if="text && !success" :class="$style.text">{{ text }}<MkEllipsis/></div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { watch, shallowRef } from 'vue';
import MkModal from '@/components/MkModal.vue';

const modal = shallowRef<InstanceType<typeof MkModal>>();

const props = defineProps<{
	success: boolean;
	showing: boolean;
	text?: string;
}>();

const emit = defineEmits<{
	(ev: 'done');
	(ev: 'closed');
}>();

function done() {
	emit('done');
	modal.value.close();
}

watch(() => props.showing, () => {
	if (!props.showing) done();
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
	width: 250px;

	&.iconOnly {
		padding: 0;
		width: 96px;
		height: 96px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.icon {
	font-size: 32px;

	&.success {
		color: var(--accent);
	}

	&.waiting {
		opacity: 0.7;
	}
}

.text {
	margin-top: 16px;
}
</style>
