<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader :overridePageMetadata="headerPageMetadata" :actions="headerActions"/>
	</template>
	<template #default>
		<div class="_gaps" :class="$style.main">
			<component :is="loadingHandler.component.value" v-if="loadingHandler.showing.value"/>
			<template v-else>
				<div v-if="gridItems.length === 0" style="text-align: center">
					{{ i18n.ts._customEmojisManager._local._list.emojisNothing }}
				</div>

				<template v-else>
					<div :class="$style.grid">
						<MkGrid :data="gridItems" :settings="setupGrid()" @event="onGridEvent"/>
					</div>
				</template>
			</template>
		</div>
	</template>

	<template #footer>
		<div v-if="gridItems.length > 0" :class="$style.footer">
			<div :class="$style.left">
				<MkButton danger style="margin-right: auto" @click="onDeleteButtonClicked">
					{{ i18n.ts.delete }} ({{ deleteItemsCount }})
				</MkButton>
			</div>

			<div :class="$style.center">
				<MkPagingButtons :current="currentPage" :max="allPages" :buttonCount="5" @pageChanged="onPageChanged"/>
			</div>

			<div :class="$style.right">
				<MkButton primary :disabled="updateButtonDisabled" @click="onUpdateButtonClicked">
					{{ i18n.ts.update }} ({{ updatedItemsCount }})
				</MkButton>
				<MkButton @click="onGridResetButtonClicked">{{ i18n.ts.reset }}</MkButton>
			</div>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts">
import type { SortOrder } from '@/components/MkSortOrderEditor.define.js';
import type { GridSortOrderKey } from './custom-emojis-manager.impl.js';

export type EmojiSearchQuery = {
	name: string | null;
	category: string | null;
	aliases: string | null;
	type: string | null;
	license: string | null;
	updatedAtFrom: string | null;
	updatedAtTo: string | null;
	sensitive: string | null;
	localOnly: string | null;
	roles: { id: string, name: string }[];
	sortOrders: SortOrder<GridSortOrderKey>[];
	limit: number;
};
</script>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, nextTick, useCssModule } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os.js';
import {
	emptyStrToEmptyArray,
	emptyStrToNull,
	emptyStrToUndefined,
	RequestLogItem,
	roleIdsParser,
} from '@/pages/admin/custom-emojis-manager.impl.js';
import MkGrid from '@/components/grid/MkGrid.vue';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import { validators } from '@/components/grid/cell-validators.js';
import { GridCellValidationEvent, GridCellValueChangeEvent, GridEvent } from '@/components/grid/grid-event.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkPagingButtons from '@/components/MkPagingButtons.vue';
import { GridSetting } from '@/components/grid/grid.js';
import { selectFile } from '@/scripts/select-file.js';
import { copyGridDataToClipboard, removeDataFromGrid } from '@/components/grid/grid-utils.js';
import { useLoading } from "@/components/hook/useLoading.js";

type GridItem = {
	checked: boolean;
	id: string;
	url: string;
	name: string;
	host: string;
	category: string;
	aliases: string;
	license: string;
	isSensitive: boolean;
	localOnly: boolean;
	roleIdsThatCanBeUsedThisEmojiAsReaction: { id: string, name: string }[];
	fileId?: string;
	updatedAt: string | null;
	publicUrl?: string | null;
	originalUrl?: string | null;
	type: string | null;
}

function setupGrid(): GridSetting {
	const $style = useCssModule();

	const required = validators.required();
	const regex = validators.regex(/^[a-zA-Z0-9_]+$/);
	const unique = validators.unique();
	return {
		root: {
			noOverflowStyle: true,
			rounded: false,
			outerBorder: false,
		},
		row: {
			showNumber: true,
			selectable: true,
			// グリッドの行数をあらかじめ100行確保する
			minimumDefinitionCount: 100,
			styleRules: [
				{
					// 初期値から変わっていたら背景色を変更
					condition: ({ row }) => JSON.stringify(gridItems.value[row.index]) !== JSON.stringify(originGridItems.value[row.index]),
					applyStyle: { className: $style.changedRow },
				},
				{
					// バリデーションに引っかかっていたら背景色を変更
					condition: ({ cells }) => cells.some(it => !it.violation.valid),
					applyStyle: { className: $style.violationRow },
				},
			],
			// 行のコンテキストメニュー設定
			contextMenuFactory: (row, context) => {
				return [
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._gridCommon.copySelectionRows,
						icon: 'ti ti-copy',
						action: () => copyGridDataToClipboard(gridItems, context),
					},
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._local._list.markAsDeleteTargetRows,
						icon: 'ti ti-trash',
						action: () => {
							for (const rangedRow of context.rangedRows) {
								gridItems.value[rangedRow.index].checked = true;
							}
						},
					},
				];
			},
			events: {
				delete(rows) {
					// 行削除時は元データの行を消さず、削除対象としてマークするのみにする
					for (const row of rows) {
						gridItems.value[row.index].checked = true;
					}
				},
			},
		},
		cols: [
			{ bindTo: 'checked', icon: 'ti-trash', type: 'boolean', editable: true, width: 34 },
			{
				bindTo: 'url', icon: 'ti-icons', type: 'image', editable: true, width: 'auto', validators: [required],
				async customValueEditor(row, col, value, cellElement) {
					const file = await selectFile(cellElement);
					gridItems.value[row.index].url = file.url;
					gridItems.value[row.index].fileId = file.id;

					return file.url;
				},
			},
			{
				bindTo: 'name', title: 'name', type: 'text', editable: true, width: 140,
				validators: [required, regex, unique],
			},
			{ bindTo: 'category', title: 'category', type: 'text', editable: true, width: 140 },
			{ bindTo: 'aliases', title: 'aliases', type: 'text', editable: true, width: 140 },
			{ bindTo: 'license', title: 'license', type: 'text', editable: true, width: 140 },
			{ bindTo: 'isSensitive', title: 'sensitive', type: 'boolean', editable: true, width: 90 },
			{ bindTo: 'localOnly', title: 'localOnly', type: 'boolean', editable: true, width: 90 },
			{
				bindTo: 'roleIdsThatCanBeUsedThisEmojiAsReaction', title: 'role', type: 'text', editable: true, width: 140,
				valueTransformer(row) {
					// バックエンドからからはIDと名前のペア配列で受け取るが、表示にIDがあると煩雑なので名前だけにする
					return gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction
						.map((it) => it.name)
						.join(',');
				},
				async customValueEditor(row) {
					// ID直記入は体験的に最悪なのでモーダルを使って入力する
					const current = gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction;
					const result = await os.selectRole({
						initialRoleIds: current.map(it => it.id),
						title: i18n.ts.rolesThatCanBeUsedThisEmojiAsReaction,
						infoMessage: i18n.ts.rolesThatCanBeUsedThisEmojiAsReactionEmptyDescription,
						publicOnly: true,
					});
					if (result.canceled) {
						return current;
					}

					const transform = result.result.map(it => ({ id: it.id, name: it.name }));
					gridItems.value[row.index].roleIdsThatCanBeUsedThisEmojiAsReaction = transform;

					return transform;
				},
				events: {
					paste: roleIdsParser,
					delete(cell) {
						// デフォルトはundefinedになるが、このプロパティは空配列にしたい
						gridItems.value[cell.row.index].roleIdsThatCanBeUsedThisEmojiAsReaction = [];
					},
				},
			},
			{ bindTo: 'type', type: 'text', editable: false, width: 90 },
			{ bindTo: 'updatedAt', type: 'text', editable: false, width: 'auto' },
			{ bindTo: 'publicUrl', type: 'text', editable: false, width: 180 },
			{ bindTo: 'originalUrl', type: 'text', editable: false, width: 180 },
		],
		cells: {
			// セルのコンテキストメニュー設定
			contextMenuFactory(col, row, value, context) {
				return [
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._gridCommon.copySelectionRanges,
						icon: 'ti ti-copy',
						action: () => {
							return copyGridDataToClipboard(gridItems, context);
						},
					},
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._gridCommon.deleteSelectionRanges,
						icon: 'ti ti-trash',
						action: () => {
							removeDataFromGrid(context, (cell) => {
								gridItems.value[cell.row.index][cell.column.setting.bindTo] = undefined;
							});
						},
					},
					{
						type: 'button',
						text: i18n.ts._customEmojisManager._local._list.markAsDeleteTargetRanges,
						icon: 'ti ti-trash',
						action: () => {
							for (const rowIdx of [...new Set(context.rangedCells.map(it => it.row.index)).values()]) {
								gridItems.value[rowIdx].checked = true;
							}
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

const searchQuery = ref<EmojiSearchQuery>({
	name: null,
	category: null,
	aliases: null,
	type: null,
	license: null,
	updatedAtFrom: null,
	updatedAtTo: null,
	sensitive: null,
	localOnly: null,
	roles: [],
	sortOrders: [],
	limit: 25,
});
let searchWindowOpening = false;

const previousQuery = ref<string | undefined>(undefined);
const sortOrders = ref<SortOrder<GridSortOrderKey>[]>([]);
const requestLogs = ref<RequestLogItem[]>([]);

const gridItems = ref<GridItem[]>([]);
const originGridItems = ref<GridItem[]>([]);
const updateButtonDisabled = ref<boolean>(false);

const updatedItemsCount = computed(() => {
	return gridItems.value.filter((it, idx) => !it.checked && JSON.stringify(it) !== JSON.stringify(originGridItems.value[idx])).length;
});
const deleteItemsCount = computed(() => gridItems.value.filter(it => it.checked).length);

async function onUpdateButtonClicked() {
	const _items = gridItems.value;
	const _originItems = originGridItems.value;
	if (_items.length !== _originItems.length) {
		throw new Error('The number of items has been changed. Please refresh the page and try again.');
	}

	const updatedItems = _items.filter((it, idx) => !it.checked && JSON.stringify(it) !== JSON.stringify(_originItems[idx]));
	if (updatedItems.length === 0) {
		await os.alert({
			type: 'info',
			text: i18n.ts._customEmojisManager._local._list.alertUpdateEmojisNothingDescription,
		});
		return;
	}

	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.tsx._customEmojisManager._local._list.confirmUpdateEmojisDescription({ count: updatedItems.length }),
	});
	if (canceled) {
		return;
	}

	const action = () => {
		return updatedItems.map(item =>
			misskeyApi(
				'admin/emoji/update',
				{
					// eslint-disable-next-line
					id: item.id!,
					name: item.name,
					category: emptyStrToNull(item.category),
					aliases: emptyStrToEmptyArray(item.aliases),
					license: emptyStrToNull(item.license),
					isSensitive: item.isSensitive,
					localOnly: item.localOnly,
					roleIdsThatCanBeUsedThisEmojiAsReaction: item.roleIdsThatCanBeUsedThisEmojiAsReaction.map(it => it.id),
					fileId: item.fileId,
				})
				.then(() => ({ item, success: true, err: undefined }))
				.catch(err => ({ item, success: false, err })),
		);
	};

	const result = await os.promiseDialog(Promise.all(action()));
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

async function onDeleteButtonClicked() {
	const _items = gridItems.value;
	const _originItems = originGridItems.value;
	if (_items.length !== _originItems.length) {
		throw new Error('The number of items has been changed. Please refresh the page and try again.');
	}

	const deleteItems = _items.filter((it) => it.checked);
	if (deleteItems.length === 0) {
		await os.alert({
			type: 'info',
			text: i18n.ts._customEmojisManager._local._list.alertDeleteEmojisNothingDescription,
		});
		return;
	}

	const { canceled } = await os.confirm({
		type: 'info',
		text: i18n.tsx._customEmojisManager._local._list.confirmDeleteEmojisDescription({ count: deleteItems.length }),
	});
	if (canceled) {
		return;
	}

	async function action() {
		const deleteIds = deleteItems.map(it => it.id!);
		await misskeyApi('admin/emoji/delete-bulk', { ids: deleteIds });
	}

	await os.promiseDialog(
		action(),
	);
}

async function onGridResetButtonClicked() {
	const { canceled } = await os.confirm({
		type: 'warning',
		title: i18n.ts.resetAreYouSure,
		text: i18n.ts._customEmojisManager._local._list.confirmResetDescription,
	});

	if (canceled) return;

	refreshGridItems();
}

async function onSearchRequest() {
	await refreshCustomEmojis();
}

async function onPageChanged(pageNumber: number) {
	if (updatedItemsCount.value > 0) {
		const { canceled } = await os.confirm({
			type: 'warning',
			title: i18n.ts._customEmojisManager._local._list.confirmMovePage,
			text: i18n.ts._customEmojisManager._local._list.confirmMovePageDesciption,
		});
		if (canceled) return;
	}

	currentPage.value = pageNumber;
	await nextTick();
	refreshCustomEmojis();
}

function onGridEvent(event: GridEvent) {
	switch (event.type) {
		case 'cell-validation':
			onGridCellValidation(event);
			break;
		case 'cell-value-change':
			onGridCellValueChange(event);
			break;
	}
}

function onGridCellValidation(event: GridCellValidationEvent) {
	updateButtonDisabled.value = event.all.filter(it => !it.valid).length > 0;
}

function onGridCellValueChange(event: GridCellValueChangeEvent) {
	const { row, column, newValue } = event;
	if (gridItems.value.length > row.index && column.setting.bindTo in gridItems.value[row.index]) {
		gridItems.value[row.index][column.setting.bindTo] = newValue;
	}
}

async function refreshCustomEmojis() {
	const limit = searchQuery.value.limit;

	const query: Misskey.entities.V2AdminEmojiListRequest['query'] = {
		name: emptyStrToUndefined(searchQuery.value.name),
		type: emptyStrToUndefined(searchQuery.value.type),
		aliases: emptyStrToUndefined(searchQuery.value.aliases),
		category: emptyStrToUndefined(searchQuery.value.category),
		license: emptyStrToUndefined(searchQuery.value.license),
		isSensitive: searchQuery.value.sensitive ? Boolean(searchQuery.value.sensitive).valueOf() : undefined,
		localOnly: searchQuery.value.localOnly ? Boolean(searchQuery.value.localOnly).valueOf() : undefined,
		updatedAtFrom: emptyStrToUndefined(searchQuery.value.updatedAtFrom),
		updatedAtTo: emptyStrToUndefined(searchQuery.value.updatedAtTo),
		roleIds: searchQuery.value.roles.map(it => it.id),
		hostType: 'local',
	};

	if (JSON.stringify(query) !== previousQuery.value) {
		currentPage.value = 1;
	}

	const result = await loadingHandler.scope(() => misskeyApi('v2/admin/emoji/list', {
		query: query,
		limit: limit,
		page: currentPage.value,
		sortKeys: sortOrders.value.map(({ key, direction }) => `${direction}${key}` as any),
	}));

	customEmojis.value = result.emojis;
	allPages.value = result.allPages;

	previousQuery.value = JSON.stringify(query);

	refreshGridItems();
}

function refreshGridItems() {
	gridItems.value = customEmojis.value.map(it => ({
		checked: false,
		id: it.id,
		fileId: undefined,
		url: it.publicUrl,
		name: it.name,
		host: it.host ?? '',
		category: it.category ?? '',
		aliases: it.aliases.join(','),
		license: it.license ?? '',
		isSensitive: it.isSensitive,
		localOnly: it.localOnly,
		roleIdsThatCanBeUsedThisEmojiAsReaction: it.roleIdsThatCanBeUsedThisEmojiAsReaction,
		updatedAt: it.updatedAt,
		publicUrl: it.publicUrl,
		originalUrl: it.originalUrl,
		type: it.type,
	}));
	originGridItems.value = JSON.parse(JSON.stringify(gridItems.value));
}

onMounted(async () => {
	await refreshCustomEmojis();
});

const headerPageMetadata = computed(() => ({
	title: i18n.ts._customEmojisManager._local.tabTitleList,
	icon: 'ti ti-icons',
}));

const headerActions = computed(() => [{
	icon: 'ti ti-search',
	text: i18n.ts.search,
	handler: () => {
		if (searchWindowOpening) return;
		searchWindowOpening = true;
		const { dispose } = os.popup(defineAsyncComponent(() => import('./custom-emojis-manager.local.list.search.vue')), {
			query: searchQuery.value,
		}, {
			queryUpdated: (query: EmojiSearchQuery) => {
				searchQuery.value = query;
			},
			sortOrderUpdated: (orders: SortOrder<GridSortOrderKey>[]) => {
				sortOrders.value = orders;
			},
			search: () => {
				onSearchRequest();
			},
			closed: () => {
				dispose();
				searchWindowOpening = false;
			},
		});
	},
}, {
	icon: 'ti ti-list-numbers',
	text: i18n.ts._customEmojisManager._gridCommon.searchLimit,
	handler: (ev: MouseEvent) => {
		async function changeSearchLimit(to: number) {
			if (updatedItemsCount.value > 0) {
				const { canceled } = await os.confirm({
					type: 'warning',
					title: i18n.ts._customEmojisManager._local._list.confirmChangeView,
					text: i18n.ts._customEmojisManager._local._list.confirmMovePageDesciption,
				});
				if (canceled) return;
			}

			searchQuery.value.limit = to;
			refreshCustomEmojis();
		}

		os.popupMenu([{
			type: 'radioOption',
			text: '25',
			active: computed(() => searchQuery.value.limit === 25),
			action: () => changeSearchLimit(25),
		}, {
			type: 'radioOption',
			text: '50',
			active: computed(() => searchQuery.value.limit === 50),
			action: () => changeSearchLimit(50),
		}, {
			type: 'radioOption',
			text: '100',
			active: computed(() => searchQuery.value.limit === 100),
			action: () => changeSearchLimit(100),
		}], ev.currentTarget ?? ev.target);
	},
}, {
	icon: 'ti ti-notes',
	text: i18n.ts._customEmojisManager._gridCommon.registrationLogs,
	handler: () => {
		const { dispose } = os.popup(defineAsyncComponent(() => import('./custom-emojis-manager.local.list.logs.vue')), {
			logs: requestLogs.value,
		}, {
			closed: () => {
				dispose();
			},
		});
	}
}]);
</script>

<style module lang="scss">
.violationRow {
	background-color: var(--MI_THEME-infoWarnBg);
}

.changedRow {
	background-color: var(--MI_THEME-infoBg);
}

.editedRow {
	background-color: var(--MI_THEME-infoBg);
}

.main {
	height: calc(100vh - var(--MI-stickyTop) - var(--MI-stickyBottom));
	overflow: scroll;
}

.grid {
	width: max-content;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.footer {
	background-color: var(--MI_THEME-bg);

	padding: var(--MI-margin);
	border-top: 1px solid var(--MI_THEME-divider);

	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 8px;

	& .left {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: 8px;
	}

	& .center {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	& .right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-direction: row;
		gap: 8px;
	}
}

.divider {
	margin: 8px 0;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

</style>
