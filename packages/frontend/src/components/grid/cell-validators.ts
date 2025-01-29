/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { CellValue, GridCell } from '@/components/grid/cell.js';
import { GridColumn } from '@/components/grid/column.js';
import { GridRow } from '@/components/grid/row.js';
import { i18n } from '@/i18n.js';

export type ValidatorParams = {
	column: GridColumn;
	row: GridRow;
	value: CellValue;
	allCells: GridCell[];
};

export type ValidatorResult = {
	valid: boolean;
	message?: string;
}

export type GridCellValidator = {
	name?: string;
	ignoreViolation?: boolean;
	validate: (params: ValidatorParams) => ValidatorResult;
}

export type ValidateViolation = {
	valid: boolean;
	params: ValidatorParams;
	violations: ValidateViolationItem[];
}

export type ValidateViolationItem = {
	valid: boolean;
	validator: GridCellValidator;
	result: ValidatorResult;
}

export function cellValidation(allCells: GridCell[], cell: GridCell, newValue: CellValue): ValidateViolation {
	const { column, row } = cell;
	const validators = column.setting.validators ?? [];

	const params: ValidatorParams = {
		column,
		row,
		value: newValue,
		allCells,
	};

	const violations: ValidateViolationItem[] = validators.map(validator => {
		const result = validator.validate(params);
		return {
			valid: result.valid,
			validator,
			result,
		};
	});

	return {
		valid: violations.every(v => v.result.valid),
		params,
		violations,
	};
}

class ValidatorPreset {
	required(): GridCellValidator {
		return {
			name: 'required',
			validate: ({ value }): ValidatorResult => {
				return {
					valid: value !== null && value !== undefined && value !== '',
					message: i18n.ts._gridComponent._error.requiredValue,
				};
			},
		};
	}

	regex(pattern: RegExp): GridCellValidator {
		return {
			name: 'regex',
			validate: ({ value }): ValidatorResult => {
				return {
					valid: (typeof value !== 'string') || pattern.test(value.toString() ?? ''),
					message: i18n.tsx._gridComponent._error.patternNotMatch({ pattern: pattern.source }),
				};
			},
		};
	}

	unique(): GridCellValidator {
		return {
			name: 'unique',
			validate: ({ column, row, value, allCells }): ValidatorResult => {
				const bindTo = column.setting.bindTo;
				const isUnique = allCells
					.filter(it => it.column.setting.bindTo === bindTo && it.row.index !== row.index)
					.every(cell => cell.value !== value);
				return {
					valid: isUnique,
					message: i18n.ts._gridComponent._error.notUnique,
				};
			},
		};
	}
}

export const validators = new ValidatorPreset();
