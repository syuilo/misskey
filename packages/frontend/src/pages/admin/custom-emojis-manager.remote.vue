<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #default>
		<div :class="$style.root" class="_gaps">
			<MkFolder>
				<template #icon><i class="ti ti-search"></i></template>
				<template #label>{{ i18n.ts._customEmojisManager._gridCommon.searchSettings }}</template>
				<template #caption>
					{{ i18n.ts._customEmojisManager._gridCommon.searchSettingCaption }}
				</template>

				<div class="_gaps">
					<div :class="[[spMode ? $style.searchAreaSp : $style.searchArea]]">
						<MkInput
							v-model="queryName"
							type="search"
							autocapitalize="off"
							:class="[$style.col1, $style.row1]"
							@enter="onSearchRequest"
						>
							<template #label>name</template>
						</MkInput>
						<MkInput
							v-model="queryHost"
							type="search"
							autocapitalize="off"
							:class="[$style.col2, $style.row1]"
							@enter="onSearchRequest"
						>
							<template #label>host</template>
						</MkInput>
						<MkInput
							v-model="queryLicense"
							type="search"
							autocapitalize="off"
							:class="[$style.col3, $style.row1]"
							@enter="onSearchRequest"
						>
							<template #label>license</template>
						</MkInput>

						<MkInput
							v-model="queryUri"
							type="search"
							autocapitalize="off"
							:class="[$style.col1, $style.row2]"
							@enter="onSearchRequest"
						>
							<template #label>uri</template>
						</MkInput>
						<MkInput
							v-model="queryPublicUrl"
							type="search"
							autocapitalize="off"
							:class="[$style.col2, $style.row2]"
							@enter="onSearchRequest"
						>
							<template #label>publicUrl</template>
						</MkInput>
					</div>

					<hr>

					<MkFolder :spacerMax="8" :spacerMin="8">
						<template #icon><i class="ti ti-arrows-sort"></i></template>
						<template #label>{{ i18n.ts._customEmojisManager._gridCommon.sortOrder }}</template>
						<MkSortOrderEditor
							:baseOrderKeyNames="gridSortOrderKeys"
							:currentOrders="sortOrders"
							@update="onSortOrderUpdate"
						/>
					</MkFolder>

					<MkInput
						v-model="queryLimit"
						type="number"
						:max="100"
					>
						<template #label>{{ i18n.ts._customEmojisManager._gridCommon.searchLimit }}</template>
					</MkInput>

					<div :class="[[spMode ? $style.searchButtonsSp : $style.searchButtons]]">
						<MkButton primary @click="onSearchRequest">
							{{ i18n.ts.search }}
						</MkButton>
						<MkButton @click="onQueryResetButtonClicked">
							{{ i18n.ts.reset }}
						</MkButton>
					</div>
				</div>
			</MkFolder>

			<MkFolder>
				<template #icon><i class="ti ti-notes"></i></template>
				<template #label>{{ i18n.ts._customEmojisManager._gridCommon.registrationLogs }}</template>
				<template #caption>
					{{ i18n.ts._customEmojisManager._gridCommon.registrationLogsCaption }}
				</template>
				<XRegisterLogs :logs="requestLogs"/>
			</MkFolder>

			<component :is="loadingHandler.component.value" v-if="loadingHandler.showing.value"/>
			<template v-else>
				<div v-if="gridItems.length === 0" style="text-align: center">
					{{ i18n.ts._customEmojisManager._local._list.emojisNothing }}
				</div>

				<template v-else>
					<div v-if="gridItems.length > 0" :class="$style.gridArea">
						<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
					</div>

					<div :class="$style.footer">
						<div>
							<!-- レイアウト調整用のスペース -->
						</div>

						<div :class="$style.center">
							<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>
						</div>

						<div :class="$style.right">
							<MkButton primary @click="onImportClicked">
								{{
									i18n.ts._customEmojisManager._remote.importEmojisButton
								}} ({{ checkedItemsCount }})
							</MkButton>
						</div>
					</div>
				</template>
			</template>
		</div>
	</template>
</MkStickyContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, useCssModule } from 'vue';
import * as Misskey from 'misskey-js';
import MkRemoteEmojiEditDialog from '@/components/MkRemoteEmojiEditDialog.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkGrid from '@/components/grid/MkGrid.vue';
import {
	emptyStrToUndefined,
	GridSortOrderKey,
	gridSortOrderKeys,
	RequestLogItem,
} from '@/pages/admin/custom-emojis-manager.impl.js';
import { GridCellValueChangeEvent, GridEvent } from '@/components/grid/grid-event.js';
import MkFolder from '@/components/MkFolder.vue';
import XRegisterLogs from '@/pages/admin/custom-emojis-manager.logs.vue';
import * as os from '@/os.js';
import { GridSetting } from '@/components/grid/grid.js';
import { deviceKind } from '@/scripts/device-kind.js';
import MkPagingButtons from '@/components/MkPagingButtons.vue';
import MkSortOrderEditor from '@/components/MkSortOrderEditor.vue';
import { SortOrder } from '@/components/MkSortOrderEditor.define.js';
import { useLoading } from '@/components/hook/useLoading.js';

type GridItem = {
	checked: boolean;
	id: string;
	url: string;
	name: string;
	host: string;
}

function setupGrid(): GridSetting {
	const $style = useCssModule();

	return {
		row: {
			// グリッドの行数をあらかじめ100行確保する
			minimumDefinitionCount: 100,
			styleRules: [
				{
					// チェックされたら背景色を変える
					condition: ({ row }) => gridItems.value[row.index].checked,
					applyStyle: { className: $style.changedRow },
				},
			],
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._remote.importSelectionRows,
						icon: 'ti ti-download',
						action: async () => {
							const targets = context.rangedRows.map(it => gridItems.value[it.index]);
							await importEmojis(targets);
						},
					},
				];
			},
		},
		cols: [
			{ bindTo: 'checked', icon: 'ti-download', type: 'boolean', editable: true, width: 34 },
			{ bindTo: 'url', icon: 'ti-icons', type: 'image', editable: false, width: 'auto' },
			{ bindTo: 'name', title: 'name', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'host', title: 'host', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'license', title: 'license', type: 'text', editable: false, width: 200 },
			{ bindTo: 'uri', title: 'uri', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'publicUrl', title: 'publicUrl', type: 'text', editable: false, width: 'auto' },
		],
		cells: {
			contextMenuFactory: (col, row, value, context) => {
				return [
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._remote.selectionRowDetail,
						icon: 'ti ti-info-circle',
						action: async () => {
							const target = customEmojis.value[row.index];
							const { dispose } = os.popup(MkRemoteEmojiEditDialog, {
								emoji: {
									id: target.id,
									name: target.name,
									host: target.host!,
									license: target.license,
									url: target.publicUrl,
								},
							}, {
								done: () => {
									dispose();
								},
								closed: () => {
									dispose();
								},
							});
						},
					},
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._remote.importSelectionRangesRows,
						icon: 'ti ti-download',
						action: async () => {
							const targets = context.rangedCells.map(it => gridItems.value[it.row.index]);
							await importEmojis(targets);
						},
					},
				];
			},
		},
	};
}

const loadingHandler = useLoading();

const customEmojis = ref<Misskey.entities.EmojiDetailedAdmin[]>([]);
const allPages = ref<number>(0);
const currentPage = ref<number>(0);

const queryName = ref<string | null>(null);
const queryHost = ref<string | null>(null);
const queryLicense = ref<string | null>(null);
const queryUri = ref<string | null>(null);
const queryPublicUrl = ref<string | null>(null);
const queryLimit = ref<number>(25);
const previousQuery = ref<string | undefined>(undefined);
const sortOrders = ref<SortOrder<GridSortOrderKey>[]>([]);
const requestLogs = ref<RequestLogItem[]>([]);

const gridItems = ref<GridItem[]>([]);

const spMode = computed(() => ['smartphone', 'tablet'].includes(deviceKind));
const checkedItemsCount = computed(() => gridItems.value.filter(it => it.checked).length);

function onSortOrderUpdate(_sortOrders: SortOrder<GridSortOrderKey>[]) {
	sortOrders.value = _sortOrders;
}

async function onSearchRequest() {
	await refreshCustomEmojis();
}

function onQueryResetButtonClicked() {
	queryName.value = null;
	queryHost.value = null;
	queryLicense.value = null;
	queryUri.value = null;
	queryPublicUrl.value = null;
}

async function onPageChanged(pageNumber: number) {
	currentPage.value = pageNumber;
	await refreshCustomEmojis();
}

async function onImportClicked() {
	const targets = gridItems.value.filter(it => it.checked);
	await importEmojis(targets);
}

function onGridEvent(event: GridEvent) {
	switch (event.type) {
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
	}
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		gridItems.value[row.index][column.setting.bindTo] = newValue;
	}
}

async function importEmojis(targets: GridItem[]) {
	const confirm = await os.confirm({
		type: 'info',
		title: i18n.ts._customEmojisManager._remote.confirmImportEmojisTitle,
		text: i18n.tsx._customEmojisManager._remote.confirmImportEmojisDescription({ count: targets.length }),
	});

	if (confirm.canceled) {
		return;
	}

	const result = await os.promiseDialog(
		Promise.all(
			targets.map(item =>
				misskeyApi(
					'admin/emoji/copy',
					{
						emojiId: item.id!,
					})
					.then(() => ({ item, success: true, err: undefined }))
					.catch(err => ({ item, success: false, err })),
			),
		),
	);
	const failedItems = result.filter(it => !it.success);

	if (failedItems.length > 0) {
		await os.alert({
			type: 'error',
			title: i18n.ts.somethingHappened,
			text: i18n.ts._customEmojisManager._gridCommon.alertEmojisRegisterFailedDescription,
		});
	}

	requestLogs.value = result.map(it => ({
		failed: !it.success,
		url: it.item.url,
		name: it.item.name,
		error: it.err ? JSON.stringify(it.err) : undefined,
	}));

	await refreshCustomEmojis();
}

async function refreshCustomEmojis() {
	const query: Misskey.entities.V2AdminEmojiListRequest['query'] = {
		name: emptyStrToUndefined(queryName.value),
		host: emptyStrToUndefined(queryHost.value),
		license: emptyStrToUndefined(queryLicense.value),
		uri: emptyStrToUndefined(queryUri.value),
		publicUrl: emptyStrToUndefined(queryPublicUrl.value),
		hostType: 'remote',
	};

	if (JSON.stringify(query) !== previousQuery.value) {
		currentPage.value = 1;
	}

	const result = await loadingHandler.scope(() => misskeyApi('v2/admin/emoji/list', {
		limit: queryLimit.value,
		query: query,
		page: currentPage.value,
		sortKeys: sortOrders.value.map(({ key, direction }) => `${direction}${key}`) as never[],
	}));

	customEmojis.value = result.emojis;
	allPages.value = result.allPages;
	previousQuery.value = JSON.stringify(query);
	gridItems.value = customEmojis.value.map(it => ({
		checked: false,
		id: it.id,
		url: it.publicUrl,
		name: it.name,
		license: it.license,
		host: it.host!,
	}));
}

onMounted(async () => {
	await refreshCustomEmojis();
});
</script>

<style module lang="scss">
.row1 {
	grid-row: 1 / 2;
}

.row2 {
	grid-row: 2 / 3;
}

.col1 {
	grid-column: 1 / 2;
}

.col2 {
	grid-column: 2 / 3;
}

.col3 {
	grid-column: 3 / 4;
}

.root {
	padding: 16px;
}

.changedRow {
	background-color: var(--MI_THEME-infoBg);
}

.searchArea {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 16px;
}

.searchButtons {
	display: flex;
	justify-content: flex-end;
	align-items: flex-end;
	gap: 8px;
}

.searchButtonsSp {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
}

.searchAreaSp {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.gridArea {
	padding-top: 8px;
	padding-bottom: 8px;
}

.pages {
	display: flex;
	justify-content: center;
	align-items: center;

	button {
		background-color: var(--MI_THEME-buttonBg);
		border-radius: 9999px;
		border: none;
		margin: 0 4px;
		padding: 8px;
	}
}

.footer {
	background-color: var(--MI_THEME-bg);

	position: sticky;
	left:0;
	bottom:0;
	z-index: 1;
	// stickyで追従させる都合上、フッター自身でpaddingを持つ必要があるため、親要素で画一的に指定している分をネガティブマージンで相殺している
	margin-top: calc(var(--MI-margin) * -1);
	margin-bottom: calc(var(--MI-margin) * -1);
	padding-top: var(--MI-margin);
	padding-bottom: var(--MI-margin);

	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;

	& .center {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	& .right {
		display: flex;
		justify-content: flex-end;
		align-items: center;
	}
}
</style>
