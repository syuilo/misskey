/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import { CellValue, GridCellSetting } from '@/components/grid/cell.js';
import { GridColumnSetting } from '@/components/grid/column.js';
import { GridRowSetting } from '@/components/grid/row.js';

export type GridSetting = {
	root?: {
		noOverflowStyle?: boolean;
		rounded?: boolean;
		outerBorder?: boolean;
	};
	row?: GridRowSetting;
	cols: GridColumnSetting[];
	cells?: GridCellSetting;
};

export type DataSource = Record<string, CellValue>;

export type GridState =
	'normal' |
	'cellSelecting' |
	'cellEditing' |
	'colResizing' |
	'colSelecting' |
	'rowSelecting' |
	'hidden'
	;

export type Size = {
	width: number;
	height: number;
}

export type SizeStyle = number | 'auto' | undefined;

export type AdditionalStyle = {
	className?: string;
	style?: Record<string, string | number>;
}

export class GridEventEmitter extends EventEmitter<{
	'forceRefreshContentSize': void;
}> {
}
