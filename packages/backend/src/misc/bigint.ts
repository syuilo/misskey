/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

function parseBigIntChunked(str: string, base: number, chunkSize: number, powerOfChunkSize: bigint): bigint {
	const chunks = [];
	while (str.length > 0) {
		chunks.unshift(str.slice(-chunkSize));
		str = str.slice(0, -chunkSize);
	}
	let result = 0n;
	for (const chunk of chunks) {
		result *= powerOfChunkSize;
		const int = parseInt(chunk, base);
		if (Number.isNaN(int)) {
			throw new Error('Invalid base36 string');
		}
		result += BigInt(int);
	}
	return result;
}

export function parseBigInt36(str: string): bigint {
	// log_36(Number.MAX_SAFE_INTEGER) => 10.251599391715352
	// so we process 10 chars at once
	return parseBigIntChunked(str, 36, 10, 36n ** 10n);
}

export function parseBigInt16(str: string): bigint {
	// log_16(Number.MAX_SAFE_INTEGER) => 13.25
	// so we process 13 chars at once
	return parseBigIntChunked(str, 16, 13, 16n ** 13n);
}

export function parseBigInt32(str: string): bigint {
	// log_32(Number.MAX_SAFE_INTEGER) => 10.6
	// so we process 10 chars at once
	return parseBigIntChunked(str, 32, 10, 32n ** 10n);
}
