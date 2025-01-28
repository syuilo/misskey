/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { v4 as uuid } from 'uuid';

import { themeProps } from './theme.js';
import type { Theme } from './theme.js';

export type Default = null;
export type Color = string;
export type FuncName = 'alpha' | 'darken' | 'lighten';
export type Func = { type: 'func'; name: FuncName; arg: number; value: string; };
export type RefProp = { type: 'refProp'; key: string; };
export type RefConst = { type: 'refConst'; key: string; };
export type Css = { type: 'css'; value: string; };

export type ThemeValue = Color | Func | RefProp | RefConst | Css | Default;

export type ThemeViewModel = [ string, ThemeValue ][];

export const fromThemeString = (str?: string) : ThemeValue => {
	if (!str) return null;
	if (str.startsWith(':')) {
		const parts = str.slice(1).split('<');
		const name = parts[0] as FuncName;
		const arg = parseFloat(parts[1]);
		const value = parts[2].startsWith('@') ? parts[2].slice(1) : '';
		return { type: 'func', name, arg, value };
	} else if (str.startsWith('@')) {
		return {
			type: 'refProp',
			key: str.slice(1),
		};
	} else if (str.startsWith('$')) {
		return {
			type: 'refConst',
			key: str.slice(1),
		};
	} else if (str.startsWith('"')) {
		return {
			type: 'css',
			value: str.substring(1).trim(),
		};
	} else {
		return str;
	}
};

export const toThemeString = (value: Color | Func | RefProp | RefConst | Css) => {
	if (typeof value === 'string') return value;
	switch (value.type) {
		case 'func': return `:${value.name}<${value.arg}<@${value.value}`;
		case 'refProp': return `@${value.key}`;
		case 'refConst': return `$${value.key}`;
		case 'css': return `" ${value.value}`;
	}
};

export const convertToMisskeyTheme = (vm: ThemeViewModel, name: string, desc: string, author: string, base: 'dark' | 'light'): Theme => {
	const props = { } as { [key: string]: string };
	for (const [key, value] of vm) {
		if (value === null) continue;
		props[key] = toThemeString(value);
	}

	return {
		id: uuid(),
		name, desc, author, props, base,
	};
};

export const convertToViewModel = (theme: Theme): ThemeViewModel => {
	const vm: ThemeViewModel = [];
	// プロパティの登録
	vm.push(...themeProps.map(key => [key, fromThemeString(theme.props[key])] as [ string, ThemeValue ]));

	// 定数の登録
	const consts = Object
		.keys(theme.props)
		.filter(k => k.startsWith('$'))
		.map(k => [k, fromThemeString(theme.props[k])] as [ string, ThemeValue ]);

	vm.push(...consts);
	return vm;
};
