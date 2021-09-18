/**
 * Core Server
 */

import * as fs from 'fs';
import * as http from 'http';
import * as http2 from 'http2';
import * as https from 'https';
import * as Koa from 'koa';
import * as Router from '@koa/router';
import * as mount from 'koa-mount';
import * as koaLogger from 'koa-logger';
import * as requestStats from 'request-stats';
import * as slow from 'koa-slow';

import activityPub from './activitypub';
import nodeinfo from './nodeinfo';
import wellKnown from './well-known';
import config from '@/config/index';
import apiServer from './api/index';
import { sum } from '@/prelude/array';
import Logger from '@/services/logger';
import { program } from '../argv';
import { UserProfiles, Users } from '@/models/index';
import { networkChart } from '@/services/chart/index';
import { genAvatar } from '@/misc/gen-avatar';
import { createTemp } from '@/misc/create-temp';
import { publishMainStream } from '@/services/stream';

export const serverLogger = new Logger('server', 'gray', false);

// Init app
const app = new Koa();
app.proxy = true;

if (!['production', 'test'].includes(process.env.NODE_ENV || '')) {
	// Logger
	app.use(koaLogger(str => {
		serverLogger.info(str);
	}));

	// Delay
	if (program.slow) {
		app.use(slow({
			delay: 3000
		}));
	}
}

// HSTS
// 6months (15552000sec)
if (config.url.startsWith('https') && !config.disableHsts) {
	app.use(async (ctx, next) => {
		ctx.set('strict-transport-security', 'max-age=15552000; preload');
		await next();
	});
}

app.use(async (ctx, next) => {
	ctx.set('Permissions-Policy', 'interest-cohort=()');
	await next();
});

app.use(mount('/api', apiServer));
app.use(mount('/files', require('./file')));
app.use(mount('/proxy', require('./proxy')));

// Init router
const router = new Router();

// Routing
router.use(activityPub.routes());
router.use(nodeinfo.routes());
router.use(wellKnown.routes());

router.get('/avatar/:x', async ctx => {
	const [temp] = await createTemp();
	await genAvatar(ctx.params.x, fs.createWriteStream(temp));
	ctx.set('Content-Type', 'image/png');
	ctx.body = fs.createReadStream(temp);
});

router.get('/verify-email/:code', async ctx => {
	const profile = await UserProfiles.findOne({
		emailVerifyCode: ctx.params.code
	});

	if (profile != null) {
		ctx.body = 'Verify succeeded!';
		ctx.status = 200;

		await UserProfiles.update({ userId: profile.userId }, {
			emailVerified: true,
			emailVerifyCode: null
		});

		publishMainStream(profile.userId, 'meUpdated', await Users.pack(profile.userId, { id: profile.userId }, {
			detail: true,
			includeSecrets: true
		}));
	} else {
		ctx.status = 404;
	}
});

// Register router
app.use(router.routes());

app.use(mount(require('./web')));

function createServer() {
	if (config.https) {
		const certs: any = {};
		for (const k of Object.keys(config.https)) {
			certs[k] = fs.readFileSync(config.https[k]);
		}
		certs['allowHTTP1'] = true;
		return http2.createSecureServer(certs, app.callback()) as https.Server;
	} else {
		return http.createServer(app.callback());
	}
}

// For testing
export const startServer = () => {
	const server = createServer();

	// Init stream server
	require('./api/streaming')(server);

	// Listen
	server.listen(config.port);

	return server;
};

export default () => new Promise(resolve => {
	const server = createServer();

	// Init stream server
	require('./api/streaming')(server);

	// Listen
	server.listen(config.port, resolve);

	//#region Network stats
	let queue: any[] = [];

	requestStats(server, (stats: any) => {
		if (stats.ok) {
			queue.push(stats);
		}
	});

	// Bulk write
	setInterval(() => {
		if (queue.length === 0) return;

		const requests = queue.length;
		const time = sum(queue.map(x => x.time));
		const incomingBytes = sum(queue.map(x => x.req.byets));
		const outgoingBytes = sum(queue.map(x => x.res.byets));
		queue = [];

		networkChart.update(requests, time, incomingBytes, outgoingBytes);
	}, 5000);
	//#endregion
});
