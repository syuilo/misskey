import * as Koa from 'koa';
import { serverLogger } from '../index';
import { IReadableImage, convertToPng, convertToJpeg } from '@/services/drive/image-processor';
import { getUrl } from '@/misc/download-url';
import { detectType } from '@/misc/get-file-info';
import { StatusError } from '@/misc/fetch';
import { cloneStream } from '@/misc/stream/clone';
import { toBufferArray } from '@/misc/stream/to-buffer-array';
import { fromBufferArray } from '@/misc/stream/from-buffer';

export async function proxyMedia(ctx: Koa.Context) {
	const url = 'url' in ctx.query ? ctx.query.url : 'https://' + ctx.params.url;

	if (typeof url !== 'string') throw 403;

	try {
		const bufferArray = await toBufferArray(getUrl(url));

		const { mime, ext } = await detectType(bufferArray);

		if (!mime.startsWith('image/')) throw 403;

		let image: IReadableImage;

		if ('static' in ctx.query && ['image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng', 'image/webp'].includes(mime)) {
			image = convertToPng(fromBufferArray(bufferArray), 498, 280);
		} else if ('preview' in ctx.query && ['image/jpeg', 'image/png', 'image/gif', 'image/apng', 'image/vnd.mozilla.apng'].includes(mime)) {
			image = convertToJpeg(fromBufferArray(bufferArray), 200, 200);
		} else {
			image = {
				readable: fromBufferArray(bufferArray),
				ext,
				type: mime,
			};
		}

		ctx.set('Content-Type', image.type);
		ctx.set('Cache-Control', 'max-age=31536000, immutable');
		ctx.body = cloneStream(image.readable);
	} catch (e) {
		serverLogger.error(`${e}`);

		if (e instanceof StatusError && e.isClientError) {
			ctx.status = e.statusCode;
		} else {
			ctx.status = 500;
		}
	}
}
