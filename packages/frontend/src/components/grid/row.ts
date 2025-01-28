/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AdditionalStyle } from '@/components/grid/grid.js';
import type { GridCell } from '@/components/grid/cell.js';
import type { GridColumn } from '@/components/grid/column.js';
import type { MenuItem } from '@/types/menu.js';
import type { GridContext } from '@/components/grid/grid-event.js';

export const defaultGridRowSetting: Required<GridRowSetting> = {
	showNumber: true,
	selectable: true,
	minimumDefinitionCount: 100,
	styleRules: [],
	contextMenuFactory: () => [],
	events: {},
};

export type GridRowStyleRuleConditionParams = {
	row: GridRow,
	targetCols: GridColumn[],
	cells: GridCell[]
};

export type GridRowStyleRule = {
	condition: (params: GridRowStyleRuleConditionParams) => boolean;
	applyStyle: AdditionalStyle;
}

export type GridRowContextMenuFactory = (row: GridRow, context: GridContext) => MenuItem[];

export type GridRowSetting = {
	showNumber?: boolean;
	selectable?: boolean;
	minimumDefinitionCount?: number;
	styleRules?: GridRowStyleRule[];
	contextMenuFactory?: GridRowContextMenuFactory;
	events?: {
		delete?: (rows: GridRow[]) => void;
	}
}

export type GridRow = {
	index: number;
	ranged: boolean;
	using: boolean;
	setting: GridRowSetting;
	additionalStyles: AdditionalStyle[];
}

export function createRow(index: number, using: boolean, setting: GridRowSetting): GridRow {
	return {
		index,
		ranged: false,
		using: using,
		setting,
		additionalStyles: [],
	};
}

export function resetRow(row: GridRow): void {
	row.ranged = false;
	row.using = false;
	row.additionalStyles = [];
}

