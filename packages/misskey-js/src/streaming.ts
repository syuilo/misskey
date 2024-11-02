import { EventEmitter } from 'eventemitter3';
import _ReconnectingWebsocket from 'reconnecting-websocket';
import type { BroadcastEvents, Channels } from './streaming.types.js';

const ReconnectingWebsocket = _ReconnectingWebsocket as unknown as typeof _ReconnectingWebsocket['default'];

export function urlQuery(obj: Record<string, string | number | boolean | undefined>): string {
	const params = Object.entries(obj)
		.filter(([, v]) => Array.isArray(v) ? v.length : v !== undefined)
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		.reduce((a, [k, v]) => (a[k] = v!, a), {} as Record<string, string | number | boolean>);

	return Object.entries(params)
		.map((e) => `${e[0]}=${encodeURIComponent(e[1])}`)
		.join('&');
}

type AnyOf<T extends Record<PropertyKey, unknown>> = T[keyof T];

export type StreamEvents = {
	_connected_: void;
	_disconnected_: void;
} & BroadcastEvents;

export interface IStream extends EventEmitter<StreamEvents> {
	state: 'initializing' | 'reconnecting' | 'connected';

	useChannel<C extends keyof Channels>(channel: C, params?: Channels[C]['params'], name?: string): IChannelConnection<Channels[C]>;
	removeSharedConnection(connection: SharedConnection): void;
	removeSharedConnectionPool(pool: Pool): void;
	disconnectToChannel(connection: NonSharedConnection): void;
	send(typeOrPayload: string): void;
	send(typeOrPayload: string, payload: unknown): void;
	send(typeOrPayload: Record<string, unknown> | unknown[]): void;
	send(typeOrPayload: string | Record<string, unknown> | unknown[], payload?: unknown): void;
	ping(): void;
	heartbeat(): void;
	close(): void;
}

/**
 * Misskey stream connection
 */
// eslint-disable-next-line import/no-default-export
export default class Stream extends EventEmitter<StreamEvents> implements IStream {
	private stream: _ReconnectingWebsocket.default;
	public state: 'initializing' | 'reconnecting' | 'connected' = 'initializing';
	private sharedConnectionPools: Pool[] = [];
	private sharedConnections: SharedConnection[] = [];
	private nonSharedConnections: NonSharedConnection[] = [];
	private idCounter = 0;

	constructor(origin: string, user: { token: string; } | null, options?: {
		WebSocket?: _ReconnectingWebsocket.Options['WebSocket'];
	}) {
		super();

		this.genId = this.genId.bind(this);
		this.useChannel = this.useChannel.bind(this);
		this.useSharedConnection = this.useSharedConnection.bind(this);
		this.removeSharedConnection = this.removeSharedConnection.bind(this);
		this.removeSharedConnectionPool = this.removeSharedConnectionPool.bind(this);
		this.connectToChannel = this.connectToChannel.bind(this);
		this.disconnectToChannel = this.disconnectToChannel.bind(this);
		this.onOpen = this.onOpen.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.send = this.send.bind(this);
		this.close = this.close.bind(this);

		// eslint-disable-next-line no-param-reassign
		options = options ?? { };

		const query = urlQuery({
			i: user?.token,

			// To prevent cache of an HTML such as error screen
			_t: Date.now(),
		});

		const wsOrigin = origin.replace('http://', 'ws://').replace('https://', 'wss://');

		this.stream = new ReconnectingWebsocket(`${wsOrigin}/streaming?${query}`, '', {
			minReconnectionDelay: 1, // https://github.com/pladaria/reconnecting-websocket/issues/91
			WebSocket: options.WebSocket,
		});
		this.stream.addEventListener('open', this.onOpen);
		this.stream.addEventListener('close', this.onClose);
		this.stream.addEventListener('message', this.onMessage);
	}

	private genId(): string {
		return (++this.idCounter).toString();
	}

	public useChannel<C extends keyof Channels>(channel: C, params?: Channels[C]['params'], name?: string): Connection<Channels[C]> {
		if (params) {
			return this.connectToChannel(channel, params);
		} else {
			return this.useSharedConnection(channel, name);
		}
	}

	private useSharedConnection<C extends keyof Channels>(channel: C, name?: string): SharedConnection<Channels[C]> {
		let pool = this.sharedConnectionPools.find(p => p.channel === channel);

		if (pool == null) {
			pool = new Pool(this, channel, this.genId());
			this.sharedConnectionPools.push(pool);
		}

		const connection = new SharedConnection<Channels[C]>(this, channel, pool, name);
		this.sharedConnections.push(connection as unknown as SharedConnection);
		return connection;
	}

	public removeSharedConnection(connection: SharedConnection): void {
		this.sharedConnections = this.sharedConnections.filter(c => c !== connection);
	}

	public removeSharedConnectionPool(pool: Pool): void {
		this.sharedConnectionPools = this.sharedConnectionPools.filter(p => p !== pool);
	}

	private connectToChannel<C extends keyof Channels>(channel: C, params: Channels[C]['params']): NonSharedConnection<Channels[C]> {
		const connection = new NonSharedConnection(this, channel, this.genId(), params);
		this.nonSharedConnections.push(connection as unknown as NonSharedConnection);
		return connection;
	}

	public disconnectToChannel(connection: NonSharedConnection): void {
		this.nonSharedConnections = this.nonSharedConnections.filter(c => c !== connection);
	}

	/**
	 * Callback of when open connection
	 */
	private onOpen(): void {
		const isReconnect = this.state === 'reconnecting';

		this.state = 'connected';
		this.emit('_connected_');

		// チャンネル再接続
		if (isReconnect) {
			for (const p of this.sharedConnectionPools) p.connect();
			for (const c of this.nonSharedConnections) c.connect();
		}
	}

	/**
	 * Callback of when close connection
	 */
	private onClose(): void {
		if (this.state === 'connected') {
			this.state = 'reconnecting';
			this.emit('_disconnected_');
		}
	}

	/**
	 * Callback of when received a message from connection
	 */
	private onMessage(message: { data: string; }): void {
		const { type, body } = JSON.parse(message.data);

		if (type === 'channel') {
			const id = body.id;

			let connections: Connection[];

			connections = this.sharedConnections.filter(c => c.id === id);

			if (connections.length === 0) {
				const found = this.nonSharedConnections.find(c => c.id === id);
				if (found) {
					connections = [found];
				}
			}

			for (const c of connections) {
				c.emit(body.type, body.body);
				c.inCount++;
			}
		} else {
			this.emit(type, body);
		}
	}

	/**
	 * Send a message to connection
	 * ! ストリーム上のやり取りはすべてJSONで行われます !
	 */
	public send(typeOrPayload: string): void
	public send(typeOrPayload: string, payload: unknown): void
	public send(typeOrPayload: Record<string, unknown> | unknown[]): void
	public send(typeOrPayload: string | Record<string, unknown> | unknown[], payload?: unknown): void {
		if (typeof typeOrPayload === 'string') {
			this.stream.send(JSON.stringify({
				type: typeOrPayload,
				...(payload === undefined ? {} : { body: payload }),
			}));
			return;
		}

		this.stream.send(JSON.stringify(typeOrPayload));
	}

	public ping(): void {
		this.stream.send('ping');
	}

	public heartbeat(): void {
		this.stream.send('h');
	}

	/**
	 * Close this connection
	 */
	public close(): void {
		this.stream.close();
	}
}

// TODO: これらのクラスを Stream クラスの内部クラスにすれば余計なメンバをpublicにしないで済むかも？
// もしくは @internal を使う？ https://www.typescriptlang.org/tsconfig#stripInternal
class Pool {
	public channel: string;
	public id: string;
	protected stream: Stream;
	public users = 0;
	private disposeTimerId: ReturnType<typeof setTimeout> | null = null;
	private isConnected = false;

	constructor(stream: Stream, channel: string, id: string) {
		this.onStreamDisconnected = this.onStreamDisconnected.bind(this);
		this.inc = this.inc.bind(this);
		this.dec = this.dec.bind(this);
		this.connect = this.connect.bind(this);
		this.disconnect = this.disconnect.bind(this);

		this.channel = channel;
		this.stream = stream;
		this.id = id;

		this.stream.on('_disconnected_', this.onStreamDisconnected);
	}

	private onStreamDisconnected(): void {
		this.isConnected = false;
	}

	public inc(): void {
		if (this.users === 0 && !this.isConnected) {
			this.connect();
		}

		this.users++;

		// タイマー解除
		if (this.disposeTimerId) {
			clearTimeout(this.disposeTimerId);
			this.disposeTimerId = null;
		}
	}

	public dec(): void {
		this.users--;

		// そのコネクションの利用者が誰もいなくなったら
		if (this.users === 0) {
			// また直ぐに再利用される可能性があるので、一定時間待ち、
			// 新たな利用者が現れなければコネクションを切断する
			this.disposeTimerId = setTimeout(() => {
				this.disconnect();
			}, 3000);
		}
	}

	public connect(): void {
		if (this.isConnected) return;
		this.isConnected = true;
		this.stream.send('connect', {
			channel: this.channel,
			id: this.id,
		});
	}

	private disconnect(): void {
		this.stream.off('_disconnected_', this.onStreamDisconnected);
		this.stream.send('disconnect', { id: this.id });
		this.stream.removeSharedConnectionPool(this);
	}
}

export interface IChannelConnection<Channel extends AnyOf<Channels> = AnyOf<Channels>> extends EventEmitter<Channel['events']> {
	id: string;
	name?: string;
	inCount: number;
	outCount: number;
	channel: string;

	send<T extends keyof Channel['receives']>(type: T, body: Channel['receives'][T]): void;
	dispose(): void;
}

export abstract class Connection<Channel extends AnyOf<Channels> = AnyOf<Channels>> extends EventEmitter<Channel['events']> implements IChannelConnection<Channel> {
	public channel: string;
	protected stream: Stream;
	public abstract id: string;

	public name?: string; // for debug
	public inCount = 0; // for debug
	public outCount = 0; // for debug

	constructor(stream: Stream, channel: string, name?: string) {
		super();

		this.send = this.send.bind(this);

		this.stream = stream;
		this.channel = channel;
		if (name !== undefined) {
			this.name = name;
		}
	}

	public send<T extends keyof Channel['receives']>(type: T, body: Channel['receives'][T]): void {
		this.stream.send('ch', {
			id: this.id,
			type: type,
			body: body,
		});

		this.outCount++;
	}

	public abstract dispose(): void;
}

class SharedConnection<Channel extends AnyOf<Channels> = AnyOf<Channels>> extends Connection<Channel> {
	private pool: Pool;

	public get id(): string {
		return this.pool.id;
	}

	constructor(stream: Stream, channel: string, pool: Pool, name?: string) {
		super(stream, channel, name);

		this.dispose = this.dispose.bind(this);

		this.pool = pool;
		this.pool.inc();
	}

	public dispose(): void {
		this.pool.dec();
		this.removeAllListeners();
		this.stream.removeSharedConnection(this as unknown as SharedConnection);
	}
}

class NonSharedConnection<Channel extends AnyOf<Channels> = AnyOf<Channels>> extends Connection<Channel> {
	public id: string;
	protected params: Channel['params'];

	constructor(stream: Stream, channel: string, id: string, params: Channel['params']) {
		super(stream, channel);

		this.connect = this.connect.bind(this);
		this.dispose = this.dispose.bind(this);

		this.params = params;
		this.id = id;

		this.connect();
	}

	public connect(): void {
		this.stream.send('connect', {
			channel: this.channel,
			id: this.id,
			params: this.params,
		});
	}

	public dispose(): void {
		this.removeAllListeners();
		this.stream.send('disconnect', { id: this.id });
		this.stream.disconnectToChannel(this as unknown as NonSharedConnection);
	}
}
