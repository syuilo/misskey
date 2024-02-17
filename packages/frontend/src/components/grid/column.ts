import { CellValidator } from '@/components/grid/cell-validators.js';
import { Size, SizeStyle } from '@/components/grid/grid.js';
import { calcCellWidth } from '@/components/grid/grid-utils.js';
import { CellValue } from '@/components/grid/cell.js';
import { GridRow } from '@/components/grid/row.js';
import { MenuItem } from '@/types/menu.js';
import { GridContext } from '@/components/grid/grid-event.js';

export type ColumnType = 'text' | 'number' | 'date' | 'boolean' | 'image' | 'hidden';

export type CustomValueEditor = (row: GridRow, col: GridColumn, value: CellValue, cellElement: HTMLElement) => Promise<CellValue>;
export type CellValueTransformer = (row: GridRow, col: GridColumn, value: CellValue) => CellValue;
export type GridColumnContextMenuFactory = (col: GridColumn, context: GridContext) => MenuItem[];

export type GridColumnSetting = {
	bindTo: string;
	title?: string;
	icon?: string;
	type: ColumnType;
	width: SizeStyle;
	editable?: boolean;
	validators?: CellValidator[];
	customValueEditor?: CustomValueEditor;
	valueTransformer?: CellValueTransformer;
	contextMenuFactory?: GridColumnContextMenuFactory;
};

export type GridColumn = {
	index: number;
	setting: GridColumnSetting;
	width: string;
	contentSize: Size;
}

export function createColumn(setting: GridColumnSetting, index: number): GridColumn {
	return {
		index,
		setting,
		width: calcCellWidth(setting.width),
		contentSize: { width: 0, height: 0 },
	};
}

