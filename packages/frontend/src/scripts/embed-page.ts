/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

//#region Embed関連の定義

/** 埋め込みの対象となるエンティティ（/embed/xxx の xxx の部分と対応させる） */
const embeddableEntities = [
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
