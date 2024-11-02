/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Redis from 'ioredis';
import { loadConfig } from '../built/config.js';
import { createPostgresDataSource } from '../built/postgres.js';

const config = loadConfig();

async function connectToPostgres() {
	const source = createPostgresDataSource(config);
	await source.initialize();
	await source.destroy();
}

async function connectToRedis(redisOptions) {
	return await new Promise(async (resolve, reject) => {
		const redis = new Redis({
			...redisOptions,
			lazyConnect: true,
			reconnectOnError: false,
			showFriendlyErrorStack: true,
		});
		redis.on('error', e => reject(e));

		try {
			await redis.connect();
			resolve();

		} catch (e) {
			reject(e);

		} finally {
			redis.disconnect(false);
		}
	});
}

// If not all of these are defined, the default one gets reused.
// so we use a Set to only try connecting once to each **uniq** redis.
const promises = Array
	.from(new Set([
		config.redis,
		config.redisForPubsub,
		config.redisForJobQueue,
		config.redisForTimelines,
		config.redisForReactions,
	]))
	.map(connectToRedis)
	.concat([
		connectToPostgres()
	]);

await Promise.allSettled(promises);
