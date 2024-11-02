/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

type EnumItem = string | {
	label: string;
	value: string;
};

type Hidden = boolean | ((v: any) => boolean);

export type FormItem = {
	label?: string;
	type: 'string';
	default?: string | null;
	description?: string;
	required?: boolean;
	hidden?: Hidden;
	multiline?: boolean;
	treatAsMfm?: boolean;
} | {
	label?: string;
	type: 'number';
	default?: number | null;
	description?: string;
	required?: boolean;
	hidden?: Hidden;
	step?: number;
} | {
	label?: string;
	type: 'boolean';
	default?: boolean | null;
	description?: string;
	hidden?: Hidden;
} | {
	label?: string;
	type: 'enum';
	default?: string | null;
	required?: boolean;
	hidden?: Hidden;
	enum: EnumItem[];
} | {
	label?: string;
	type: 'radio';
	default?: unknown | null;
	required?: boolean;
	hidden?: Hidden;
	options: {
		label: string;
		value: unknown;
	}[];
} | {
	label?: string;
	type: 'range';
	default?: number | null;
	description?: string;
	required?: boolean;
	step?: number;
	min: number;
	max: number;
	textConverter?: (value: number) => string;
	hidden?: Hidden;
} | {
	label?: string;
	type: 'object';
	default?: Record<string, unknown> | null;
	hidden: Hidden;
} | {
	label?: string;
	type: 'array';
	default?: unknown[] | null;
	hidden: Hidden;
} | {
	type: 'button';
	content?: string;
	hidden?: Hidden;
	action: (ev: MouseEvent, v: any) => void;
} | {
	type: 'drive-file';
	defaultFileId?: string | null;
	hidden?: Hidden;
	validate?: (v: Misskey.entities.DriveFile) => Promise<boolean>;
};

export type Form = Record<string, FormItem>;

type GetItemType<Item extends FormItem> =
	Item['type'] extends 'string' ? string :
	Item['type'] extends 'number' ? number :
	Item['type'] extends 'boolean' ? boolean :
	Item['type'] extends 'radio' ? unknown :
	Item['type'] extends 'range' ? number :
	Item['type'] extends 'enum' ? string :
	Item['type'] extends 'array' ? unknown[] :
	Item['type'] extends 'object' ? Record<string, unknown> :
	Item['type'] extends 'drive-file' ? Misskey.entities.DriveFile | undefined :
	never;

export type GetFormResultType<F extends Form> = {
	[P in keyof F]: GetItemType<F[P]>;
};
