/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fsp, existsSync } from 'fs';
import path from 'path';
import glob from 'tiny-glob';
import { generateSubsettedFont } from './subsetter.js';

const filesToScan = {
	frontend: 'packages/frontend/src/**/*.{ts,vue}',
	//frontendShared: 'packages/frontend-shared/js/**/*.{ts}',  // 現時点では該当がないのでスキップ。ここをコメントアウトするときは、各フロントエンドにこのチャンクのCSSのimportを追加すること
	frontendEmbed: 'packages/frontend-embed/src/**/*.{ts,vue}',
};

async function main() {
	const start = performance.now();

	// 1. ビルドディレクトリを削除
	if (existsSync('./built')) {
		await fsp.rm('./built', { recursive: true });
	}
	await fsp.mkdir('./built');

	// 2. tabler-icons.min.cssから、class名とUnicodeのマッピングを抽出
	const css = await fsp.readFile('node_modules/@tabler/icons-webfont/dist/tabler-icons.min.css', 'utf-8');
	const cssRegex = /\.(ti-[a-z0-9-]+)::?before\s*{\n?\s*content:\s*["']\\([a-fA-F0-9]+)["'];?\n?\s*}/g;
	const rgMap = new Map<string, string>();
	let matches: RegExpExecArray | null;
	while ((matches = cssRegex.exec(css)) !== null) {
		rgMap.set(matches[1], matches[2]);
	}

	// 3. tabler-icons-classes.cssから、.tiのルールを抽出
	const classTiBaseRule = css.match(/\.ti\s*{[^}]*}/)![0];

	// 4. フォールバック用のtabler-icons.woff2をコピー
	const fontPath = 'node_modules/@tabler/icons-webfont/dist/fonts/';
	await fsp.copyFile(fontPath + 'tabler-icons.woff2', './built/tabler-icons.woff2');

	// 5. 各チャンクごとにファイルをスキャンして、使用されているアイコンを抽出
	const unicodeRangeValues = new Map<string, number[]>();
	for (const [key, dir] of Object.entries(filesToScan)) {
		console.log(`Scanning ${key}...`);

		const iconsToPack = new Set<string>();

		const cwd = path.resolve(process.cwd(), '../../');
		const files = await glob(dir, { cwd });
		for (const file of files) {
			//console.log(`Scanning ${file}`);
			const content = await fsp.readFile(path.resolve(cwd, file), 'utf-8');
			const classRegex = /ti-[a-z0-9-]+/g;
			let matches: RegExpExecArray | null;
			while ((matches = classRegex.exec(content)) !== null) {
				const icon = matches[0];
				if (rgMap.has(icon)) {
					iconsToPack.add(icon);
				}
			}
		}

		// 6. チャンク内で使用されているアイコンのUnicodeの配列を生成
		const unicodeValues = Array.from(iconsToPack).map((icon) => parseInt(rgMap.get(icon)!, 16));
		unicodeRangeValues.set(key, unicodeValues);
	}

	// 7. Tabler Iconフォントをサブセット化
	const subsettedFonts = await generateSubsettedFont(fontPath + 'tabler-icons.ttf', unicodeRangeValues);

	// 8. サブセット化したフォント・CSSを書き出し
	await Promise.allSettled(Array.from(subsettedFonts.entries()).map(async ([key, buffer]) => {
		const cssRules = [`@font-face {
	font-family: "tabler-icons";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("./tabler-icons.woff2") format("woff2");
}`];

		// サブセット化したフォントの中身がある（＝unicodeRangeValuesの配列が空ではない）場合のみ、サブセットしたものに関する情報を追記
		if (unicodeRangeValues.get(key)!.length > 0) {
			await fsp.writeFile(`./built/tabler-icons-${key}.woff2`, buffer);

			const unicodeRangeString = (() => {
				const values = unicodeRangeValues.get(key)!.sort((a, b) => a - b);
				const ranges = [];

				for (let i = 0; i < values.length; i++) {
					const start = values[i];
					let end = values[i];
					while (values[i + 1] === end + 1) {
						end = values[i + 1];
						i++;
					}
					if (start === end) {
						ranges.push(`U+${start.toString(16)}`);
					} else if (start + 1 === end) {
						ranges.push(`U+${start.toString(16)}`, `U+${end.toString(16)}`);
					} else {
						ranges.push(`U+${start.toString(16)}-${end.toString(16)}`);
					}
				}

				return ranges.join(', ');
			})();

			cssRules.push(`@font-face {
	font-family: "tabler-icons";
	font-style: normal;
	font-weight: 400;
	font-display: swap;
	src: url("./tabler-icons-${key}.woff2") format("woff2");
	unicode-range: ${unicodeRangeString};
}`);

			cssRules.push(classTiBaseRule);

			// 使用されているアイコンのclassとの対応を追記
			for (const icon of unicodeRangeValues.get(key)!) {
				const iconClasses = Array.from(rgMap.entries()).filter(([_, unicode]) => parseInt(unicode, 16) === icon);
				if (iconClasses.length > 1) {
					console.warn(`[WARN] Multiple classes for the same unicode: ${iconClasses.map(([cls]) => cls).join(', ')}. Maybe it's deprecated?`);
				}
				const iconSelector = iconClasses.map(([className]) => `.${className}::before`).join(', ');
				cssRules.push(`${iconSelector} { content: "\\${icon.toString(16)}"; }`);
			}
		}

		await fsp.writeFile(`./built/tabler-icons-${key}.css`, cssRules.join('\n') + '\n');
	}));

	const end = performance.now();
	console.log(`Done in ${Math.round((end - start) * 100) / 100}ms`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
