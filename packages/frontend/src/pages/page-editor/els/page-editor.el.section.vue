<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => emit('remove')">
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
 
import { defineAsyncComponent, inject, onMounted, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import XContainer from '../page-editor.container.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/scripts/clone.js';
import MkButton from '@/components/MkButton.vue';
import { getPageBlockList } from '@/pages/page-editor/common.js';

const XBlocks = defineAsyncComponent(() => import('../page-editor.blocks.vue'));

const props = defineProps<{
	modelValue: Misskey.entities.PageBlock & { type: 'section'; },
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.PageBlock & { type: 'section' }): void;
	(ev: 'remove'): void;
}>();

const children = ref(deepClone(props.modelValue.children ?? []));

watch(children, () => {
	emit('update:modelValue', {
		...props.modelValue,
		children: children.value,
	});
}, {
	deep: true,
});

async function rename() {
	const { canceled, result: title } = await os.inputText({
		title: i18n.ts._pages.enterSectionTitle,
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
	children.value.push({ id, type });
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
