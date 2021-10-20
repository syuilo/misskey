import * as crypto from 'crypto';
import * as stream from 'stream';
import * as util from 'util';
import * as fileType from 'file-type';
import isSvg from 'is-svg';
import * as probeImageSize from 'probe-image-size';
import * as sharp from 'sharp';
import { encode } from 'blurhash';
import { awaitAll } from '@/prelude/await-all';
import { preventEmptyStream } from './stream/prevent-empty';
import { readableRead } from './stream/read';
import { createReadStream } from 'fs';
import { cloneStream } from './stream/clone';
import { BufferArray, toBufferArray } from './stream/to-buffer-array';
import { fromBufferArray } from './stream/from-buffer';

const pipeline = util.promisify(stream.pipeline);

export type FileInfo = {
	size: number;
	md5: string;
	type: {
		mime: string;
		ext: string | null;
	};
	width?: number;
	height?: number;
	blurhash?: string;
	warnings: string[];
};

const TYPE_OCTET_STREAM = {
	mime: 'application/octet-stream',
	ext: null
};

const TYPE_SVG = {
	mime: 'image/svg+xml',
	ext: 'svg'
};

export function getFileInfoByPath(path: string): Promise<FileInfo> {
	return getFileInfo(createReadStream(path));
}

/**
 * Get file information
 */
export async function getFileInfo(readable: stream.Readable): Promise<FileInfo> {
	const warnings = [] as string[];

	const bufferArray = await toBufferArray(readable);

	let type = await detectType(bufferArray);

	const sizeDetectable = ['image/jpeg', 'image/gif', 'image/png', 'image/apng', 'image/webp', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/vnd.adobe.photoshop'].includes(type.mime);
	const blurhashEnabled = ['image/jpeg', 'image/gif', 'image/png', 'image/apng', 'image/webp', 'image/svg+xml'].includes(type.mime);

	const size = bufferArray.size;
	const md5Promise = calcHash(fromBufferArray(bufferArray));
	const imageSizePromise = sizeDetectable ? detectImageSize(fromBufferArray(bufferArray)).catch(e => {
		warnings.push(`detectImageSize failed: ${e}`);
		return undefined;
	}) : Promise.resolve(undefined);
	const blurhashPromise = blurhashEnabled ? getBlurhash(fromBufferArray(bufferArray)).catch(e => {
		warnings.push(`getBlurhash failed: ${e}`);
		return undefined;
	}) : Promise.resolve(undefined);

	// image dimensions
	let width: number | undefined;
	let height: number | undefined;

	if (sizeDetectable) {
		const imageSize = await imageSizePromise;

		// うまく判定できない画像は octet-stream にする
		if (!imageSize) {
			warnings.push(`cannot detect image dimensions`);
			type = TYPE_OCTET_STREAM;
		} else if (imageSize.wUnits === 'px') {
			width = imageSize.width;
			height = imageSize.height;

			// 制限を超えている画像は octet-stream にする
			if (imageSize.width > 16383 || imageSize.height > 16383) {
				warnings.push(`image dimensions exceeds limits`);
				type = TYPE_OCTET_STREAM;
			}
		} else {
			warnings.push(`unsupported unit type: ${imageSize.wUnits}`);
		}
	}

	return awaitAll({
		size,
		md5: md5Promise,
		type,
		width,
		height,
		blurhash: blurhashPromise,
		warnings,
	});
}

/**
 * Detect MIME Type and extension
 */
export async function detectType({ size, chunks }: BufferArray) {
	if (size === 0) {
		return TYPE_OCTET_STREAM;
	}

	const type = await fileType.fromBuffer(Buffer.concat(chunks));

	if (type) {
		// XMLはSVGかもしれない
		if (type.mime === 'application/xml') {
			if (checkSvg(Buffer.concat(chunks))) {
				return TYPE_SVG;
			}
		}

		return {
			mime: type.mime,
			ext: type.ext
		};
	}

	// 種類が不明でもSVGかもしれない
	if (checkSvg(Buffer.concat(chunks))) {
		return TYPE_SVG;
	}

	// それでも種類が不明なら application/octet-stream にする
	return TYPE_OCTET_STREAM;
}

/**
 * Check the file is SVG or not
 */
export function checkSvg(buffer: Buffer) {
	try {
		if (buffer.length > 1 * 1024 * 1024) return false;
		return isSvg(buffer);
	} catch {
		return false;
	}
}

/**
 * Calculate MD5 hash
 */
async function calcHash(readable: stream.Readable): Promise<string> {
	const hash = crypto.createHash('md5').setEncoding('hex');
	await pipeline(cloneStream(readable), hash);
	return hash.read();
}

/**
 * Detect dimensions of image
 */
async function detectImageSize(readable: stream.Readable): Promise<{
	width: number;
	height: number;
	wUnits: string;
	hUnits: string;
}> {
	const imageSize = await probeImageSize(cloneStream(readable));
	return imageSize;
}

/**
 * Calculate average color of image
 */
function getBlurhash(readable: stream.Readable): Promise<string> {
	return new Promise((resolve, reject) => {
		const generator = sharp()
			.raw()
			.ensureAlpha()
			.resize(64, 64, { fit: 'inside' })
			.toBuffer((err, buffer, info) => {
				if (err) return reject(err);

				const { width, height } = info;
				let hash;

				try {
					hash = encode(new Uint8ClampedArray(buffer), width, height, 7, 7);
				} catch (e) {
					return reject(e);
				}

				resolve(hash);
			});

		pipeline(readable, new stream.PassThrough(), preventEmptyStream(), generator).catch(reject);
	});
}
