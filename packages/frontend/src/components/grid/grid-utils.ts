/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isRef, Ref } from 'vue';
import { DataSource, SizeStyle } from '@/components/grid/grid.js';
import { CELL_ADDRESS_NONE, CellAddress, CellValue, GridCell } from '@/components/grid/cell.js';
import { GridRow } from '@/components/grid/row.js';
import { GridContext } from '@/components/grid/grid-event.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { GridColumn, GridColumnSetting } from '@/components/grid/column.js';

export function isCellElement(elem: HTMLElement): boolean {
	return elem.hasAttribute('data-grid-cell');
}

export function isRowElement(elem: HTMLElement): boolean {
	return elem.hasAttribute('data-grid-row');
}

export function calcCellWidth(widthSetting: SizeStyle): string {
	switch (widthSetting) {
		case undefined:
		case 'auto': {
			return 'auto';
		}
		default: {
			return `${widthSetting}px`;
		}
	}
}

function getCellRowByAttribute(elem: HTMLElement): number {
	const row = elem.getAttribute('data-grid-cell-row');
	if (row === null) {
		throw new Error('data-grid-cell-row attribute not found');
	}
	return Number(row);
}

function getCellColByAttribute(elem: HTMLElement): number {
	const col = elem.getAttribute('data-grid-cell-col');
	if (col === null) {
		throw new Error('data-grid-cell-col attribute not found');
	}
	return Number(col);
}

export function getCellAddress(elem: HTMLElement, parentNodeCount = 10): CellAddress {
	let node = elem;
	for (let i = 0; i < parentNodeCount; i++) {
		if (!node.parentElement) {
			break;
		}

		if (isCellElement(node) && isRowElement(node.parentElement)) {
			const row = getCellRowByAttribute(node);
			const col = getCellColByAttribute(node);

			return { row, col };
		}

		node = node.parentElement;
	}

	return CELL_ADDRESS_NONE;
}

export function getCellElement(elem: HTMLElement, parentNodeCount = 10): HTMLElement | null {
	let node = elem;
	for (let i = 0; i < parentNodeCount; i++) {
		if (isCellElement(node)) {
			return node;
		}

		if (!node.parentElement) {
			break;
		}

		node = node.parentElement;
	}

	return null;
}

export function equalCellAddress(a: CellAddress, b: CellAddress): boolean {
	return a.row === b.row && a.col === b.col;
}

/**
 * グリッドの選択範囲の内容をタブ区切り形式テキストに変換してクリップボードにコピーする。
 */
export function copyGridDataToClipboard(
	gridItems: Ref<DataSource[]> | DataSource[],
	context: GridContext,
) {
	const items = isRef(gridItems) ? gridItems.value : gridItems;
	const lines = Array.of<string>();
	const bounds = context.randedBounds;

	for (let row = bounds.leftTop.row; row <= bounds.rightBottom.row; row++) {
		const rowItems = Array.of<string>();
		for (let col = bounds.leftTop.col; col <= bounds.rightBottom.col; col++) {
			const { bindTo, events } = context.columns[col].setting;
			const value = items[row][bindTo];
			const transformValue = events?.copy
				? events.copy(value)
				: typeof value === 'object' || Array.isArray(value)
					? JSON.stringify(value)
					: value?.toString() ?? '';
			rowItems.push(transformValue);
		}
		lines.push(rowItems.join('\t'));
	}

	const text = lines.join('\n');
	copyToClipboard(text);

	if (_DEV_) {
		console.log(`Copied to clipboard: ${text}`);
	}
}

/**
 * クリップボードからタブ区切りテキストとして値を読み取り、グリッドの選択範囲に貼り付けるためのユーティリティ関数。
 * …と言いつつも、使用箇所により反映方法に差があるため更新操作はコールバック関数に任せている。
 */
export async function pasteToGridFromClipboard(
	context: GridContext,
	callback: (row: GridRow, col: GridColumn, parsedValue: CellValue) => void,
) {
	function parseValue(value: string, setting: GridColumnSetting): CellValue {
		if (setting.events?.paste) {
			return setting.events.paste(value);
		} else {
			switch (setting.type) {
				case 'number': {
					return Number(value);
				}
				case 'boolean': {
					return value === 'true';
				}
				default: {
					return value;
				}
			}
		}
	}

	const clipBoardText = await navigator.clipboard.readText();
	if (_DEV_) {
		console.log(`Paste from clipboard: ${clipBoardText}`);
	}

	const bounds = context.randedBounds;
	const lines = clipBoardText.replace(/\r/g, '')
		.split('\n')
		.map(it => it.split('\t'));

	if (lines.length === 1 && lines[0].length === 1) {
		// 単独文字列の場合は選択範囲全体に同じテキストを貼り付ける
		const ranges = context.rangedCells;
		for (const cell of ranges) {
			if (cell.column.setting.editable) {
				callback(cell.row, cell.column, parseValue(lines[0][0], cell.column.setting));
			}
		}
	} else {
		// 表形式文字列の場合は表形式にパースし、選択範囲に合うように貼り付ける
		const offsetRow = bounds.leftTop.row;
		const offsetCol = bounds.leftTop.col;
		const { columns, rows } = context;
		for (let row = bounds.leftTop.row; row <= bounds.rightBottom.row; row++) {
			const rowIdx = row - offsetRow;
			if (lines.length <= rowIdx) {
				// クリップボードから読んだ二次元配列よりも選択範囲の方が大きい場合、貼り付け操作を打ち切る
				break;
			}

			const items = lines[rowIdx];
			for (let col = bounds.leftTop.col; col <= bounds.rightBottom.col; col++) {
				const colIdx = col - offsetCol;
				if (items.length <= colIdx) {
					// クリップボードから読んだ二次元配列よりも選択範囲の方が大きい場合、貼り付け操作を打ち切る
					break;
				}

				if (columns[col].setting.editable) {
					callback(rows[row], columns[col], parseValue(items[colIdx], columns[col].setting));
				}
			}
		}
	}
}

/**
 * グリッドの選択範囲にあるデータを削除するためのユーティリティ関数。
 * …と言いつつも、使用箇所により反映方法に差があるため更新操作はコールバック関数に任せている。
 */
export function removeDataFromGrid(
	context: GridContext,
	callback: (cell: GridCell) => void,
) {
	for (const cell of context.rangedCells) {
		const { editable, events } = cell.column.setting;
		if (editable) {
			if (events?.delete) {
				events.delete(cell, context);
			} else {
				callback(cell);
			}
		}
	}
}
