// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Clipboardに値をコピー(TODO: 文字列以外も対応)
 */
export default val => {
	// 空div 生成
	const tmp = document.createElement('div');
	// 選択用のタグ生成
	const pre = document.createElement('pre');

	// 親要素のCSSで user-select: none だとコピーできないので書き換える
	pre.style.webkitUserSelect = 'auto';
	pre.style.userSelect = 'auto';

	tmp.appendChild(pre).textContent = val;

	// 要素を画面外へ
	const s = tmp.style;
	s.position = 'fixed';
	s.right = '200%';

	// body に追加
	document.body.appendChild(tmp);
	// 要素を選択
	document.getSelection().selectAllChildren(tmp);

	// クリップボードにコピー
	const result = document.execCommand('copy');

	// 要素削除
	document.body.removeChild(tmp);

	return result;
};
