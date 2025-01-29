/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ValidateViolation } from '@/components/grid/cell-validators.js';
import { Size } from '@/components/grid/grid.js';
import { GridColumn } from '@/components/grid/column.js';
import { GridRow } from '@/components/grid/row.js';
import { MenuItem } from '@/types/menu.js';
import { GridContext } from '@/components/grid/grid-event.js';

export type CellValue = string | boolean | number | undefined | null | Array<unknown> | NonNullable<unknown>;

export type CellAddress = {
	row: number;
	col: number;
}

export const CELL_ADDRESS_NONE: CellAddress = {
	row: -1,
	col: -1,
};

export type GridCell = {
	address: CellAddress;
	value: CellValue;
	column: GridColumn;
	row: GridRow;
	selected: boolean;
	ranged: boolean;
	contentSize: Size;
	setting: GridCellSetting;
	violation: ValidateViolation;
}

export type GridCellContextMenuFactory = (col: GridColumn, row: GridRow, value: CellValue, context: GridContext) => MenuItem[];

export type GridCellSetting = {
	contextMenuFactory?: GridCellContextMenuFactory;
}

export function createCell(
	column: GridColumn,
	row: GridRow,
	value: CellValue,
	setting: GridCellSetting,
): GridCell {
	const newValue = (row.using && column.setting.valueTransformer)
		? column.setting.valueTransformer(row, column, value)
		: value;

	return {
		address: { row: row.index, col: column.index },
		value: newValue,
		column,
		row,
		selected: false,
		ranged: false,
		contentSize: { width: 0, height: 0 },
		violation: {
			valid: true,
			params: {
				column,
				row,
				value,
				allCells: [],
			},
			violations: [],
		},
		setting,
	};
}

export function resetCell(cell: GridCell): void {
	cell.selected = false;
	cell.ranged = false;
	cell.violation = {
		valid: true,
		params: {
			column: cell.column,
			row: cell.row,
			value: cell.value,
			allCells: [],
		},
		violations: [],
	};
}
