import * as http from 'node:http';
import * as https from 'node:https';
import CacheableLookup from 'cacheable-lookup';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { StatusError } from '@/misc/status-error.js';
import { bindThis } from '@/decorators.js';
import * as undici from 'undici';
import { LookupFunction } from 'node:net';

// true to allow, false to deny
export type IpChecker = (ip: string) => boolean;

/* 
 *  Child class to create and save Agent for fetch.
 *  You should construct this when you want
 *  to change timeout, size limit, socket connect function, etc.
 */
export class UndiciFetcher {
	/**
	 * Get http non-proxy agent (undici)
	 */
	public nonProxiedAgent: undici.Agent;
  
	/**
	 * Get http proxy or non-proxy agent (undici)
	 */
	public agent: undici.ProxyAgent | undici.Agent;

	private proxyBypassHosts: string[];
	private userAgent: string | undefined;

	constructor(args: {
		agentOptions: undici.Agent.Options;
		proxy?: {
			uri: string;
			options?: undici.Agent.Options; // Override of agentOptions
		},
		proxyBypassHosts?: string[];
		userAgent?: string;
	}) {
		this.proxyBypassHosts = args.proxyBypassHosts ?? [];
		this.userAgent = args.userAgent;

		this.nonProxiedAgent = new undici.Agent({
			...args.agentOptions,
		});
		this.agent = args.proxy
			? new undici.ProxyAgent({
				...args.agentOptions,
				...args.proxy.options,

				uri: args.proxy.uri,
			})
			: this.nonProxiedAgent;
	}

	/**
	 * Get agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	@bindThis
	public getAgentByUrl(url: URL, bypassProxy = false): undici.Agent | undici.ProxyAgent {
		if (bypassProxy || this.proxyBypassHosts.includes(url.hostname)) {
			return this.nonProxiedAgent;
		} else {
			return this.agent;
		}
	}

	@bindThis
	public async fetch(
		url: string | URL,
		options: undici.RequestInit = {},
		privateOptions: { noOkError?: boolean; bypassProxy?: boolean; } = { noOkError: false, bypassProxy: false }
	): Promise<undici.Response> {
		const res = await undici.fetch(url, {
			dispatcher: this.getAgentByUrl(new URL(url), privateOptions.bypassProxy),
			...options,
		})
		if (!res.ok && !privateOptions.noOkError) {
			throw new StatusError(`${res.status} ${res.statusText}`, res.status, res.statusText);
		}
		return res;
	}

	@bindThis
	public async getJson<T extends unknown>(url: string, accept = 'application/json, */*', headers?: Record<string, string>): Promise<T> {
		const res = await this.fetch(
			url,
			{
				headers: Object.assign({
					'User-Agent': this.userAgent,
					Accept: accept,
				}, headers ?? {}),
			}
		);

		return await res.json() as T;
	}

	@bindThis
	public async getHtml(url: string, accept = 'text/html, */*', headers?: Record<string, string>): Promise<string> {
		const res = await this.fetch(
			url,
			{
				headers: Object.assign({
					'User-Agent': this.userAgent,
					Accept: accept,
				}, headers ?? {}),
			}
		);

		return await res.text();
	}
}

@Injectable()
export class HttpRequestService {
	public defaultFetcher: UndiciFetcher;
	public fetch: UndiciFetcher['fetch'];
	public getHtml: UndiciFetcher['getHtml'];
	public defaultJsonFetcher: UndiciFetcher;
	public getJson: UndiciFetcher['getJson'];

	//#region for old http/https, only used in S3Service
	// http non-proxy agent
	private http: http.Agent;

	// https non-proxy agent
	private https: https.Agent;

	// http proxy or non-proxy agent
	public httpAgent: http.Agent;

	// https proxy or non-proxy agent
	public httpsAgent: https.Agent;
	//#endregion

	public readonly dnsCache: CacheableLookup;
	public readonly clientDefaults: undici.Agent.Options;
	private maxSockets: number;

	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
		this.dnsCache = new CacheableLookup({
			maxTtl: 3600,	// 1hours
			errorTtl: 30,	// 30secs
			lookup: false,	// nativeのdns.lookupにfallbackしない
		});

		this.clientDefaults = {
			keepAliveTimeout: 30 * 1000,
			keepAliveMaxTimeout: 10 * 60 * 1000,
			keepAliveTimeoutThreshold: 1 * 1000,
			strictContentLength: true,
			headersTimeout: 10 * 1000,
			bodyTimeout: 10 * 1000,
			maxHeaderSize: 16364, // default
			maxResponseSize: 10 * 1024 * 1024,
			connect: {
				timeout: 10 * 1000, // コネクションが確立するまでのタイムアウト
				maxCachedSessions: 300, // TLSセッションのキャッシュ数 https://github.com/nodejs/undici/blob/v5.14.0/lib/core/connect.js#L80
				lookup: this.dnsCache.lookup as LookupFunction, // https://github.com/nodejs/undici/blob/v5.14.0/lib/core/connect.js#L98
			},
		}

		this.maxSockets = Math.max(256, this.config.deliverJobConcurrency ?? 128);

		this.defaultFetcher = new UndiciFetcher(this.getStandardUndiciFetcherConstructorOption());

		this.fetch = this.defaultFetcher.fetch;
		this.getHtml = this.defaultFetcher.getHtml;

		this.defaultJsonFetcher = new UndiciFetcher(this.getStandardUndiciFetcherConstructorOption({
			maxResponseSize: 1024 * 256,
		}));

		this.getJson = this.defaultJsonFetcher.getJson;

		//#region for old http/https, only used in S3Service
		this.http = new http.Agent({
			keepAlive: true,
			keepAliveMsecs: 30 * 1000,
			lookup: this.dnsCache.lookup,
		} as http.AgentOptions);
		
		this.https = new https.Agent({
			keepAlive: true,
			keepAliveMsecs: 30 * 1000,
			lookup: this.dnsCache.lookup,
		} as https.AgentOptions);

		this.httpAgent = config.proxy
			? new HttpProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets: this.maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
			})
			: this.http;

		this.httpsAgent = config.proxy
			? new HttpsProxyAgent({
				keepAlive: true,
				keepAliveMsecs: 30 * 1000,
				maxSockets: this.maxSockets,
				maxFreeSockets: 256,
				scheduling: 'lifo',
				proxy: config.proxy,
			})
			: this.https;
		//#endregion
	}

	/**
	 * Get http agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	@bindThis
	public getStandardUndiciFetcherConstructorOption(opts: undici.Agent.Options = {}) {
		return {
			agentOptions: {
				...this.clientDefaults,
				...opts,
			},
			...(this.config.proxy ? {
			proxy: {
				uri: this.config.proxy,
				options: {
					connections: this.maxSockets,
				}
			}
			} : {}),
		}
	}

	/**
	 * Get http agent by URL
	 * @param url URL
	 * @param bypassProxy Allways bypass proxy
	 */
	@bindThis
	public getHttpAgentByUrl(url: URL, bypassProxy = false): http.Agent | https.Agent {
		if (bypassProxy || (this.config.proxyBypassHosts || []).includes(url.hostname)) {
			return url.protocol === 'http:' ? this.http : this.https;
		} else {
			return url.protocol === 'http:' ? this.httpAgent : this.httpsAgent;
		}
	}

	/**
	 * check ip
	 */
	@bindThis
	public getConnectorWithIpCheck(connector: undici.buildConnector.connector, checkIp: IpChecker): undici.buildConnector.connectorAsync {
		return (options, cb) => {
			connector(options, (err, socket) => {
				if (err) {
					cb(err, null);
					return;
				}

				if (socket.remoteAddress == undefined) {
					cb(new Error('remoteAddress is undefined (maybe socket destroyed)'), null);
					return;
				}

				// allow
				if (checkIp(socket.remoteAddress)) {
					cb(null, socket);
					return;
				}

				socket.destroy();
				cb(new StatusError('IP is not allowed', 403, 'IP is not allowed'), null);
			});
		};
	}
}
