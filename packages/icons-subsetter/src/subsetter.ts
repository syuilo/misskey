/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { promises as fsp } from 'fs';
import { ttf2woff } from 'wasm-ttf2woff';

export async function generateSubsettedFont(ttfPath: string, unicodeRangeValues: Map<string, number[]>) {
	const ttf = await fsp.readFile(ttfPath);

	const {
		instance: { exports: harfbuzzWasm },
	}: any = await WebAssembly.instantiate(await fsp.readFile('./node_modules/harfbuzzjs/hb-subset.wasm'));

	const heapu8 = new Uint8Array(harfbuzzWasm.memory.buffer);

	const subsetFonts = new Map<string, Buffer>();

	let i = 0;
	for (const [key, unicodeValues] of unicodeRangeValues) {
		i++;
		console.log(`Generating subset ${i} of ${unicodeRangeValues.size}...`);

		// サブセット入力を作成
		const input = harfbuzzWasm.hb_subset_input_create_or_fail();
		if (input === 0) {
			throw new Error('hb_subset_input_create_or_fail (harfbuzz) returned zero');
		}

		// フォントバッファにフォントデータをセット
		const fontBuffer = harfbuzzWasm.malloc(ttf.byteLength);
		heapu8.set(new Uint8Array(ttf), fontBuffer);

		// フォントフェイスを作成
		const blob = harfbuzzWasm.hb_blob_create(fontBuffer, ttf.byteLength, 2, 0, 0);
		const face = harfbuzzWasm.hb_face_create(blob, 0);
		harfbuzzWasm.hb_blob_destroy(blob);

		// Unicodeセットに指定されたUnicodeポイントを追加
		const inputUnicodes = harfbuzzWasm.hb_subset_input_unicode_set(input);
		for (const unicode of unicodeValues) {
			harfbuzzWasm.hb_set_add(inputUnicodes, unicode);
		}

		// サブセットを作成
		let subset;
		try {
			subset = harfbuzzWasm.hb_subset_or_fail(face, input);
			if (subset === 0) {
				harfbuzzWasm.hb_face_destroy(face);
				harfbuzzWasm.free(fontBuffer);
				throw new Error('hb_subset_or_fail (harfbuzz) returned zero');
			}
		} finally {
			harfbuzzWasm.hb_subset_input_destroy(input);
		}

		// サブセットフォントデータを取得
		const result = harfbuzzWasm.hb_face_reference_blob(subset);
		const offset = harfbuzzWasm.hb_blob_get_data(result, 0);
		const subsetByteLength = harfbuzzWasm.hb_blob_get_length(result);
		if (subsetByteLength === 0) {
			harfbuzzWasm.hb_face_destroy(face);
			harfbuzzWasm.hb_blob_destroy(result);
			harfbuzzWasm.free(fontBuffer);
			throw new Error('hb_blob_get_length (harfbuzz) returned zero');
		}

		// サブセットフォントをバッファに格納
		subsetFonts.set(key, Buffer.from(await ttf2woff(heapu8.slice(offset, offset + subsetByteLength))));

		// メモリを解放
		harfbuzzWasm.hb_blob_destroy(result);
		harfbuzzWasm.hb_face_destroy(subset);
		harfbuzzWasm.hb_face_destroy(face);
		harfbuzzWasm.free(fontBuffer);
	}

	return subsetFonts;
}
