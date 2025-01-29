/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CellAddress, CellValue, GridCell } from '@/components/grid/cell.js';
import { GridState } from '@/components/grid/grid.js';
import { ValidateViolation } from '@/components/grid/cell-validators.js';
import { GridColumn } from '@/components/grid/column.js';
import { GridRow } from '@/components/grid/row.js';

export type GridContext = {
	selectedCell?: GridCell;
	rangedCells: GridCell[];
	rangedRows: GridRow[];
	randedBounds: {
		leftTop: CellAddress;
		rightBottom: CellAddress;
	};
	availableBounds: {
		leftTop: CellAddress;
		rightBottom: CellAddress;
	};
	state: GridState;
	rows: GridRow[];
	columns: GridColumn[];
};

export type GridEvent =
	GridCellValueChangeEvent |
	GridCellValidationEvent
	;

export type GridCellValueChangeEvent = {
	type: 'cell-value-change';
	column: GridColumn;
	row: GridRow;
	oldValue: CellValue;
	newValue: CellValue;
};

export type GridCellValidationEvent = {
	type: 'cell-validation';
	violation?: ValidateViolation;
	all: ValidateViolation[];
};
