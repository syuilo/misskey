<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="rootEl"
	class="mk_grid_border"
	:class="[$style.grid, {
		[$style.noOverflowHandling]: rootSetting.noOverflowStyle,
		'mk_grid_root_rounded': rootSetting.rounded,
		'mk_grid_root_border': rootSetting.outerBorder,
	}]"
	@mousedown.prevent="onMouseDown"
	@keydown="onKeyDown"
	@contextmenu.prevent.stop="onContextMenu"
>
	<div class="mk_grid_thead">
		<MkHeaderRow
			:columns="columns"
			:gridSetting="rowSetting"
			:bus="bus"
			@operation:beginWidthChange="onHeaderCellWidthBeginChange"
			@operation:endWidthChange="onHeaderCellWidthEndChange"
			@operation:widthLargest="onHeaderCellWidthLargest"
			@change:width="onHeaderCellChangeWidth"
			@change:contentSize="onHeaderCellChangeContentSize"
		/>
	</div>
	<div class="mk_grid_tbody">
		<MkDataRow
			v-for="row in rows"
			v-show="row.using"
			:key="row.index"
			:row="row"
			:cells="cells[row.index].cells"
			:setting="rowSetting"
			:bus="bus"
			:using="row.using"
			:class="[lastLine === row.index ? 'last_row' : '']"
			@operation:beginEdit="onCellEditBegin"
			@operation:endEdit="onCellEditEnd"
			@change:value="onChangeCellValue"
			@change:contentSize="onChangeCellContentSize"
		/>
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch } from 'vue';
import { DataSource, GridEventEmitter, GridSetting, GridState, Size } from '@/components/grid/grid.js';
import MkDataRow from '@/components/grid/MkDataRow.vue';
import MkHeaderRow from '@/components/grid/MkHeaderRow.vue';
import { cellValidation } from '@/components/grid/cell-validators.js';
import { CELL_ADDRESS_NONE, CellAddress, CellValue, createCell, GridCell, resetCell } from '@/components/grid/cell.js';
import {
	copyGridDataToClipboard,
	equalCellAddress,
	getCellAddress,
	getCellElement,
	pasteToGridFromClipboard,
	removeDataFromGrid,
} from '@/components/grid/grid-utils.js';
import { MenuItem } from '@/types/menu.js';
import * as os from '@/os.js';
import { GridContext, GridEvent } from '@/components/grid/grid-event.js';
import { createColumn, GridColumn } from '@/components/grid/column.js';
import { createRow, defaultGridRowSetting, GridRow, GridRowSetting, resetRow } from '@/components/grid/row.js';
import { handleKeyEvent } from '@/scripts/key-event.js';

type RowHolder = {
	row: GridRow,
	cells: GridCell[],
	origin: DataSource,
}

const emit = defineEmits<{
	(ev: 'event', event: GridEvent, context: GridContext): void;
}>();

const props = defineProps<{
	settings: GridSetting;
	data: DataSource[];
}>();

const rootSetting: Required<GridSetting['root']> = {
	noOverflowStyle: false,
	rounded: true,
	outerBorder: true,
	...props.settings.root,
};

// non-reactive
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const rowSetting: Required<GridRowSetting> = {
	...defaultGridRowSetting,
	...props.settings.row,
};

// non-reactive
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const columnSettings = props.settings.cols;

// non-reactive
const cellSettings = props.settings.cells ?? {};

const { data } = toRefs(props);

// #region Event Definitions
// region Event Definitions

/**
 * grid -> 各子コンポーネントのイベント経路を担う{@link GridEventEmitter}。おもにpropsでの伝搬が難しいイベントを伝搬するために使用する。
 * 子コンポーネント -> gridのイベントでは原則使用せず、{@link emit}を使用する。
 */
const bus = new GridEventEmitter();
/**
 * テーブルコンポーネントのリサイズイベントを監視するための{@link ResizeObserver}。
 * 表示切替を検知し、サイズの再計算要求を発行するために使用する（マウント時にコンテンツが表示されていない場合、初手のサイズの自動計算が正常に働かないため）
 *
 * {@link setTimeout}を経由している理由は、{@link onResize}の中でサイズ再計算要求→サイズ変更が発生するとループとみなされ、
 * 「ResizeObserver loop completed with undelivered notifications.」という警告が発生するため（再計算が完全に終われば通知は発生しなくなるので実際にはループしない）
 *
 * @see {@link onResize}
 */
const resizeObserver = new ResizeObserver((entries) => setTimeout(() => onResize(entries)));

const rootEl = ref<InstanceType<typeof HTMLTableElement>>();
/**
 * グリッドの最も上位にある状態。
 */
const state = ref<GridState>('normal');
/**
 * グリッドの列定義。列定義の元の設定値は非リアクティブなので、初期値を生成して以降は変更しない。
 */
const columns = ref<GridColumn[]>(columnSettings.map(createColumn));
/**
 * グリッドの行定義。propsで受け取った{@link data}をもとに、{@link refreshData}で再計算される。
 */
const rows = ref<GridRow[]>([]);
/**
 * グリッドのセル定義。propsで受け取った{@link data}をもとに、{@link refreshData}で再計算される。
 */
const cells = ref<RowHolder[]>([]);

/**
 * mousemoveイベントが発生した際に、イベントから取得したセルアドレスを保持するための変数。
 * セルアドレスが変わった瞬間にイベントを起こしたい時のために前回値として使用する。
 */
const previousCellAddress = ref<CellAddress>(CELL_ADDRESS_NONE);
/**
 * 編集中のセルのアドレスを保持するための変数。
 */
const editingCellAddress = ref<CellAddress>(CELL_ADDRESS_NONE);
/**
 * 列の範囲選択をする際の開始地点となるインデックスを保持するための変数。
 * この開始地点からマウスが動いた地点までの範囲を選択する。
 */
const firstSelectionColumnIdx = ref<number>(CELL_ADDRESS_NONE.col);
/**
 * 行の範囲選択をする際の開始地点となるインデックスを保持するための変数。
 * この開始地点からマウスが動いた地点までの範囲を選択する。
 */
const firstSelectionRowIdx = ref<number>(CELL_ADDRESS_NONE.row);

/**
 * 選択状態のセルを取得するための計算プロパティ。選択状態とは{@link GridCell.selected}がtrueのセルのこと。
 */
const selectedCell = computed(() => {
	const selected = cells.value.flatMap(it => it.cells).filter(it => it.selected);
	return selected.length > 0 ? selected[0] : undefined;
});
/**
 * 範囲選択状態のセルを取得するための計算プロパティ。範囲選択状態とは{@link GridCell.ranged}がtrueのセルのこと。
 */
const rangedCells = computed(() => cells.value.flatMap(it => it.cells).filter(it => it.ranged));
/**
 * 範囲選択状態のセルの範囲を取得するための計算プロパティ。左上のセル番地と右下のセル番地を計算する。
 */
const rangedBounds = computed(() => {
	const _cells = rangedCells.value;
	const _cols = _cells.map(it => it.address.col);
	const _rows = _cells.map(it => it.address.row);

	const leftTop = {
		col: Math.min(..._cols),
		row: Math.min(..._rows),
	};
	const rightBottom = {
		col: Math.max(..._cols),
		row: Math.max(..._rows),
	};

	return {
		leftTop,
		rightBottom,
	};
});
/**
 * グリッドの中で使用可能なセルの範囲を取得するための計算プロパティ。左上のセル番地と右下のセル番地を計算する。
 */
const availableBounds = computed(() => {
	const leftTop = {
		col: 0,
		row: 0,
	};
	const rightBottom = {
		col: Math.max(...columns.value.map(it => it.index)),
		row: Math.max(...rows.value.filter(it => it.using).map(it => it.index)),
	};
	return { leftTop, rightBottom };
});
/**
 * 範囲選択状態の行を取得するための計算プロパティ。範囲選択状態とは{@link GridRow.ranged}がtrueの行のこと。
 */
const rangedRows = computed(() => rows.value.filter(it => it.ranged));

const lastLine = computed(() => rows.value.filter(it => it.using).length - 1);

// endregion
// #endregion

watch(data, patchData, { deep: true });

if (_DEV_) {
	watch(state, (value, oldValue) => {
		console.log(`[grid][state] ${oldValue} -> ${value}`);
	});
}

// #region Event Handlers
// region Event Handlers

function onResize(entries: ResizeObserverEntry[]) {
	if (entries.length !== 1 || entries[0].target !== rootEl.value) {
		return;
	}

	const contentRect = entries[0].contentRect;
	if (_DEV_) {
		console.log(`[grid][resize] contentRect: ${contentRect.width}x${contentRect.height}`);
	}

	switch (state.value) {
		case 'hidden': {
			if (contentRect.width > 0 && contentRect.height > 0) {
				// 先に状態を変更しておき、再計算要求が複数回走らないようにする
				state.value = 'normal';

				// 選択状態が狂うかもしれないので解除しておく
				unSelectionRangeAll();

				// 再計算要求を発行。各セル側で最低限必要な横幅を算出し、emitで返してくるようになっている
				bus.emit('forceRefreshContentSize');
			}
			break;
		}
		default: {
			if (contentRect.width === 0 || contentRect.height === 0) {
				state.value = 'hidden';
			}
			break;
		}
	}
}

function onKeyDown(ev: KeyboardEvent) {
	const { ctrlKey, shiftKey, code } = ev;
	if (_DEV_) {
		console.log(`[grid][key] ctrl: ${ctrlKey}, shift: ${shiftKey}, code: ${code}`);
	}

	function updateSelectionRange(newBounds: { leftTop: CellAddress, rightBottom: CellAddress }) {
		unSelectionOutOfRange(newBounds.leftTop, newBounds.rightBottom);
		expandCellRange(newBounds.leftTop, newBounds.rightBottom);
	}

	switch (state.value) {
		case 'normal': {
			ev.preventDefault();
			ev.stopPropagation();

			const selectedCellAddress = selectedCell.value?.address ?? CELL_ADDRESS_NONE;
			const max = availableBounds.value;
			const bounds = rangedBounds.value;

			handleKeyEvent(ev, [
				{
					code: 'Delete', handler: () => {
						if (rangedRows.value.length > 0) {
							if (rowSetting.events.delete) {
								rowSetting.events.delete(rangedRows.value);
							}
						} else {
							const context = createContext();
							removeDataFromGrid(context, (cell) => {
								emitCellValue(cell, undefined);
							});
						}
					},
				},
				{
					code: 'KeyC', modifiers: ['Control'], handler: () => {
						const context = createContext();
						copyGridDataToClipboard(data.value, context);
					},
				},
				{
					code: 'KeyV', modifiers: ['Control'], handler: async () => {
						const _cells = cells.value;
						const context = createContext();
						await pasteToGridFromClipboard(context, (row, col, parsedValue) => {
							emitCellValue(_cells[row.index].cells[col.index], parsedValue);
						});
					},
				},
				{
					code: 'ArrowRight', modifiers: ['Control', 'Shift'], handler: () => {
						updateSelectionRange({
							leftTop: { col: selectedCellAddress.col, row: bounds.leftTop.row },
							rightBottom: { col: max.rightBottom.col, row: bounds.rightBottom.row },
						});
					},
				},
				{
					code: 'ArrowLeft', modifiers: ['Control', 'Shift'], handler: () => {
						updateSelectionRange({
							leftTop: { col: max.leftTop.col, row: bounds.leftTop.row },
							rightBottom: { col: selectedCellAddress.col, row: bounds.rightBottom.row },
						});
					},
				},
				{
					code: 'ArrowUp', modifiers: ['Control', 'Shift'], handler: () => {
						updateSelectionRange({
							leftTop: { col: bounds.leftTop.col, row: max.leftTop.row },
							rightBottom: { col: bounds.rightBottom.col, row: selectedCellAddress.row },
						});
					},
				},
				{
					code: 'ArrowDown', modifiers: ['Control', 'Shift'], handler: () => {
						updateSelectionRange({
							leftTop: { col: bounds.leftTop.col, row: selectedCellAddress.row },
							rightBottom: { col: bounds.rightBottom.col, row: max.rightBottom.row },
						});
					},
				},
				{
					code: 'ArrowRight', modifiers: ['Shift'], handler: () => {
						updateSelectionRange({
							leftTop: {
								col: bounds.leftTop.col < selectedCellAddress.col
									? bounds.leftTop.col + 1
									: selectedCellAddress.col,
								row: bounds.leftTop.row,
							},
							rightBottom: {
								col: (bounds.rightBottom.col > selectedCellAddress.col || bounds.leftTop.col === selectedCellAddress.col)
									? bounds.rightBottom.col + 1
									: selectedCellAddress.col,
								row: bounds.rightBottom.row,
							},
						});
					},
				},
				{
					code: 'ArrowLeft', modifiers: ['Shift'], handler: () => {
						updateSelectionRange({
							leftTop: {
								col: (bounds.leftTop.col < selectedCellAddress.col || bounds.rightBottom.col === selectedCellAddress.col)
									? bounds.leftTop.col - 1
									: selectedCellAddress.col,
								row: bounds.leftTop.row,
							},
							rightBottom: {
								col: bounds.rightBottom.col > selectedCellAddress.col
									? bounds.rightBottom.col - 1
									: selectedCellAddress.col,
								row: bounds.rightBottom.row,
							},
						});
					},
				},
				{
					code: 'ArrowUp', modifiers: ['Shift'], handler: () => {
						updateSelectionRange({
							leftTop: {
								col: bounds.leftTop.col,
								row: (bounds.leftTop.row < selectedCellAddress.row || bounds.rightBottom.row === selectedCellAddress.row)
									? bounds.leftTop.row - 1
									: selectedCellAddress.row,
							},
							rightBottom: {
								col: bounds.rightBottom.col,
								row: bounds.rightBottom.row > selectedCellAddress.row
									? bounds.rightBottom.row - 1
									: selectedCellAddress.row,
							},
						});
					},
				},
				{
					code: 'ArrowDown', modifiers: ['Shift'], handler: () => {
						updateSelectionRange({
							leftTop: {
								col: bounds.leftTop.col,
								row: bounds.leftTop.row < selectedCellAddress.row
									? bounds.leftTop.row + 1
									: selectedCellAddress.row,
							},
							rightBottom: {
								col: bounds.rightBottom.col,
								row: (bounds.rightBottom.row > selectedCellAddress.row || bounds.leftTop.row === selectedCellAddress.row)
									? bounds.rightBottom.row + 1
									: selectedCellAddress.row,
							},
						});
					},
				},
				{
					code: 'ArrowDown', handler: () => {
						selectionCell({ col: selectedCellAddress.col, row: selectedCellAddress.row + 1 });
					},
				},
				{
					code: 'ArrowUp', handler: () => {
						selectionCell({ col: selectedCellAddress.col, row: selectedCellAddress.row - 1 });
					},
				},
				{
					code: 'ArrowRight', handler: () => {
						selectionCell({ col: selectedCellAddress.col + 1, row: selectedCellAddress.row });
					},
				},
				{
					code: 'ArrowLeft', handler: () => {
						selectionCell({ col: selectedCellAddress.col - 1, row: selectedCellAddress.row });
					},
				},
			]);

			break;
		}
	}
}

function onMouseDown(ev: MouseEvent) {
	switch (ev.button) {
		case 0: {
			onLeftMouseDown(ev);
			break;
		}
		case 2: {
			onRightMouseDown(ev);
			break;
		}
	}
}

function onLeftMouseDown(ev: MouseEvent) {
	const cellAddress = getCellAddress(ev.target as HTMLElement);
	if (_DEV_) {
		console.log(`[grid][mouse-left] state:${state.value}, button: ${ev.button}, cell: ${cellAddress.row}x${cellAddress.col}`);
	}

	switch (state.value) {
		case 'cellEditing': {
			if (availableCellAddress(cellAddress) && !equalCellAddress(editingCellAddress.value, cellAddress)) {
				selectionCell(cellAddress);
			}
			break;
		}
		case 'normal': {
			if (availableCellAddress(cellAddress)) {
				if (ev.shiftKey && selectedCell.value && !equalCellAddress(cellAddress, selectedCell.value.address)) {
					const selectedCellAddress = selectedCell.value.address;

					const leftTop = {
						col: Math.min(selectedCellAddress.col, cellAddress.col),
						row: Math.min(selectedCellAddress.row, cellAddress.row),
					};

					const rightBottom = {
						col: Math.max(selectedCellAddress.col, cellAddress.col),
						row: Math.max(selectedCellAddress.row, cellAddress.row),
					};

					unSelectionRangeAll();
					expandCellRange(leftTop, rightBottom);

					cells.value[selectedCellAddress.row].cells[selectedCellAddress.col].selected = true;
				} else {
					selectionCell(cellAddress);
				}

				previousCellAddress.value = cellAddress;

				registerMouseUp();
				registerMouseMove();
				state.value = 'cellSelecting';
			} else if (isColumnHeaderCellAddress(cellAddress)) {
				if (ev.shiftKey) {
					const rangedColumnIndexes = rangedCells.value.map(it => it.address.col);
					const targetColumnIndexes = [cellAddress.col, ...rangedColumnIndexes];
					unSelectionRangeAll();

					const leftTop = {
						col: Math.min(...targetColumnIndexes),
						row: 0,
					};

					const rightBottom = {
						col: Math.max(...targetColumnIndexes),
						row: cells.value.length - 1,
					};

					expandCellRange(leftTop, rightBottom);

					if (rangedColumnIndexes.length === 0) {
						firstSelectionColumnIdx.value = cellAddress.col;
					} else {
						if (cellAddress.col > Math.min(...rangedColumnIndexes)) {
							firstSelectionColumnIdx.value = Math.min(...rangedColumnIndexes);
						} else {
							firstSelectionColumnIdx.value = Math.max(...rangedColumnIndexes);
						}
					}
				} else {
					unSelectionRangeAll();

					const colCells = cells.value.map(row => row.cells[cellAddress.col]);
					selectionRange(...colCells.map(cell => cell.address));

					firstSelectionColumnIdx.value = cellAddress.col;
				}

				registerMouseUp();
				registerMouseMove();
				previousCellAddress.value = cellAddress;
				state.value = 'colSelecting';

				// フォーカスを当てないとキーイベントが拾えないので
				getCellElement(ev.target as HTMLElement)?.focus();
			} else if (isRowNumberCellAddress(cellAddress)) {
				if (ev.shiftKey) {
					const rangedRowIndexes = rangedRows.value.map(it => it.index);
					const targetRowIndexes = [cellAddress.row, ...rangedRowIndexes];
					unSelectionRangeAll();

					const leftTop = {
						col: 0,
						row: Math.min(...targetRowIndexes),
					};

					const rightBottom = {
						col: Math.min(...cells.value.map(it => it.cells.length - 1)),
						row: Math.max(...targetRowIndexes),
					};

					expandCellRange(leftTop, rightBottom);
					expandRowRange(Math.min(...targetRowIndexes), Math.max(...targetRowIndexes));

					if (rangedRowIndexes.length === 0) {
						firstSelectionRowIdx.value = cellAddress.row;
					} else {
						if (cellAddress.col > Math.min(...rangedRowIndexes)) {
							firstSelectionRowIdx.value = Math.min(...rangedRowIndexes);
						} else {
							firstSelectionRowIdx.value = Math.max(...rangedRowIndexes);
						}
					}
				} else {
					unSelectionRangeAll();
					const rowCells = cells.value[cellAddress.row].cells;
					selectionRange(...rowCells.map(cell => cell.address));
					expandRowRange(cellAddress.row, cellAddress.row);

					firstSelectionRowIdx.value = cellAddress.row;
				}

				registerMouseUp();
				registerMouseMove();
				previousCellAddress.value = cellAddress;
				state.value = 'rowSelecting';

				// フォーカスを当てないとキーイベントが拾えないので
				getCellElement(ev.target as HTMLElement)?.focus();
			}
			break;
		}
	}
}

function onRightMouseDown(ev: MouseEvent) {
	const cellAddress = getCellAddress(ev.target as HTMLElement);
	if (_DEV_) {
		console.log(`[grid][mouse-right] button: ${ev.button}, cell: ${cellAddress.row}x${cellAddress.col}`);
	}

	switch (state.value) {
		case 'normal': {
			if (!availableCellAddress(cellAddress)) {
				return;
			}

			const _rangedCells = [...rangedCells.value];
			if (!_rangedCells.some(it => equalCellAddress(it.address, cellAddress))) {
				// 範囲選択外を右クリックした場合は、範囲選択を解除（範囲選択内であれば範囲選択を維持する）
				selectionCell(cellAddress);
			}

			break;
		}
	}
}

function onMouseMove(ev: MouseEvent) {
	ev.preventDefault();

	const targetCellAddress = getCellAddress(ev.target as HTMLElement);
	if (equalCellAddress(previousCellAddress.value, targetCellAddress)) {
		// セルが変わるまでイベントを起こしたくない
		return;
	}

	if (_DEV_) {
		console.log(`[grid][mouse-move] button: ${ev.button}, cell: ${targetCellAddress.row}x${targetCellAddress.col}`);
	}

	switch (state.value) {
		case 'cellSelecting': {
			const selectedCellAddress = selectedCell.value?.address;
			if (!availableCellAddress(targetCellAddress) || !selectedCellAddress) {
				// 正しいセル範囲ではない
				return;
			}

			const leftTop = {
				col: Math.min(targetCellAddress.col, selectedCellAddress.col),
				row: Math.min(targetCellAddress.row, selectedCellAddress.row),
			};

			const rightBottom = {
				col: Math.max(targetCellAddress.col, selectedCellAddress.col),
				row: Math.max(targetCellAddress.row, selectedCellAddress.row),
			};

			// 範囲外のセルは選択解除し、範囲内のセルは選択状態にする
			unSelectionOutOfRange(leftTop, rightBottom);
			expandCellRange(leftTop, rightBottom);
			previousCellAddress.value = targetCellAddress;

			break;
		}
		case 'colSelecting': {
			if (!isColumnHeaderCellAddress(targetCellAddress) || previousCellAddress.value.col === targetCellAddress.col) {
				// セルが変わるまでイベントを起こしたくない
				return;
			}

			const leftTop = {
				col: Math.min(targetCellAddress.col, firstSelectionColumnIdx.value),
				row: 0,
			};

			const rightBottom = {
				col: Math.max(targetCellAddress.col, firstSelectionColumnIdx.value),
				row: cells.value.length - 1,
			};

			// 範囲外のセルは選択解除し、範囲内のセルは選択状態にする
			unSelectionOutOfRange(leftTop, rightBottom);
			expandCellRange(leftTop, rightBottom);
			previousCellAddress.value = targetCellAddress;

			// フォーカスを当てないとキーイベントが拾えないので
			getCellElement(ev.target as HTMLElement)?.focus();

			break;
		}
		case 'rowSelecting': {
			if (!isRowNumberCellAddress(targetCellAddress) || previousCellAddress.value.row === targetCellAddress.row) {
				// セルが変わるまでイベントを起こしたくない
				return;
			}

			const leftTop = {
				col: 0,
				row: Math.min(targetCellAddress.row, firstSelectionRowIdx.value),
			};

			const rightBottom = {
				col: Math.min(...cells.value.map(it => it.cells.length - 1)),
				row: Math.max(targetCellAddress.row, firstSelectionRowIdx.value),
			};

			// 範囲外のセルは選択解除し、範囲内のセルは選択状態にする
			unSelectionOutOfRange(leftTop, rightBottom);
			expandCellRange(leftTop, rightBottom);

			// 行も同様に
			const rangedRowIndexes = [rows.value[targetCellAddress.row].index, ...rangedRows.value.map(it => it.index)];
			expandRowRange(Math.min(...rangedRowIndexes), Math.max(...rangedRowIndexes));

			previousCellAddress.value = targetCellAddress;

			// フォーカスを当てないとキーイベントが拾えないので
			getCellElement(ev.target as HTMLElement)?.focus();

			break;
		}
	}
}

function onMouseUp(ev: MouseEvent) {
	ev.preventDefault();
	switch (state.value) {
		case 'rowSelecting':
		case 'colSelecting':
		case 'cellSelecting': {
			unregisterMouseUp();
			unregisterMouseMove();
			state.value = 'normal';
			previousCellAddress.value = CELL_ADDRESS_NONE;
			break;
		}
	}
}

function onContextMenu(ev: MouseEvent) {
	const cellAddress = getCellAddress(ev.target as HTMLElement);
	if (_DEV_) {
		console.log(`[grid][context-menu] button: ${ev.button}, cell: ${cellAddress.row}x${cellAddress.col}`);
	}

	const context = createContext();
	const menuItems = Array.of<MenuItem>();
	switch (true) {
		// 通常セルのコンテキストメニュー作成
		case availableCellAddress(cellAddress): {
			const cell = cells.value[cellAddress.row].cells[cellAddress.col];
			if (cell.setting.contextMenuFactory) {
				menuItems.push(...cell.setting.contextMenuFactory(cell.column, cell.row, cell.value, context));
			}
			break;
		}
		// 列ヘッダセルのコンテキストメニュー作成
		case isColumnHeaderCellAddress(cellAddress): {
			const col = columns.value[cellAddress.col];
			if (col.setting.contextMenuFactory) {
				menuItems.push(...col.setting.contextMenuFactory(col, context));
			}
			break;
		}
		// 行ヘッダセルのコンテキストメニュー作成
		case isRowNumberCellAddress(cellAddress): {
			const row = rows.value[cellAddress.row];
			if (row.setting.contextMenuFactory) {
				menuItems.push(...row.setting.contextMenuFactory(row, context));
			}
			break;
		}
	}

	if (menuItems.length > 0) {
		os.contextMenu(menuItems, ev);
	}
}

function onCellEditBegin(sender: GridCell) {
	state.value = 'cellEditing';
	editingCellAddress.value = sender.address;
	for (const cell of cells.value.flatMap(it => it.cells)) {
		if (cell.address.col !== sender.address.col || cell.address.row !== sender.address.row) {
			// 編集状態となったセル以外は全部選択解除
			cell.selected = false;
		}
	}
}

function onCellEditEnd() {
	editingCellAddress.value = CELL_ADDRESS_NONE;
	state.value = 'normal';
}

function onChangeCellValue(sender: GridCell, newValue: CellValue) {
	applyRowRules([sender]);
	emitCellValue(sender, newValue);
}

function onChangeCellContentSize(sender: GridCell, contentSize: Size) {
	const _cells = cells.value;
	if (_cells.length > sender.address.row && _cells[sender.address.row].cells.length > sender.address.col) {
		const currentSize = _cells[sender.address.row].cells[sender.address.col].contentSize;
		if (currentSize.width !== contentSize.width || currentSize.height !== contentSize.height) {
			// 通常セルのセル幅が確定したら、そのサイズを保持しておく（内容に引っ張られて想定よりも大きいセルサイズにならないようにするためのCSS作成に使用）
			_cells[sender.address.row].cells[sender.address.col].contentSize = contentSize;

			if (sender.column.setting.width === 'auto') {
				calcLargestCellWidth(sender.column);
			}
		}
	}
}

function onHeaderCellWidthBeginChange() {
	switch (state.value) {
		case 'normal': {
			state.value = 'colResizing';
			break;
		}
	}
}

function onHeaderCellWidthEndChange() {
	switch (state.value) {
		case 'colResizing': {
			state.value = 'normal';
			break;
		}
	}
}

function onHeaderCellChangeWidth(sender: GridColumn, width: string) {
	switch (state.value) {
		case 'colResizing': {
			const column = columns.value[sender.index];
			column.width = width;
			break;
		}
	}
}

function onHeaderCellChangeContentSize(sender: GridColumn, newSize: Size) {
	switch (state.value) {
		case 'normal': {
			const currentSize = columns.value[sender.index].contentSize;
			if (currentSize.width !== newSize.width || currentSize.height !== newSize.height) {
				// ヘッダセルのセル幅が確定したら、そのサイズを保持しておく（内容に引っ張られて想定よりも大きいセルサイズにならないようにするためのCSS作成に使用）
				columns.value[sender.index].contentSize = newSize;

				if (sender.setting.width === 'auto') {
					calcLargestCellWidth(sender);
				}
			}
			break;
		}
	}
}

function onHeaderCellWidthLargest(sender: GridColumn) {
	switch (state.value) {
		case 'normal': {
			calcLargestCellWidth(sender);
			break;
		}
	}
}

// endregion
// #endregion

// #region Methods
// region Methods

/**
 * カラム内のコンテンツを表示しきるために必要な横幅と、各セルのコンテンツを表示しきるために必要な横幅を比較し、大きい方を列全体の横幅として採用する。
 */
function calcLargestCellWidth(column: GridColumn) {
	const _cells = cells.value;
	const largestColumnWidth = columns.value[column.index].contentSize.width;

	const largestCellWidth = (_cells.length > 0)
		? _cells
			.map(row => row.cells[column.index])
			.reduce(
				(acc, value) => Math.max(acc, value.contentSize.width),
				0,
			)
		: 0;

	if (_DEV_) {
		console.log(`[grid][calc-largest] idx:${column.setting.bindTo}, col:${largestColumnWidth}, cell:${largestCellWidth}`);
	}

	column.width = `${Math.max(largestColumnWidth, largestCellWidth)}px`;
}

/**
 * {@link emit}を使用してイベントを発行する。
 */
function emitGridEvent(ev: GridEvent) {
	const currentState: GridContext = {
		selectedCell: selectedCell.value,
		rangedCells: rangedCells.value,
		rangedRows: rangedRows.value,
		randedBounds: rangedBounds.value,
		availableBounds: availableBounds.value,
		state: state.value,
		rows: rows.value,
		columns: columns.value,
	};

	emit(
		'event',
		ev,
		currentState,
	);
}

/**
 * 親コンポーネントに新しい値を通知する。
 * 新しい値は、イベント通知→元データへの反映→再計算（バリデーション含む）→再描画の流れで反映される。
 */
function emitCellValue(sender: GridCell | CellAddress, newValue: CellValue) {
	const cellAddress = 'address' in sender ? sender.address : sender;
	const cell = cells.value[cellAddress.row].cells[cellAddress.col];

	emitGridEvent({
		type: 'cell-value-change',
		column: cell.column,
		row: cell.row,
		oldValue: cell.value,
		newValue: newValue,
	});

	if (_DEV_) {
		console.log(`[grid][cell-value] row:${cell.row}, col:${cell.column.index}, value:${newValue}`);
	}
}

/**
 * {@link target}のセルを選択状態にする。
 * その際、{@link target}以外の行およびセルの範囲選択状態を解除する。
 */
function selectionCell(target: CellAddress) {
	if (!availableCellAddress(target)) {
		return;
	}

	unSelectionRangeAll();

	const _cells = cells.value;
	_cells[target.row].cells[target.col].selected = true;
	_cells[target.row].cells[target.col].ranged = true;
}

/**
 * {@link targets}のセルを範囲選択状態にする。
 */
function selectionRange(...targets: CellAddress[]) {
	const _cells = cells.value;
	for (const target of targets) {
		const row = _cells[target.row];
		if (row.row.using) {
			row.cells[target.col].ranged = true;
		}
	}
}

/**
 * 行およびセルの範囲選択状態をすべて解除する。
 */
function unSelectionRangeAll() {
	const _cells = rangedCells.value;
	for (const cell of _cells) {
		cell.selected = false;
		cell.ranged = false;
	}

	const _rows = rows.value.filter(it => it.using);
	for (const row of _rows) {
		row.ranged = false;
	}
}

/**
 * {@link leftTop}から{@link rightBottom}の範囲外にあるセルを範囲選択状態から外す。
 */
function unSelectionOutOfRange(leftTop: CellAddress, rightBottom: CellAddress) {
	const safeBounds = getSafeAddressBounds({ leftTop, rightBottom });

	const _cells = rangedCells.value;
	for (const cell of _cells) {
		const outOfRangeCol = cell.address.col < safeBounds.leftTop.col || cell.address.col > safeBounds.rightBottom.col;
		const outOfRangeRow = cell.address.row < safeBounds.leftTop.row || cell.address.row > safeBounds.rightBottom.row;
		if (outOfRangeCol || outOfRangeRow) {
			cell.ranged = false;
		}
	}

	const outOfRangeRows = rows.value.filter((_, index) => index < safeBounds.leftTop.row || index > safeBounds.rightBottom.row);
	for (const row of outOfRangeRows) {
		row.ranged = false;
	}
}

/**
 * {@link leftTop}から{@link rightBottom}の範囲内にあるセルを範囲選択状態にする。
 */
function expandCellRange(leftTop: CellAddress, rightBottom: CellAddress) {
	const safeBounds = getSafeAddressBounds({ leftTop, rightBottom });
	const targetRows = cells.value.slice(safeBounds.leftTop.row, safeBounds.rightBottom.row + 1);
	for (const row of targetRows) {
		for (const cell of row.cells.slice(safeBounds.leftTop.col, safeBounds.rightBottom.col + 1)) {
			cell.ranged = true;
		}
	}
}

/**
 * {@link top}から{@link bottom}までの行を範囲選択状態にする。
 */
function expandRowRange(top: number, bottom: number) {
	if (!rowSetting.selectable) {
		return;
	}

	const targetRows = rows.value.slice(top, bottom + 1);
	for (const row of targetRows) {
		row.ranged = true;
	}
}

/**
 * 特定の条件下でのみ適用されるCSSを反映する。
 */
function applyRowRules(targetCells: GridCell[]) {
	const _rows = rows.value;
	const targetRowIdxes = [...new Set(targetCells.map(it => it.address.row))];
	const rowGroups = Array.of<{ row: GridRow, cells: GridCell[] }>();
	for (const rowIdx of targetRowIdxes) {
		const rowGroup = targetCells.filter(it => it.address.row === rowIdx);
		rowGroups.push({ row: _rows[rowIdx], cells: rowGroup });
	}

	const _cells = cells.value;
	for (const group of rowGroups.filter(it => it.row.using)) {
		const row = group.row;
		const targetCols = group.cells.map(it => it.column);
		const rowCells = _cells[group.row.index].cells;

		const newStyles = rowSetting.styleRules
			.filter(it => it.condition({ row, targetCols, cells: rowCells }))
			.map(it => it.applyStyle);

		if (JSON.stringify(newStyles) !== JSON.stringify(row.additionalStyles)) {
			row.additionalStyles = newStyles;
		}
	}
}

function availableCellAddress(cellAddress: CellAddress): boolean {
	const safeBounds = availableBounds.value;
	return cellAddress.row >= safeBounds.leftTop.row &&
		cellAddress.col >= safeBounds.leftTop.col &&
		cellAddress.row <= safeBounds.rightBottom.row &&
		cellAddress.col <= safeBounds.rightBottom.col;
}

function isColumnHeaderCellAddress(cellAddress: CellAddress): boolean {
	return cellAddress.row === -1 && cellAddress.col >= 0;
}

function isRowNumberCellAddress(cellAddress: CellAddress): boolean {
	return cellAddress.row >= 0 && cellAddress.col === -1;
}

function getSafeAddressBounds(
	bounds: { leftTop: CellAddress, rightBottom: CellAddress },
): { leftTop: CellAddress, rightBottom: CellAddress } {
	const available = availableBounds.value;

	const safeLeftTop = {
		col: Math.max(bounds.leftTop.col, available.leftTop.col),
		row: Math.max(bounds.leftTop.row, available.leftTop.row),
	};
	const safeRightBottom = {
		col: Math.min(bounds.rightBottom.col, available.rightBottom.col),
		row: Math.min(bounds.rightBottom.row, available.rightBottom.row),
	};

	return { leftTop: safeLeftTop, rightBottom: safeRightBottom };
}

function registerMouseMove() {
	unregisterMouseMove();
	addEventListener('mousemove', onMouseMove);
}

function unregisterMouseMove() {
	removeEventListener('mousemove', onMouseMove);
}

function registerMouseUp() {
	unregisterMouseUp();
	addEventListener('mouseup', onMouseUp);
}

function unregisterMouseUp() {
	removeEventListener('mouseup', onMouseUp);
}

function createContext(): GridContext {
	return {
		selectedCell: selectedCell.value,
		rangedCells: rangedCells.value,
		rangedRows: rangedRows.value,
		randedBounds: rangedBounds.value,
		availableBounds: availableBounds.value,
		state: state.value,
		rows: rows.value,
		columns: columns.value,
	};
}

function refreshData() {
	if (_DEV_) {
		console.log('[grid][refresh-data][begin]');
	}

	// データを元に行・列・セルを作成する。
	// 行は元データの配列の長さに応じて作成するが、最低限の行数は設定によって決まる。
	// 行数が変わるたびに都度レンダリングするとパフォーマンスがイマイチなので、あらかじめ多めにセルを用意しておくための措置。
	const _data: DataSource[] = data.value;
	const _rows: GridRow[] = (_data.length > rowSetting.minimumDefinitionCount)
		? _data.map((_, index) => createRow(index, true, rowSetting))
		: Array.from({ length: rowSetting.minimumDefinitionCount }, (_, index) => createRow(index, index < _data.length, rowSetting));
	const _cols: GridColumn[] = columns.value;

	// 行・列の定義から、元データの配列より値を取得してセルを作成する。
	// 行・列の定義はそれぞれインデックスを持っており、そのインデックスは元データの配列番地に対応している。
	const _cells: RowHolder[] = _rows.map(row => {
		const newCells = row.using
			? _cols.map(col => createCell(col, row, _data[row.index][col.setting.bindTo], cellSettings))
			: _cols.map(col => createCell(col, row, undefined, cellSettings));

		return { row, cells: newCells, origin: _data[row.index] };
	});

	rows.value = _rows;
	cells.value = _cells;

	const allCells = _cells.filter(it => it.row.using).flatMap(it => it.cells);
	for (const cell of allCells) {
		cell.violation = cellValidation(allCells, cell, cell.value);
	}

	applyRowRules(allCells);

	if (_DEV_) {
		console.log('[grid][refresh-data][end]');
	}
}

/**
 * セル値を部分更新する。この関数は、外部起因でデータが変更された場合に呼ばれる。
 *
 * 外部起因でデータが変更された場合は{@link data}の値が変更されるが、何処の番地がどのように変わったのかまでは検知できない。
 * セルをすべて作り直せばいいが、その手法だと以下のデメリットがある。
 * - 描画負荷がかかる
 * - 各セルが持つ個別の状態（選択中状態やバリデーション結果など）が失われる
 *
 * そこで、新しい値とセルが持つ値を突き合わせ、変更があった場合のみ値を更新し、セルそのものは使いまわしつつ値を最新化する。
 */
function patchData(newItems: DataSource[]) {
	if (_DEV_) {
		console.log('[grid][patch-data][begin]');
	}

	const _cols = columns.value;

	if (rows.value.length < newItems.length) {
		const newRows = Array.of<GridRow>();
		const newCells = Array.of<RowHolder>();

		// 未使用の行を含めても足りないので新しい行を追加する
		for (let rowIdx = rows.value.length; rowIdx < newItems.length; rowIdx++) {
			const newRow = createRow(rowIdx, true, rowSetting);
			newRows.push(newRow);
			newCells.push({
				row: newRow,
				cells: _cols.map(col => createCell(col, newRow, newItems[rowIdx][col.setting.bindTo], cellSettings)),
				origin: newItems[rowIdx],
			});
		}

		rows.value.push(...newRows);
		cells.value.push(...newCells);

		applyRowRules(newCells.flatMap(it => it.cells));
	}

	// 行数の上限が欲しい場合はここに設けてもいいかもしれない

	const usingRows = rows.value.filter(it => it.using);
	if (usingRows.length > newItems.length) {
		// 行数が減っているので古い行をクリアする（再マウント・再レンダリングが重いので要素そのものは消さない）
		for (let rowIdx = newItems.length; rowIdx < usingRows.length; rowIdx++) {
			resetRow(rows.value[rowIdx]);
			for (let colIdx = 0; colIdx < _cols.length; colIdx++) {
				const holder = cells.value[rowIdx];
				holder.origin = {};
				resetCell(holder.cells[colIdx]);
			}
		}
	}

	// 新しい値と既に設定されていた値を入れ替える
	const changedCells = Array.of<GridCell>();
	for (let rowIdx = 0; rowIdx < newItems.length; rowIdx++) {
		const holder = cells.value[rowIdx];
		holder.row.using = true;

		const oldCells = holder.cells;
		const newItem = newItems[rowIdx];
		for (let colIdx = 0; colIdx < oldCells.length; colIdx++) {
			const _col = columns.value[colIdx];

			const oldCell = oldCells[colIdx];
			const newValue = newItem[_col.setting.bindTo];
			if (oldCell.value !== newValue) {
				oldCell.value = _col.setting.valueTransformer
					? _col.setting.valueTransformer(holder.row, _col, newValue)
					: newValue;
				changedCells.push(oldCell);
			}
		}
	}

	if (changedCells.length > 0) {
		const allCells = cells.value.slice(0, newItems.length).flatMap(it => it.cells);
		for (const cell of allCells) {
			cell.violation = cellValidation(allCells, cell, cell.value);
		}

		applyRowRules(changedCells);

		// セル値が書き換わっており、バリデーションの結果も変わっているので外部に通知する必要がある
		emitGridEvent({
			type: 'cell-validation',
			all: cells.value
				.filter(it => it.row.using)
				.flatMap(it => it.cells)
				.map(it => it.violation)
				.filter(it => !it.valid),
		});
	}

	if (_DEV_) {
		console.log('[grid][patch-data][end]');
	}
}

// endregion
// #endregion

onMounted(() => {
	state.value = 'normal';

	const bindToList = columnSettings.map(it => it.bindTo);
	if (new Set(bindToList).size !== columnSettings.length) {
		// 取得元のプロパティ名重複は許容したくない
		throw new Error(`Duplicate bindTo setting : [${bindToList.join(',')}]}]`);
	}

	if (rootEl.value) {
		resizeObserver.observe(rootEl.value);

		// 初期表示時にコンテンツが表示されていない場合はhidden状態にしておく。
		// コンテンツ表示時にresizeイベントが発生するが、そのときにhidden状態にしておかないとサイズの再計算が走らないので
		const bounds = rootEl.value.getBoundingClientRect();
		if (bounds.width === 0 || bounds.height === 0) {
			state.value = 'hidden';
		}
	}

	refreshData();
});
</script>

<style module lang="scss">
.grid {
	font-size: 90%;
	overflow-x: scroll;
	// firefoxだとスクロールバーがセルに重なって見づらくなってしまうのでスペースを空けておく
	padding-bottom: 8px;

	&.noOverflowHandling {
		overflow-x: revert;
		padding-bottom: 0;
	}
}
</style>

<style lang="scss">
$borderSetting: solid 0.5px var(--MI_THEME-divider);

// 配下コンポーネントを含めて一括してコントロールするため、scopedもmoduleも使用できない
.mk_grid_border {
	--rootBorderSetting: none;
	--borderRadius: 0;

	border-spacing: 0;

	&.mk_grid_root_border {
		--rootBorderSetting: #{$borderSetting};
	}

	&.mk_grid_root_rounded {
		--borderRadius: var(--MI-radius);
	}

	.mk_grid_thead {
		.mk_grid_tr {
			.mk_grid_th {
				border-left: $borderSetting;
				border-top: var(--rootBorderSetting);

				&:first-child {
					// 左上セル
					border-left: var(--rootBorderSetting);
					border-top-left-radius: var(--borderRadius);
				}

				&:last-child {
					// 右上セル
					border-top-right-radius: var(--borderRadius);
					border-right: var(--rootBorderSetting);
				}
			}
		}
	}

	.mk_grid_tbody {
		.mk_grid_tr {
			.mk_grid_td, .mk_grid_th {
				border-left: $borderSetting;
				border-top: $borderSetting;

				&:first-child {
					// 左端の列
					border-left: var(--rootBorderSetting);
				}

				&:last-child {
					// 一番右端の列
					border-right: var(--rootBorderSetting);
				}
			}
		}

		.last_row {
			.mk_grid_td, .mk_grid_th {
				// 一番下の行
				border-bottom: var(--rootBorderSetting);

				&:first-child {
					// 左下セル
					border-bottom-left-radius: var(--borderRadius);
				}

				&:last-child {
					// 右下セル
					border-bottom-right-radius: var(--borderRadius);
				}
			}
		}
	}
}
</style>
