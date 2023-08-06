<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSlot>
		<template #label>{{ i18n.ts.navbar }}</template>
		<MkContainer :showHeader="false">
			<Sortable
				v-model="items"
				itemKey="id"
				:animation="150"
				:handle="'.' + $style.itemHandle"
				@start="e => e.item.classList.add('active')"
				@end="e => e.item.classList.remove('active')"
			>
				<template #item="{element,index}">
					<div
						v-if="element.type === '-' || navbarItemDef[element.type]"
						:class="$style.item"
					>
						<button class="_button" :class="$style.itemHandle"><i class="ti ti-menu"></i></button>
						<i class="ti-fw" :class="[$style.itemIcon, navbarItemDef[element.type]?.icon]"></i><span :class="$style.itemText">{{ navbarItemDef[element.type]?.title ?? i18n.ts.divider }}</span>
						<button class="_button" :class="$style.itemRemove" @click="removeItem(index)"><i class="ti ti-x"></i></button>
					</div>
				</template>
			</Sortable>
		</MkContainer>
	</FormSlot>
	<div class="_buttons">
		<MkButton @click="addItem"><i class="ti ti-plus"></i> {{ i18n.ts.addItem }}</MkButton>
		<MkButton danger @click="reset"><i class="ti ti-reload"></i> {{ i18n.ts.default }}</MkButton>
		<MkButton primary class="save" @click="save"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
	</div>

	<MkRadios v-model="menuDisplay">
		<template #label>{{ i18n.ts.display }}</template>
		<option value="sideFull">{{ i18n.ts._menuDisplay.sideFull }}</option>
		<option value="sideIcon">{{ i18n.ts._menuDisplay.sideIcon }}</option>
		<option value="top">{{ i18n.ts._menuDisplay.top }}</option>
		<!-- <MkRadio v-model="menuDisplay" value="hide" disabled>{{ i18n.ts._menuDisplay.hide }}</MkRadio>--> <!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
	</MkRadios>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import FormSlot from '@/components/form/slot.vue';
import MkContainer from '@/components/MkContainer.vue';
import * as os from '@/os';
import { navbarItemDef } from '@/navbar';
import { defaultStore } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { deepClone } from '@/scripts/clone';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const items = ref(defaultStore.state.menu.map(x => ({
	id: Math.random().toString(),
	type: x,
})));

const menuDisplay = computed(defaultStore.makeGetterSetter('menuDisplay'));

async function reloadAsk() {
	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.ts.reloadToApplySetting,
	});
	if (canceled) return;

	unisonReload();
}

async function addItem() {
	const menu = Object.keys(navbarItemDef).filter(k => !defaultStore.state.menu.includes(k));
	const { canceled, result: item } = await os.select({
		title: i18n.ts.addItem,
		items: [...menu.map(k => ({
			value: k, text: navbarItemDef[k].title,
		})), {
			value: '-', text: i18n.ts.divider,
		}],
	});
	if (canceled) return;
	items.value = [...items.value, {
		id: Math.random().toString(),
		type: item,
	}];
}

function removeItem(index: number) {
	items.value.splice(index, 1);
}

async function save() {
	defaultStore.set('menu', items.value.map(x => x.type));
	await reloadAsk();
}

function reset() {
	items.value = defaultStore.def.menu.default.map(x => ({
		id: Math.random().toString(),
		type: x,
	}));
}

watch(menuDisplay, async () => {
	await reloadAsk();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.navbar,
	icon: 'ti ti-list',
});
</script>

<style lang="scss" module>
.item {
	position: relative;
	display: block;
	line-height: 2.85rem;
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
	color: var(--navFg);
}

.itemIcon {
	position: relative;
	width: 32px;
	margin-right: 8px;
}

.itemText {
	position: relative;
	font-size: 0.9em;
}

.itemRemove {
	position: absolute;
	z-index: 10000;
	width: 32px;
	height: 32px;
	color: #ff2a2a;
	right: 8px;
	opacity: 0.8;
}

.itemHandle {
	cursor: move;
	width: 32px;
	height: 32px;
	margin: 0 8px;
	opacity: 0.5;
}
</style>
