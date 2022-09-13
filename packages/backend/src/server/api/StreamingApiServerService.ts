import { EventEmitter } from 'events';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import * as websocket from 'websocket';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { Users } from '@/models/index.js';
import type { Blockings, ChannelFollowings, Followings, Mutings, UserProfiles } from '@/models/index.js';
import { Config } from '@/config/types.js';
import { NoteReadService } from '@/services/NoteReadService.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { AuthenticateService } from './AuthenticateService';
import MainStreamConnection from './stream/index.js';
import type { ParsedUrlQuery } from 'querystring';
import type * as http from 'node:http';

@Injectable()
export class StreamingApiServerService {
	constructor(
		@Inject(DI_SYMBOLS.config)
		private config: Config,

		@Inject(DI_SYMBOLS.redis)
		private redisClient: Redis.Redis,

		@Inject('followingsRepository')
		private followingsRepository: typeof Followings,

		@Inject('mutingsRepository')
		private mutingsRepository: typeof Mutings,

		@Inject('blockingsRepository')
		private blockingsRepository: typeof Blockings,

		@Inject('channelFollowingsRepository')
		private channelFollowingsRepository: typeof ChannelFollowings,

		@Inject('userProfilesRepository')
		private userProfilesRepository: typeof UserProfiles,
	
		private globalEventService: GlobalEventService,
		private noteReadService: NoteReadService,
		private authenticateService: AuthenticateService,
	) {
	}

	public attachStreamingApi(server: http.Server) {
		// Init websocket server
		const ws = new websocket.server({
			httpServer: server,
		});

		ws.on('request', async (request) => {
			const q = request.resourceURL.query as ParsedUrlQuery;

			// TODO: トークンが間違ってるなどしてauthenticateに失敗したら
			// コネクション切断するなりエラーメッセージ返すなりする
			// (現状はエラーがキャッチされておらずサーバーのログに流れて邪魔なので)
			const [user, miapp] = await this.authenticateService.authenticate(q.i as string);

			if (user?.isSuspended) {
				request.reject(400);
				return;
			}

			const connection = request.accept();

			const ev = new EventEmitter();

			async function onRedisMessage(_: string, data: string) {
				const parsed = JSON.parse(data);
				ev.emit(parsed.channel, parsed.message);
			}

			this.redisClient.on('message', onRedisMessage);

			const main = new MainStreamConnection(
				this.followingsRepository,
				this.mutingsRepository,
				this.blockingsRepository,
				this.channelFollowingsRepository,
				this.userProfilesRepository,
				this.globalEventService,
				this.noteReadService,
				connection, ev, user, miapp,
			);

			const intervalId = user ? setInterval(() => {
				Users.update(user.id, {
					lastActiveDate: new Date(),
				});
			}, 1000 * 60 * 5) : null;
			if (user) {
				Users.update(user.id, {
					lastActiveDate: new Date(),
				});
			}

			connection.once('close', () => {
				ev.removeAllListeners();
				main.dispose();
				this.redisClient.off('message', onRedisMessage);
				if (intervalId) clearInterval(intervalId);
			});

			connection.on('message', async (data) => {
				if (data.type === 'utf8' && data.utf8Data === 'ping') {
					connection.send('pong');
				}
			});
		});
	}
}
