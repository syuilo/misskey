<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="uiWindow"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="true"
	@closed="emit('closed')"
>
	<template #header>
		<i class="ti ti-search" style="margin-right: 0.5em;"></i> {{ i18n.ts.search }}
	</template>
	<div :class="$style.root">
		<MkSpacer>
			<div class="_gaps">
				<div class="_gaps_s">
					<MkInput
						v-model="model.name"
						type="search"
						autocapitalize="off"
					>
						<template #label>name</template>
					</MkInput>
					<MkInput
						v-model="model.category"
						type="search"
						autocapitalize="off"
					>
						<template #label>category</template>
					</MkInput>
					<MkInput
						v-model="model.aliases"
						type="search"
						autocapitalize="off"
					>
						<template #label>aliases</template>
					</MkInput>

					<MkInput
						v-model="model.type"
						type="search"
						autocapitalize="off"
					>
						<template #label>type</template>
					</MkInput>
					<MkInput
						v-model="model.license"
						type="search"
						autocapitalize="off"
					>
						<template #label>license</template>
					</MkInput>
					<MkSelect
						v-model="model.sensitive"
					>
						<template #label>sensitive</template>
						<option :value="null">-</option>
						<option :value="true">true</option>
						<option :value="false">false</option>
					</MkSelect>

					<MkSelect
						v-model="model.localOnly"
					>
						<template #label>localOnly</template>
						<option :value="null">-</option>
						<option :value="true">true</option>
						<option :value="false">false</option>
					</MkSelect>
					<MkInput
						v-model="model.updatedAtFrom"
						type="date"
						autocapitalize="off"
					>
						<template #label>updatedAt(from)</template>
					</MkInput>
					<MkInput
						v-model="model.updatedAtTo"
						type="date"
						autocapitalize="off"
					>
						<template #label>updatedAt(to)</template>
					</MkInput>

					<MkInput
						v-model="queryRolesText"
						type="text"
						readonly
						autocapitalize="off"
						@click="onQueryRolesEditClicked"
					>
						<template #label>role</template>
						<template #suffix><i class="ti ti-pencil"></i></template>
					</MkInput>
				</div>
				<MkFolder :spacerMax="8" :spacerMin="8">
					<template #icon><i class="ti ti-arrows-sort"></i></template>
					<template #label>{{ i18n.ts._customEmojisManager._gridCommon.sortOrder }}</template>
					<MkSortOrderEditor
						:baseOrderKeyNames="gridSortOrderKeys"
						:currentOrders="sortOrders"
						@update="onSortOrderUpdate"
					/>
				</MkFolder>
			</div>
		</MkSpacer>
		<div :class="$style.footerActions">
			<MkButton primary @click="onSearchRequest">
				{{ i18n.ts.search }}
			</MkButton>
			<MkButton @click="onQueryResetButtonClicked">
				{{ i18n.ts.reset }}
			</MkButton>
		</div>
	</div>
</MkWindow>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import MkWindow from '@/components/MkWindow.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSortOrderEditor from '@/components/MkSortOrderEditor.vue';

import {
	gridSortOrderKeys,
} from './custom-emojis-manager.impl.js';

import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

import type { EmojiSearchQuery } from './custom-emojis-manager.local.list.vue';
import type { SortOrder } from '@/components/MkSortOrderEditor.define.js';
import type { GridSortOrderKey } from './custom-emojis-manager.impl.js';

const props = defineProps<{
	query: EmojiSearchQuery;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'queryUpdated', query: EmojiSearchQuery): void;
	(ev: 'sortOrderUpdated', orders: SortOrder<GridSortOrderKey>[]): void;
	(ev: 'search'): void;
}>();

const model = ref<EmojiSearchQuery>(props.query);
const queryRolesText = computed(() => model.value.roles.map(it => it.name).join(','));

watch(model, () => {
	emit('queryUpdated', model.value);
}, { deep: true });

const sortOrders = ref<SortOrder<GridSortOrderKey>[]>([]);

function onSortOrderUpdate(orders: SortOrder<GridSortOrderKey>[]) {
	sortOrders.value = orders;
	emit('sortOrderUpdated', orders);
}

function onSearchRequest() {
	emit('search');
}

function onQueryResetButtonClicked() {
	model.value.name = '';
	model.value.category = '';
	model.value.aliases = '';
	model.value.type = '';
	model.value.license = '';
	model.value.sensitive = null;
	model.value.localOnly = null;
	model.value.updatedAtFrom = '';
	model.value.updatedAtTo = '';
	sortOrders.value = [];
}

async function onQueryRolesEditClicked() {
	const result = await os.selectRole({
		initialRoleIds: model.value.roles.map(it => it.id),
		title: i18n.ts._customEmojisManager._local._list.dialogSelectRoleTitle,
		publicOnly: true,
	});
	if (result.canceled) {
		return;
	}

	model.value.roles = result.result;
}
</script>

<style module>
.root {
	position: relative;
}

.footerActions {
	position: sticky;
	bottom: 0;
	padding: var(--MI-margin);
	background-color: var(--MI_THEME-bg);
	display: flex;
	gap: 8px;
	z-index: 1;
}
</style>
