/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { CellAddress, CellValue, GridCell } from '@/components/grid/cell.js';
import type { GridState } from '@/components/grid/grid.js';
import type { ValidateViolation } from '@/components/grid/cell-validators.js';
import type { GridColumn } from '@/components/grid/column.js';
import type { GridRow } from '@/components/grid/row.js';

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
