/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

//#region Embed関連の定義

/** 埋め込みの対象となるエンティティ（/embed/xxx の xxx の部分と対応させる） */
export const embeddableEntities = [
	'notes',
	'user-timeline',
	'clips',
	'tags',
] as const;

/** 埋め込みの対象となるエンティティ */
export type EmbeddableEntity = typeof embeddableEntities[number];

/** 内部でスクロールがあるページ */
export const embedRouteWithScrollbar: EmbeddableEntity[] = [
	'clips',
	'tags',
	'user-timeline',
];

/** 埋め込みコードのパラメータ */
export type EmbedParams = {
	maxHeight?: number;
	colorMode?: 'light' | 'dark';
	rounded?: boolean;
	border?: boolean;
	autoload?: boolean;
	header?: boolean;
};

/** 正規化されたパラメータ */
export type ParsedEmbedParams = Required<Omit<EmbedParams, 'maxHeight' | 'colorMode'>> & Pick<EmbedParams, 'maxHeight' | 'colorMode'>;

/** パラメータのデフォルトの値 */
export const defaultEmbedParams = {
	maxHeight: undefined,
	colorMode: undefined,
	rounded: true,
	border: true,
	autoload: false,
	header: true,
} as const satisfies EmbedParams;

//#endregion

/**
 * パラメータを正規化する（埋め込みページ初期化用）
 * @param searchParams URLSearchParamsもしくはクエリ文字列
 * @returns 正規化されたパラメータ
 */
export function parseEmbedParams(searchParams: URLSearchParams | string): ParsedEmbedParams {
	let _searchParams: URLSearchParams;
	if (typeof searchParams === 'string') {
		_searchParams = new URLSearchParams(searchParams);
	} else if (searchParams instanceof URLSearchParams) {
		_searchParams = searchParams;
	} else {
		throw new Error('searchParams must be URLSearchParams or string');
	}

	function convertBoolean(value: string | null): boolean | undefined {
		if (value === 'true') {
			return true;
		} else if (value === 'false') {
			return false;
		}
		return undefined;
	}

	function convertNumber(value: string | null): number | undefined {
		if (value != null && !isNaN(Number(value))) {
			return Number(value);
		}
		return undefined;
	}

	function convertColorMode(value: string | null): 'light' | 'dark' | undefined {
		if (value != null && ['light', 'dark'].includes(value)) {
			return value as 'light' | 'dark';
		}
		return undefined;
	}

	return {
		maxHeight: convertNumber(_searchParams.get('maxHeight')) ?? defaultEmbedParams.maxHeight,
		colorMode: convertColorMode(_searchParams.get('colorMode')) ?? defaultEmbedParams.colorMode,
		rounded: convertBoolean(_searchParams.get('rounded')) ?? defaultEmbedParams.rounded,
		border: convertBoolean(_searchParams.get('border')) ?? defaultEmbedParams.border,
		autoload: convertBoolean(_searchParams.get('autoload')) ?? defaultEmbedParams.autoload,
		header: convertBoolean(_searchParams.get('header')) ?? defaultEmbedParams.header,
	};
}
