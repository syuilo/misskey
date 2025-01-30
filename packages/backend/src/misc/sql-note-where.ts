/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { type WhereExpressionBuilder, Brackets } from 'typeorm';
import { SearchCondition } from './search-query.js';
import { sqlLikeEscape } from './sql-like-escape.js';

// conditionに相当するwhere条件をnoteテーブルのqueryに追加します。
// .andWhere() と並べる形で使ってください。.orWhere()と並べて使った場合、意図通りの抽出になる保証はありません。
// 条件式としてはデフォルトで LOWER(coalesce(note.cw, '')||note.text) に対するLIKEまたはNOT LIKEを生成するので
// これに対してpg_bigmなどでインデックスを設定しておくと高速に検索できます
export function appendCondToQuery(
	condition: SearchCondition,
	query: WhereExpressionBuilder,
	targetColumn = 'LOWER(coalesce(note.cw, \'\')||note.text)'): void {
	let i = 0; // SQL内のパラメータはすべて違えないといけないので連番で生成する

	const appendCondToAndContext = (
		condition: SearchCondition,
		query: WhereExpressionBuilder,
	) => {
		switch (condition.type) {
			case 'contains':
				++i;
				query.andWhere(`${targetColumn} LIKE :q${i}`, {
					[`q${i}`]: `%${sqlLikeEscape(condition.value)}%`,
				});
				break;
			case 'not_contains':
				++i;
				query.andWhere(`${targetColumn} NOT LIKE :q${i}`, {
					[`q${i}`]: `%${sqlLikeEscape(condition.value)}%`,
				});
				break;
			case 'and':
				condition.subConditions.forEach((subCondition) => appendCondToAndContext(subCondition, query));
				break;
			case 'or':
				query.andWhere(
					new Brackets((qb) => condition.subConditions.forEach(
						(subCondition) => appendCondToOrContext(subCondition, qb))));
				break;
		}
	};

	const appendCondToOrContext = (
		condition: SearchCondition,
		query: WhereExpressionBuilder,
	) => {
		switch (condition.type) {
			case 'contains':
				++i;
				query.orWhere(`${targetColumn} LIKE :q${i}`, {
					[`q${i}`]: `%${sqlLikeEscape(condition.value)}%`,
				});
				break;
			case 'not_contains':
				++i;
				query.orWhere(`${targetColumn} NOT LIKE :q${i}`, {
					[`q${i}`]: `%${sqlLikeEscape(condition.value)}%`,
				});
				break;
			case 'and':
				query.orWhere(
					new Brackets((qb) => condition.subConditions.forEach(
						(subCondition) => appendCondToAndContext(subCondition, qb))));
				break;
		}
	};

	return appendCondToAndContext(condition, query);
}
