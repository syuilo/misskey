import { EventEmitter } from 'events';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import * as WebSocket from 'ws';
import { DI } from '@/di-symbols.js';
import type { UsersRepository, AccessToken } from '@/models/index.js';
import type { Config } from '@/config.js';
import { NoteReadService } from '@/core/NoteReadService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';
import { LocalUser } from '@/models/entities/User';
import { AuthenticateService, AuthenticationError } from './AuthenticateService.js';
import MainStreamConnection from './stream/index.js';
import { ChannelsService } from './stream/ChannelsService.js';
import type * as http from 'node:http';

@Injectable()
export class StreamingApiServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private cacheService: CacheService,
		private noteReadService: NoteReadService,
		private authenticateService: AuthenticateService,
		private channelsService: ChannelsService,
		private notificationService: NotificationService,
	) {
	}

	@bindThis
	public attachStreamingApi(server: http.Server): void {
		const wss = new WebSocket.WebSocketServer({
			server: server,
		});

		server.on('upgrade', async (request, socket, head) => {
			if (request.url == null) {
				socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
				socket.destroy();
				return;
			}

			const q = new URL(request.url).searchParams;

			let user: LocalUser | null = null;
			let app: AccessToken | null = null;

			try {
				[user, app] = await this.authenticateService.authenticate(q.get('i'));
			} catch (e) {
				if (e instanceof AuthenticationError) {
					socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
				} else {
					socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
				}
				socket.destroy();
				return;
			}

			if (user?.isSuspended) {
				socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
				socket.destroy();
				return;
			}

			wss.handleUpgrade(request, socket, head, (ws) => {
				wss.emit('connection', ws, request, {
					user, app,
				});
			});
		});

		wss.on('connection', async (connection: WebSocket.WebSocket, request: http.IncomingMessage, ctx: { user: LocalUser | null; app: AccessToken | null }) => {
			const { user, app } = ctx;

			const ev = new EventEmitter();

			async function onRedisMessage(_: string, data: string): Promise<void> {
				const parsed = JSON.parse(data);
				ev.emit(parsed.channel, parsed.message);
			}

			this.redisForSub.on('message', onRedisMessage);

			const main = new MainStreamConnection(
				this.channelsService,
				this.noteReadService,
				this.notificationService,
				this.cacheService,
				ev, user, app,
			);

			await main.init(connection);

			const intervalId = user ? setInterval(() => {
				this.usersRepository.update(user.id, {
					lastActiveDate: new Date(),
				});
			}, 1000 * 60 * 5) : null;
			if (user) {
				this.usersRepository.update(user.id, {
					lastActiveDate: new Date(),
				});
			}

			connection.once('close', () => {
				ev.removeAllListeners();
				main.dispose();
				this.redisForSub.off('message', onRedisMessage);
				if (intervalId) clearInterval(intervalId);
			});

			connection.on('message', async (data) => {
				if (data.toString() === 'ping') {
					connection.send('pong');
				}
			});
		});
	}
}
