<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="ti ti-note"></i> {{ props.modelValue.title }}</template>
	<template #func>
		<button class="_button" @click="rename()">
			<i class="ti ti-pencil"></i>
		</button>
	</template>

	<section class="ilrvjyvi">
		<XBlocks v-model="children" class="children"/>
		<MkButton rounded class="add" @click="add()"><i class="ti ti-plus"></i></MkButton>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
/* eslint-disable vue/no-mutating-props */
import { defineAsyncComponent, inject, onMounted, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import XContainer from '../page-editor.container.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { deepClone } from '@/scripts/clone';
import MkButton from '@/components/MkButton.vue';

const XBlocks = defineAsyncComponent(() => import('../page-editor.blocks.vue'));

const props = withDefaults(defineProps<{
	modelValue: any,
}>(), {
	modelValue: {},
});

const emit = defineEmits<{
	(ev: 'update:modelValue', value: any): void;
}>();

const children = $ref(deepClone(props.modelValue.children ?? []));

watch($$(children), () => {
	emit('update:modelValue', {
		...props.modelValue,
		children,
	});
}, {
	deep: true,
});

const getPageBlockList = inject<(any) => any>('getPageBlockList');

async function rename() {
	const { canceled, result: title } = await os.inputText({
		title: 'Enter title',
		default: props.modelValue.title,
	});
	if (canceled) return;
	emit('update:modelValue', {
		...props.modelValue,
		title,
	});
}

async function add() {
	const { canceled, result: type } = await os.select({
		title: i18n.ts._pages.chooseBlock,
		items: getPageBlockList(),
	});
	if (canceled) return;

	const id = uuid();
	children.push({ id, type });
}

onMounted(() => {
	if (props.modelValue.title == null) {
		rename();
	}
});
</script>

<style lang="scss" scoped>
.ilrvjyvi {
	> .children {
		margin: 16px;

		&:empty {
			display: none;
		}
	}

	> .add {
		margin: 16px auto;
	}
}
</style>
