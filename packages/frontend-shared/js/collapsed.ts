/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';

function safeParseFloat(str: unknown): number | null {
	if (typeof str !== 'string' || str === '') return null;
	const num = parseFloat(str);
	if (isNaN(num)) return null;
	return num;
}

export function shouldCollapseLegacy(note: Misskey.entities.Note, urls: string[]): boolean {
	const collapsed = note.cw == null && (
		(note.text != null && (
			(note.text.includes('$[x2')) ||
			(note.text.includes('$[x3')) ||
			(note.text.includes('$[x4')) ||
			(note.text.includes('$[scale')) ||
			(note.text.split('\n').length > 9) ||
			(note.text.length > 500) ||
			(urls.length >= 4)
		)) || (note.files != null && note.files.length >= 5)
	);

	return collapsed;
}

export function shouldCollapse(note: Misskey.entities.Note, limitY: number, ast?: mfm.MfmNode[] | null, urls?: string[]): boolean {
	if (note.cw != null) return false;
	if (note.text == null) return false;
	if (note.files && note.files.length >= 5) return true;
	if (urls && urls.length >= 4) return true;

	// ASTが提供されていない場合はパースしちゃう
	const _ast = ast ?? mfm.parse(note.text);

	// しきい値（X方向の文字数は半角換算）
	const limitX = 55;
	// const limitY = 13.5;

	let forceCollapsed = false;

	// まずは、文字数を考慮せずに高さを計算
	function getHeightForEachLine(nodes: mfm.MfmNode[], depth = 1): [number, number][] {
		// [文字カウント, 高さ]
		const lineHeights: [number, number][] = [];

		// インライン要素の高さを追加
		function addHeightsInline(lines: [number, number][]) {
			// linesのはじめの要素と、lineHeightsの最後の要素を比較。それ以外はそのまま追加
			if (lines.length === 0) return;

			if (lineHeights.length === 0) {
				lineHeights.push(...lines);
			} else {
				// 入力側の最初の行
				const [firstLineCharCount, firstLineHeight] = lines.shift()!;

				// 記憶側の最後の行
				const [lastLineCharCount, lastLineHeight] = lineHeights.pop()!;

				if (lastLineCharCount <= 0 && firstLineCharCount > 0) {
					lineHeights.push([firstLineCharCount, firstLineHeight], ...lines);
				} else {
					lineHeights.push([firstLineCharCount + lastLineCharCount, Math.max(firstLineHeight, lastLineHeight)], ...lines);
				}
			}
		}

		// 半角は1、全角は2として文字数をカウント
		// https://zenn.dev/terrierscript/articles/2020-09-19-multibyte-count
		function getCharCount(str: string): number {
			return str.split('').reduce((count, char) => count + Math.min(new Blob([char]).size, 2), 0);
		}

		// 糖衣 文字列の高さ
		function createTextHeight(text: string): [number, number][] {
			return text.split('\n').map(l => [getCharCount(l), 1]);
		}

		// 糖衣 文字の大きさ変換
		function transformSize(lineHeight: [number, number], size: number): [number, number] {
			return [lineHeight[0] * size, lineHeight[1] * size];
		}

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];

			switch (node.type) {
				case 'text': {
					addHeightsInline(createTextHeight(node.props.text));
					break;
				}

				case 'url': {
					addHeightsInline(createTextHeight(node.props.url));
					break;
				}

				case 'mention': {
					addHeightsInline(createTextHeight(node.props.acct));
					break;
				}

				case 'hashtag': {
					addHeightsInline(createTextHeight('#' + node.props.hashtag));
					break;
				}

				case 'inlineCode': {
					addHeightsInline(createTextHeight(node.props.code));
					break;
				}

				case 'mathInline': {
					addHeightsInline(createTextHeight(node.props.formula));
					break;
				}

				case 'small': {
					addHeightsInline(getHeightForEachLine(node.children).map(h => [h[0], h[1] * 0.8]));
					break;
				}

				case 'blockCode': {
					// TODO: コードブロックは折り返ししないのでlimitXを考慮しないようにしたい
					lineHeights.push(...createTextHeight(node.props.code), [0, 0]);
					break;
				}

				case 'mathBlock': {
					lineHeights.push(...createTextHeight(node.props.formula), [0, 0]);
					break;
				}

				case 'search': {
					lineHeights.push([1, 2], [0, 0]);
					break;
				}

				case 'plain': {
					addHeightsInline(getHeightForEachLine(node.children, depth + 1));
					break;
				}

				case 'fn': {
					switch (node.props.name) {
						case 'tada': {
							addHeightsInline(getHeightForEachLine(node.children, depth + 1).map(l => transformSize(l, 1.5)));
							break;
						}

						case 'x2': {
							addHeightsInline(getHeightForEachLine(node.children, depth + 1).map(l => transformSize(l, 2)));
							break;
						}

						case 'x3': {
							addHeightsInline(getHeightForEachLine(node.children, depth + 1).map(l => transformSize(l, 3)));
							break;
						}

						case 'x4': {
							addHeightsInline(getHeightForEachLine(node.children, depth + 1).map(l => transformSize(l, 4)));
							break;
						}

						case 'scale': {
							if ((safeParseFloat(node.props.args.x) ?? 1) > 1 || (safeParseFloat(node.props.args.y) ?? 1) > 1) {
								forceCollapsed = true;
							}
							addHeightsInline(getHeightForEachLine(node.children, depth + 1));
							break;
						}

						case 'border': {
							// TODO: 枠線の幅も計算に入れる？
							const width = safeParseFloat(node.props.args.width) ?? 1;
							if (width > 20) forceCollapsed = true;
							addHeightsInline(getHeightForEachLine(node.children, depth + 1));
							break;
						}

						default: {
							addHeightsInline(getHeightForEachLine(node.children, depth + 1));
							break;
						}
					}
					break;
				}

				case 'center':
				case 'quote': {
					lineHeights.push(...getHeightForEachLine(node.children, depth + 1), [0, 0]);
					break;
				}

				case 'unicodeEmoji':
				case 'emojiCode': {
					addHeightsInline([[2, 1]]);
					break;
				}

				case 'bold':
				case 'italic':
				case 'strike':
				case 'link': {
					addHeightsInline(getHeightForEachLine(node.children, depth + 1));
					break;
				}
			}
		}

		return lineHeights.filter(h => h[1] > 0);
	}

	function getHeight(nodes: mfm.MfmNode[]): number {
		const heights = getHeightForEachLine(nodes);

		// 横幅のリミットからはみ出た分、高さを追加
		const vHeight = heights.reduce((a, b) => {
			return a + b[1] + Math.max(Math.ceil(b[0] / limitX) - 1, 0) * b[1];
		}, 0);

		return vHeight;
	}

	const virtualHeight = getHeight(_ast);

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return forceCollapsed || virtualHeight > limitY;
}
