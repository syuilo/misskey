/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { FastifyAdapter as BullBoardFastifyAdapter } from '@bull-board/fastify';
import ms from 'ms';
import sharp from 'sharp';
import pug from 'pug';
import { In, IsNull } from 'typeorm';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyCookie from '@fastify/cookie';
import fastifyProxy from '@fastify/http-proxy';
import vary from 'vary';
import htmlSafeJsonStringify from 'htmlescape';
import type { Config } from '@/config.js';
import { getNoteSummary } from '@/misc/get-note-summary.js';
import { DI } from '@/di-symbols.js';
import * as Acct from '@/misc/acct.js';
import type {
	DbQueue,
	DeliverQueue,
	EndedPollNotificationQueue,
	InboxQueue,
	ObjectStorageQueue,
	RelationshipQueue,
	SystemQueue,
	UserWebhookDeliverQueue,
	SystemWebhookDeliverQueue,
} from '@/core/QueueModule.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { PageEntityService } from '@/core/entities/PageEntityService.js';
import { MetaEntityService } from '@/core/entities/MetaEntityService.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';
import { ChannelEntityService } from '@/core/entities/ChannelEntityService.js';
import type {
	AnnouncementsRepository,
	ChannelsRepository,
	ClipsRepository,
	FlashsRepository,
	GalleryPostsRepository,
	MiMeta,
	NotesRepository,
	PagesRepository,
	ReversiGamesRepository,
	UserProfilesRepository,
	UsersRepository,
} from '@/models/_.js';
import type Logger from '@/logger.js';
import { handleRequestRedirectToOmitSearch } from '@/misc/fastify-hook-handlers.js';
import { bindThis } from '@/decorators.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { ReversiGameEntityService } from '@/core/entities/ReversiGameEntityService.js';
import { AnnouncementEntityService } from '@/core/entities/AnnouncementEntityService.js';
import { FeedService } from './FeedService.js';
import { UrlPreviewService } from './UrlPreviewService.js';
import { ClientLoggerService } from './ClientLoggerService.js';
import type { FastifyInstance, FastifyPluginOptions, FastifyReply } from 'fastify';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const staticAssets = `${_dirname}/../../../assets/`;
const clientAssets = `${_dirname}/../../../../frontend/assets/`;
const assets = `${_dirname}/../../../../../built/_frontend_dist_/`;
const swAssets = `${_dirname}/../../../../../built/_sw_dist_/`;
const frontendViteOut = `${_dirname}/../../../../../built/_frontend_vite_/`;
const frontendEmbedViteOut = `${_dirname}/../../../../../built/_frontend_embed_vite_/`;
const tarball = `${_dirname}/../../../../../built/tarball/`;

@Injectable()
export class ClientServerService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.channelsRepository)
		private channelsRepository: ChannelsRepository,

		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.pagesRepository)
		private pagesRepository: PagesRepository,

		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		@Inject(DI.announcementsRepository)
		private announcementsRepository: AnnouncementsRepository,

		private flashEntityService: FlashEntityService,
		private userEntityService: UserEntityService,
		private noteEntityService: NoteEntityService,
		private pageEntityService: PageEntityService,
		private metaEntityService: MetaEntityService,
		private galleryPostEntityService: GalleryPostEntityService,
		private clipEntityService: ClipEntityService,
		private channelEntityService: ChannelEntityService,
		private reversiGameEntityService: ReversiGameEntityService,
		private announcementEntityService: AnnouncementEntityService,
		private urlPreviewService: UrlPreviewService,
		private feedService: FeedService,
		private roleService: RoleService,
		private clientLoggerService: ClientLoggerService,

		@Inject('queue:system') public systemQueue: SystemQueue,
		@Inject('queue:endedPollNotification') public endedPollNotificationQueue: EndedPollNotificationQueue,
		@Inject('queue:deliver') public deliverQueue: DeliverQueue,
		@Inject('queue:inbox') public inboxQueue: InboxQueue,
		@Inject('queue:db') public dbQueue: DbQueue,
		@Inject('queue:relationship') public relationshipQueue: RelationshipQueue,
		@Inject('queue:objectStorage') public objectStorageQueue: ObjectStorageQueue,
		@Inject('queue:userWebhookDeliver') public userWebhookDeliverQueue: UserWebhookDeliverQueue,
		@Inject('queue:systemWebhookDeliver') public systemWebhookDeliverQueue: SystemWebhookDeliverQueue,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	private async manifestHandler(reply: FastifyReply) {
		let manifest = {
			// 空文字列の場合右辺を使いたいため
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			'short_name': this.meta.shortName || this.meta.name || this.config.host,
			// 空文字列の場合右辺を使いたいため
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			'name': this.meta.name || this.config.host,
			'start_url': '/',
			'display': 'standalone',
			'background_color': '#313a42',
			// 空文字列の場合右辺を使いたいため
			// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
			'theme_color': this.meta.themeColor || '#86b300',
			'icons': [{
				// 空文字列の場合右辺を使いたいため
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				'src': this.meta.app192IconUrl || '/static-assets/icons/192.png',
				'sizes': '192x192',
				'type': 'image/png',
				'purpose': 'maskable',
			}, {
				// 空文字列の場合右辺を使いたいため
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				'src': this.meta.app512IconUrl || '/static-assets/icons/512.png',
				'sizes': '512x512',
				'type': 'image/png',
				'purpose': 'maskable',
			}, {
				'src': '/static-assets/splash.png',
				'sizes': '300x300',
				'type': 'image/png',
				'purpose': 'any',
			}],
			'share_target': {
				'action': '/share/',
				'method': 'GET',
				'enctype': 'application/x-www-form-urlencoded',
				'params': {
					'title': 'title',
					'text': 'text',
					'url': 'url',
				},
			},
		};

		manifest = {
			...manifest,
			...JSON.parse(this.meta.manifestJsonOverride === '' ? '{}' : this.meta.manifestJsonOverride),
		};

		reply.header('Cache-Control', 'max-age=300');
		return (manifest);
	}

	@bindThis
	private async generateCommonPugData(meta: MiMeta) {
		return {
			instanceName: meta.name ?? 'Misskey',
			icon: meta.iconUrl,
			appleTouchIcon: meta.app512IconUrl,
			themeColor: meta.themeColor,
			serverErrorImageUrl: meta.serverErrorImageUrl ?? 'https://xn--931a.moe/assets/error.jpg',
			infoImageUrl: meta.infoImageUrl ?? 'https://xn--931a.moe/assets/info.jpg',
			notFoundImageUrl: meta.notFoundImageUrl ?? 'https://xn--931a.moe/assets/not-found.jpg',
			instanceUrl: this.config.url,
			metaJson: htmlSafeJsonStringify(await this.metaEntityService.packDetailed(meta)),
			now: Date.now(),
		};
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.register(fastifyCookie, {});

		//#region Bull Dashboard
		const bullBoardPath = '/queue';

		// Authenticate
		fastify.addHook('onRequest', async (request, reply) => {
			if (request.routeOptions.url == null) {
				reply.code(404).send('Not found');
				return;
			}

			// %71ueueとかでリクエストされたら困るため
			const url = decodeURI(request.routeOptions.url);
			if (url === bullBoardPath || url.startsWith(bullBoardPath + '/')) {
				if (!url.startsWith(bullBoardPath + '/static/')) {
					reply.header('Cache-Control', 'private, max-age=0, must-revalidate');
				}

				const token = request.cookies.token;
				if (token == null) {
					reply.code(401).send('Login required');
					return;
				}
				const user = await this.usersRepository.findOneBy({ token });
				if (user == null) {
					reply.code(403).send('No such user');
					return;
				}
				const isAdministrator = await this.roleService.isAdministrator(user);
				if (!isAdministrator) {
					reply.code(403).send('Access denied');
					return;
				}
			}
		});

		const bullBoardServerAdapter = new BullBoardFastifyAdapter();

		createBullBoard({
			queues: [
				this.systemQueue,
				this.endedPollNotificationQueue,
				this.deliverQueue,
				this.inboxQueue,
				this.dbQueue,
				this.relationshipQueue,
				this.objectStorageQueue,
				this.userWebhookDeliverQueue,
				this.systemWebhookDeliverQueue,
			].map(q => new BullMQAdapter(q)),
			serverAdapter: bullBoardServerAdapter,
		});

		bullBoardServerAdapter.setBasePath(bullBoardPath);
		(fastify.register as any)(bullBoardServerAdapter.registerPlugin(), { prefix: bullBoardPath });
		//#endregion

		fastify.register(fastifyView, {
			root: _dirname + '/views',
			engine: {
				pug: pug,
			},
			defaultContext: {
				version: this.config.version,
				config: this.config,
			},
		});

		fastify.addHook('onRequest', (request, reply, done) => {
			// クリックジャッキング防止のためiFrameの中に入れられないようにする
			reply.header('X-Frame-Options', 'DENY');
			done();
		});

		//#region vite assets
		if (this.config.frontendEmbedManifestExists) {
			fastify.register((fastify, options, done) => {
				fastify.register(fastifyStatic, {
					root: frontendViteOut,
					prefix: '/vite/',
					maxAge: ms('30 days'),
					immutable: true,
					decorateReply: false,
				});
				fastify.register(fastifyStatic, {
					root: frontendEmbedViteOut,
					prefix: '/embed_vite/',
					maxAge: ms('30 days'),
					immutable: true,
					decorateReply: false,
				});
				fastify.addHook('onRequest', handleRequestRedirectToOmitSearch);
				done();
			});
		} else {
			const configUrl = new URL(this.config.url);
			const urlOriginWithoutPort = configUrl.origin.replace(/:\d+$/, '');

			const port = (process.env.VITE_PORT ?? '5173');
			fastify.register(fastifyProxy, {
				upstream: urlOriginWithoutPort + ':' + port,
				prefix: '/vite',
				rewritePrefix: '/vite',
			});

			const embedPort = (process.env.EMBED_VITE_PORT ?? '5174');
			fastify.register(fastifyProxy, {
				upstream: urlOriginWithoutPort + ':' + embedPort,
				prefix: '/embed_vite',
				rewritePrefix: '/embed_vite',
			});
		}
		//#endregion

		//#region static assets

		fastify.register(fastifyStatic, {
			root: staticAssets,
			prefix: '/static-assets/',
			maxAge: ms('7 days'),
			decorateReply: false,
		});

		fastify.register(fastifyStatic, {
			root: clientAssets,
			prefix: '/client-assets/',
			maxAge: ms('7 days'),
			decorateReply: false,
		});

		fastify.register(fastifyStatic, {
			root: assets,
			prefix: '/assets/',
			maxAge: ms('7 days'),
			decorateReply: false,
		});

		fastify.register((fastify, options, done) => {
			fastify.register(fastifyStatic, {
				root: tarball,
				prefix: '/tarball/',
				maxAge: ms('30 days'),
				immutable: true,
				decorateReply: false,
			});
			fastify.addHook('onRequest', handleRequestRedirectToOmitSearch);
			done();
		});

		fastify.get('/favicon.ico', async (request, reply) => {
			return reply.sendFile('/favicon.ico', staticAssets);
		});

		fastify.get('/apple-touch-icon.png', async (request, reply) => {
			return reply.sendFile('/apple-touch-icon.png', staticAssets);
		});

		fastify.get<{ Params: { path: string } }>('/fluent-emoji/:path(.*)', async (request, reply) => {
			const path = request.params.path;

			if (!path.match(/^[0-9a-f-]+\.png$/)) {
				reply.code(404);
				return;
			}

			reply.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

			return await reply.sendFile(path, `${_dirname}/../../../../../fluent-emojis/dist/`, {
				maxAge: ms('30 days'),
			});
		});

		fastify.get<{ Params: { path: string } }>('/twemoji/:path(.*)', async (request, reply) => {
			const path = request.params.path;

			if (!path.match(/^[0-9a-f-]+\.svg$/)) {
				reply.code(404);
				return;
			}

			reply.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

			return await reply.sendFile(path, `${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/`, {
				maxAge: ms('30 days'),
			});
		});

		fastify.get<{ Params: { path: string } }>('/twemoji-badge/:path(.*)', async (request, reply) => {
			const path = request.params.path;

			if (!path.match(/^[0-9a-f-]+\.png$/)) {
				reply.code(404);
				return;
			}

			const mask = await sharp(
				`${_dirname}/../../../node_modules/@discordapp/twemoji/dist/svg/${path.replace('.png', '')}.svg`,
				{ density: 1000 },
			)
				.resize(488, 488)
				.greyscale()
				.normalise()
				.linear(1.75, -(128 * 1.75) + 128) // 1.75x contrast
				.flatten({ background: '#000' })
				.extend({
					top: 12,
					bottom: 12,
					left: 12,
					right: 12,
					background: '#000',
				})
				.toColorspace('b-w')
				.png()
				.toBuffer();

			const buffer = await sharp({
				create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
			})
				.pipelineColorspace('b-w')
				.boolean(mask, 'eor')
				.resize(96, 96)
				.png()
				.toBuffer();

			reply.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');
			reply.header('Cache-Control', 'max-age=2592000');
			reply.header('Content-Type', 'image/png');
			return buffer;
		});

		// ServiceWorker
		fastify.get('/sw.js', async (request, reply) => {
			return await reply.sendFile('/sw.js', swAssets, {
				maxAge: ms('10 minutes'),
			});
		});

		// Manifest
		fastify.get('/manifest.json', async (request, reply) => await this.manifestHandler(reply));

		// Embed Javascript
		fastify.get('/embed.js', async (request, reply) => {
			return await reply.sendFile('/embed.js', staticAssets, {
				maxAge: ms('1 day'),
			});
		});

		fastify.get('/robots.txt', async (request, reply) => {
			return await reply.sendFile('/robots.txt', staticAssets);
		});

		// OpenSearch XML
		fastify.get('/opensearch.xml', async (request, reply) => {
			const name = this.meta.name ?? 'Misskey';
			let content = '';
			content += '<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">';
			content += `<ShortName>${name}</ShortName>`;
			content += `<Description>${name} Search</Description>`;
			content += '<InputEncoding>UTF-8</InputEncoding>';
			content += `<Image width="16" height="16" type="image/x-icon">${this.config.url}/favicon.ico</Image>`;
			content += `<Url type="text/html" template="${this.config.url}/search?q={searchTerms}"/>`;
			content += '</OpenSearchDescription>';

			reply.header('Content-Type', 'application/opensearchdescription+xml');
			return await reply.send(content);
		});

		//#endregion

		const renderBase = async (reply: FastifyReply, data: { [key: string]: any } = {}) => {
			reply.header('Cache-Control', 'public, max-age=30');
			return await reply.view('base', {
				img: this.meta.bannerUrl,
				url: this.config.url,
				title: this.meta.name ?? 'Misskey',
				desc: this.meta.description,
				...await this.generateCommonPugData(this.meta),
				...data,
			});
		};

		// URL preview endpoint
		fastify.get<{ Querystring: { url: string; lang: string; } }>('/url', (request, reply) => this.urlPreviewService.handle(request, reply));

		const getFeed = async (acct: string) => {
			const { username, host } = Acct.parse(acct);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
				isSuspended: false,
				requireSigninToViewContents: false,
			});

			return user && await this.feedService.packFeed(user);
		};

		// Atom
		fastify.get<{ Params: { user?: string; } }>('/@:user.atom', async (request, reply) => {
			if (request.params.user == null) return await renderBase(reply);

			const feed = await getFeed(request.params.user);

			if (feed) {
				reply.header('Content-Type', 'application/atom+xml; charset=utf-8');
				return feed.atom1();
			} else {
				reply.code(404);
				return;
			}
		});

		// RSS
		fastify.get<{ Params: { user?: string; } }>('/@:user.rss', async (request, reply) => {
			if (request.params.user == null) return await renderBase(reply);

			const feed = await getFeed(request.params.user);

			if (feed) {
				reply.header('Content-Type', 'application/rss+xml; charset=utf-8');
				return feed.rss2();
			} else {
				reply.code(404);
				return;
			}
		});

		// JSON
		fastify.get<{ Params: { user?: string; } }>('/@:user.json', async (request, reply) => {
			if (request.params.user == null) return await renderBase(reply);

			const feed = await getFeed(request.params.user);

			if (feed) {
				reply.header('Content-Type', 'application/json; charset=utf-8');
				return feed.json1();
			} else {
				reply.code(404);
				return;
			}
		});

		//#region SSR
		// User
		fastify.get<{ Params: { user: string; sub?: string; } }>('/@:user/:sub?', async (request, reply) => {
			const { username, host } = Acct.parse(request.params.user);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
				isSuspended: false,
			});

			vary(reply.raw, 'Accept');

			if (user != null) {
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
				const me = profile.fields
					? profile.fields
						.filter(filed => filed.value != null && filed.value.match(/^https?:/))
						.map(field => field.value)
					: [];

				reply.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					reply.header('X-Robots-Tag', 'noimageai');
					reply.header('X-Robots-Tag', 'noai');
				}

				const _user = await this.userEntityService.pack(user, null, {
					schema: 'UserDetailed',
					userProfile: profile,
				});

				return await reply.view('user', {
					user, profile, me,
					avatarUrl: user.avatarUrl ?? this.userEntityService.getIdenticonUrl(user),
					sub: request.params.sub,
					...await this.generateCommonPugData(this.meta),
					clientCtx: htmlSafeJsonStringify({
						user: _user,
					}),
				});
			} else {
				// リモートユーザーなので
				// モデレータがAPI経由で参照可能にするために404にはしない
				return await renderBase(reply);
			}
		});

		fastify.get<{ Params: { user: string; } }>('/users/:user', async (request, reply) => {
			const user = await this.usersRepository.findOneBy({
				id: request.params.user,
				host: IsNull(),
				isSuspended: false,
			});

			if (user == null) {
				reply.code(404);
				return;
			}

			vary(reply.raw, 'Accept');

			reply.redirect(`/@${user.username}${ user.host == null ? '' : '@' + user.host}`);
		});

		// Note
		fastify.get<{ Params: { note: string; } }>('/notes/:note', async (request, reply) => {
			vary(reply.raw, 'Accept');

			const note = await this.notesRepository.findOne({
				where: {
					id: request.params.note,
					visibility: In(['public', 'home']),
				},
				relations: ['user'],
			});

			if (note && !note.user!.requireSigninToViewContents) {
				const _note = await this.noteEntityService.pack(note);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: note.userId });
				reply.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					reply.header('X-Robots-Tag', 'noimageai');
					reply.header('X-Robots-Tag', 'noai');
				}
				return await reply.view('note', {
					note: _note,
					profile,
					avatarUrl: _note.user.avatarUrl,
					// TODO: Let locale changeable by instance setting
					summary: getNoteSummary(_note),
					...await this.generateCommonPugData(this.meta),
					clientCtx: htmlSafeJsonStringify({
						note: _note,
					}),
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Page
		fastify.get<{ Params: { user: string; page: string; } }>('/@:user/pages/:page', async (request, reply) => {
			const { username, host } = Acct.parse(request.params.user);
			const user = await this.usersRepository.findOneBy({
				usernameLower: username.toLowerCase(),
				host: host ?? IsNull(),
			});

			if (user == null) return;

			const page = await this.pagesRepository.findOneBy({
				name: request.params.page,
				userId: user.id,
			});

			if (page) {
				const _page = await this.pageEntityService.pack(page);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: page.userId });
				if (['public'].includes(page.visibility)) {
					reply.header('Cache-Control', 'public, max-age=15');
				} else {
					reply.header('Cache-Control', 'private, max-age=0, must-revalidate');
				}
				if (profile.preventAiLearning) {
					reply.header('X-Robots-Tag', 'noimageai');
					reply.header('X-Robots-Tag', 'noai');
				}
				return await reply.view('page', {
					page: _page,
					profile,
					avatarUrl: _page.user.avatarUrl,
					...await this.generateCommonPugData(this.meta),
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Flash
		fastify.get<{ Params: { id: string; } }>('/play/:id', async (request, reply) => {
			const flash = await this.flashsRepository.findOneBy({
				id: request.params.id,
			});

			if (flash) {
				const _flash = await this.flashEntityService.pack(flash);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: flash.userId });
				reply.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					reply.header('X-Robots-Tag', 'noimageai');
					reply.header('X-Robots-Tag', 'noai');
				}
				return await reply.view('flash', {
					flash: _flash,
					profile,
					avatarUrl: _flash.user.avatarUrl,
					...await this.generateCommonPugData(this.meta),
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Clip
		fastify.get<{ Params: { clip: string; } }>('/clips/:clip', async (request, reply) => {
			const clip = await this.clipsRepository.findOneBy({
				id: request.params.clip,
			});

			if (clip && clip.isPublic) {
				const _clip = await this.clipEntityService.pack(clip);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: clip.userId });
				reply.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					reply.header('X-Robots-Tag', 'noimageai');
					reply.header('X-Robots-Tag', 'noai');
				}
				return await reply.view('clip', {
					clip: _clip,
					profile,
					avatarUrl: _clip.user.avatarUrl,
					...await this.generateCommonPugData(this.meta),
					clientCtx: htmlSafeJsonStringify({
						clip: _clip,
					}),
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Gallery post
		fastify.get<{ Params: { post: string; } }>('/gallery/:post', async (request, reply) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: request.params.post });

			if (post) {
				const _post = await this.galleryPostEntityService.pack(post);
				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: post.userId });
				reply.header('Cache-Control', 'public, max-age=15');
				if (profile.preventAiLearning) {
					reply.header('X-Robots-Tag', 'noimageai');
					reply.header('X-Robots-Tag', 'noai');
				}
				return await reply.view('gallery-post', {
					post: _post,
					profile,
					avatarUrl: _post.user.avatarUrl,
					...await this.generateCommonPugData(this.meta),
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Channel
		fastify.get<{ Params: { channel: string; } }>('/channels/:channel', async (request, reply) => {
			const channel = await this.channelsRepository.findOneBy({
				id: request.params.channel,
			});

			if (channel) {
				const _channel = await this.channelEntityService.pack(channel);
				reply.header('Cache-Control', 'public, max-age=15');
				return await reply.view('channel', {
					channel: _channel,
					...await this.generateCommonPugData(this.meta),
				});
			} else {
				return await renderBase(reply);
			}
		});

		// Reversi game
		fastify.get<{ Params: { game: string; } }>('/reversi/g/:game', async (request, reply) => {
			const game = await this.reversiGamesRepository.findOneBy({
				id: request.params.game,
			});

			if (game) {
				const _game = await this.reversiGameEntityService.packDetail(game);
				reply.header('Cache-Control', 'public, max-age=3600');
				return await reply.view('reversi-game', {
					game: _game,
					...await this.generateCommonPugData(this.meta),
				});
			} else {
				return await renderBase(reply);
			}
		});

		// 個別お知らせページ
		fastify.get<{ Params: { announcementId: string; } }>('/announcements/:announcementId', async (request, reply) => {
			const announcement = await this.announcementsRepository.findOneBy({
				id: request.params.announcementId,
			});

			if (announcement) {
				const _announcement = await this.announcementEntityService.pack(announcement);
				reply.header('Cache-Control', 'public, max-age=3600');
				return await reply.view('announcement', {
					announcement: _announcement,
					...await this.generateCommonPugData(this.meta),
				});
			} else {
				return await renderBase(reply);
			}
		});
		//#endregion

		//#region noindex pages
		// Tags
		fastify.get<{ Params: { clip: string; } }>('/tags/:tag', async (request, reply) => {
			return await renderBase(reply, { noindex: true });
		});

		// User with Tags
		fastify.get<{ Params: { clip: string; } }>('/user-tags/:tag', async (request, reply) => {
			return await renderBase(reply, { noindex: true });
		});
		//#endregion

		//#region embed pages
		fastify.get<{ Params: { user: string; } }>('/embed/user-timeline/:user', async (request, reply) => {
			reply.removeHeader('X-Frame-Options');

			const user = await this.usersRepository.findOneBy({
				id: request.params.user,
			});

			if (user == null) return;
			if (user.host != null) return;

			const _user = await this.userEntityService.pack(user);

			reply.header('Cache-Control', 'public, max-age=3600');
			return await reply.view('base-embed', {
				title: this.meta.name ?? 'Misskey',
				...await this.generateCommonPugData(this.meta),
				embedCtx: htmlSafeJsonStringify({
					user: _user,
				}),
			});
		});

		fastify.get<{ Params: { note: string; } }>('/embed/notes/:note', async (request, reply) => {
			reply.removeHeader('X-Frame-Options');

			const note = await this.notesRepository.findOneBy({
				id: request.params.note,
			});

			if (note == null) return;
			if (['specified', 'followers'].includes(note.visibility)) return;
			if (note.userHost != null) return;

			const _note = await this.noteEntityService.pack(note, null, { detail: true });

			reply.header('Cache-Control', 'public, max-age=3600');
			return await reply.view('base-embed', {
				title: this.meta.name ?? 'Misskey',
				...await this.generateCommonPugData(this.meta),
				embedCtx: htmlSafeJsonStringify({
					note: _note,
				}),
			});
		});

		fastify.get<{ Params: { clip: string; } }>('/embed/clips/:clip', async (request, reply) => {
			reply.removeHeader('X-Frame-Options');

			const clip = await this.clipsRepository.findOneBy({
				id: request.params.clip,
			});

			if (clip == null) return;

			const _clip = await this.clipEntityService.pack(clip);

			reply.header('Cache-Control', 'public, max-age=3600');
			return await reply.view('base-embed', {
				title: this.meta.name ?? 'Misskey',
				...await this.generateCommonPugData(this.meta),
				embedCtx: htmlSafeJsonStringify({
					clip: _clip,
				}),
			});
		});

		fastify.get('/embed/*', async (request, reply) => {
			reply.removeHeader('X-Frame-Options');

			reply.header('Cache-Control', 'public, max-age=3600');
			return await reply.view('base-embed', {
				title: this.meta.name ?? 'Misskey',
				...await this.generateCommonPugData(this.meta),
			});
		});

		fastify.get('/_info_card_', async (request, reply) => {
			reply.removeHeader('X-Frame-Options');

			return await reply.view('info-card', {
				version: this.config.version,
				host: this.config.host,
				meta: this.meta,
				originalUsersCount: await this.usersRepository.countBy({ host: IsNull() }),
				originalNotesCount: await this.notesRepository.countBy({ userHost: IsNull() }),
			});
		});
		//#endregion

		fastify.get('/bios', async (request, reply) => {
			return await reply.view('bios', {
				version: this.config.version,
			});
		});

		fastify.get('/cli', async (request, reply) => {
			return await reply.view('cli', {
				version: this.config.version,
			});
		});

		const override = (source: string, target: string, depth = 0) =>
			[, ...target.split('/').filter(x => x), ...source.split('/').filter(x => x).splice(depth)].join('/');

		fastify.get('/flush', async (request, reply) => {
			return await reply.view('flush');
		});

		// streamingに非WebSocketリクエストが来た場合にbase htmlをキャシュ付きで返すと、Proxy等でそのパスがキャッシュされておかしくなる
		fastify.get('/streaming', async (request, reply) => {
			reply.code(503);
			reply.header('Cache-Control', 'private, max-age=0');
		});

		// Render base html for all requests
		fastify.get('*', async (request, reply) => {
			return await renderBase(reply);
		});

		fastify.setErrorHandler(async (error, request, reply) => {
			const errId = randomUUID();
			this.clientLoggerService.logger.error(`Internal error occurred in ${request.routeOptions.url}: ${error.message}`, {
				path: request.routeOptions.url,
				params: request.params,
				query: request.query,
				code: error.name,
				stack: error.stack,
				id: errId,
			});
			reply.code(500);
			reply.header('Cache-Control', 'max-age=10, must-revalidate');
			return await reply.view('error', {
				code: error.code,
				id: errId,
			});
		});

		done();
	}
}
