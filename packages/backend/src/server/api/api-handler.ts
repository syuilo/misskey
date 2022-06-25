import Koa from 'koa';

import { IEndpoint } from './endpoints.js';
import authenticate, { AuthenticationError } from './authenticate.js';
import call from './call.js';
import { ApiError } from './error.js';
import { inspect } from 'node:util';

export default (endpoint: IEndpoint, ctx: Koa.Context) => new Promise<void>((res) => {
	const body = ctx.request.body;
	console.log('body', inspect(body));

	const reply = (x?: any, y?: ApiError) => {
		if (x == null) {
			ctx.status = 204;
		} else if (typeof x === 'number' && y) {
			ctx.status = x;
			ctx.body = {
				error: {
					message: y!.message,
					code: y!.code,
					id: y!.id,
					kind: y!.kind,
					...(y!.info ? { info: y!.info } : {}),
				},
			};
		} else {
			// 文字列を返す場合は、JSON.stringify通さないとJSONと認識されない
			ctx.body = typeof x === 'string' ? JSON.stringify(x) : x;
		}
		res();
	};

	// Authentication
	authenticate(body['i']).then(([user, app]) => {
		// API invoking
		call(endpoint.name, user, app, body, ctx).then((res: any) => {
			reply(res);
		}).catch((e: ApiError) => {
			reply(e.httpStatusCode ? e.httpStatusCode : e.kind === 'client' ? 400 : 500, e);
		});
	}).catch(e => {
		if (e instanceof AuthenticationError) {
			reply(403, new ApiError({
				message: 'Authentication failed. Please ensure your token is correct.',
				code: 'AUTHENTICATION_FAILED',
				id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14',
			}));
		} else {
			reply(500, new ApiError());
		}
	});
});
