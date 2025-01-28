/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';
import { IncomingMessage } from 'node:http';
import { Inject, Injectable } from '@nestjs/common';
import fastifyAccepts from '@fastify/accepts';
import httpSignature from '@peertube/http-signature';
import { Brackets, In, IsNull, LessThan, Not } from 'typeorm';
import accepts from 'accepts';
import vary from 'vary';
import secureJson from 'secure-json-parse';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository, NotesRepository, EmojisRepository, NoteReactionsRepository, UserProfilesRepository, UserNotePiningsRepository, UsersRepository, FollowRequestsRepository } from '@/models/_.js';
import * as url from '@/misc/prelude/url.js';
import type { Config } from '@/config.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { QueueService } from '@/core/QueueService.js';
import type { MiLocalUser, MiRemoteUser, MiUser } from '@/models/User.js';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import type { MiFollowing } from '@/models/Following.js';
import { countIf } from '@/misc/prelude/array.js';
import type { MiNote } from '@/models/Note.js';
import { QueryService } from '@/core/QueryService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { IActivity } from '@/core/activitypub/type.js';
import { isQuote, isRenote } from '@/misc/is-renote.js';
import * as Acct from '@/misc/acct.js';
import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginOptions, FastifyBodyParser } from 'fastify';
import type { FindOptionsWhere } from 'typeorm';

const ACTIVITY_JSON = 'application/activity+json; charset=utf-8';
const LD_JSON = 'application/ld+json; profile="https://www.w3.org/ns/activitystreams"; charset=utf-8';

@Injectable()
export class ActivityPubServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		@Inject(DI.userNotePiningsRepository)
		private userNotePiningsRepository: UserNotePiningsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private utilityService: UtilityService,
		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private queueService: QueueService,
		private userKeypairService: UserKeypairService,
		private queryService: QueryService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	private setResponseType(request: FastifyRequest, reply: FastifyReply): void {
		const accept = request.accepts().type([ACTIVITY_JSON, LD_JSON]);
		if (accept === LD_JSON) {
			reply.type(LD_JSON);
		} else {
			reply.type(ACTIVITY_JSON);
		}
	}

	/**
	 * Pack Create<Note> or Announce Activity
	 * @param note Note
	 */
	@bindThis
	private async packActivity(note: MiNote): Promise<any> {
		if (isRenote(note) && !isQuote(note)) {
			const renote = await this.notesRepository.findOneByOrFail({ id: note.renoteId });
			return this.apRendererService.renderAnnounce(renote.uri ? renote.uri : `${this.config.url}/notes/${renote.id}`, note);
		}

		return this.apRendererService.renderCreate(await this.apRendererService.renderNote(note, false), note);
	}

	@bindThis
	private inbox(request: FastifyRequest, reply: FastifyReply) {
		let signature;

		try {
			signature = httpSignature.parseRequest(request.raw, { 'headers': ['(request-target)', 'host', 'date'], authorizationHeaderName: 'signature' });
		} catch (e) {
			reply.code(401);
			return;
		}

		if (signature.params.headers.indexOf('host') === -1
			|| request.headers.host !== this.config.host) {
			// Host not specified or not match.
			reply.code(401);
			return;
		}

		if (signature.params.headers.indexOf('digest') === -1) {
			// Digest not found.
			reply.code(401);
		} else {
			const digest = request.headers.digest;

			if (typeof digest !== 'string') {
				// Huh?
				reply.code(401);
				return;
			}

			const re = /^([a-zA-Z0-9\-]+)=(.+)$/;
			const match = digest.match(re);

			if (match == null) {
				// Invalid digest
				reply.code(401);
				return;
			}

			const algo = match[1].toUpperCase();
			const digestValue = match[2];

			if (algo !== 'SHA-256') {
				// Unsupported digest algorithm
				reply.code(401);
				return;
			}

			if (request.rawBody == null) {
				// Bad request
				reply.code(400);
				return;
			}

			const hash = crypto.createHash('sha256').update(request.rawBody).digest('base64');

			if (hash !== digestValue) {
				// Invalid digest
				reply.code(401);
				return;
			}
		}

		this.queueService.inbox(request.body as IActivity, signature);

		reply.code(202);
	}

	@bindThis
	private async followers(
		request: FastifyRequest<{ Params: { user: string; }; Querystring: { cursor?: string; page?: string; }; }>,
		reply: FastifyReply,
	) {
		const userId = request.params.user;

		const cursor = request.query.cursor;
		if (cursor != null && typeof cursor !== 'string') {
			reply.code(400);
			return;
		}

		const page = request.query.page === 'true';

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			reply.code(404);
			return;
		}

		//#region Check ff visibility
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		if (profile.followersVisibility === 'private') {
			reply.code(403);
			reply.header('Cache-Control', 'public, max-age=30');
			return;
		} else if (profile.followersVisibility === 'followers') {
			reply.code(403);
			reply.header('Cache-Control', 'public, max-age=30');
			return;
		}
		//#endregion

		const limit = 10;
		const partOf = `${this.config.url}/users/${userId}/followers`;

		if (page) {
			const query = {
				followeeId: user.id,
			} as FindOptionsWhere<MiFollowing>;

			// カーソルが指定されている場合
			if (cursor) {
				query.id = LessThan(cursor);
			}

			// Get followers
			const followings = await this.followingsRepository.find({
				where: query,
				take: limit + 1,
				order: { id: -1 },
			});

			// 「次のページ」があるかどうか
			const inStock = followings.length === limit + 1;
			if (inStock) followings.pop();

			const renderedFollowers = await Promise.all(followings.map(following => this.apRendererService.renderFollowUser(following.followerId)));
			const rendered = this.apRendererService.renderOrderedCollectionPage(
				`${partOf}?${url.query({
					page: 'true',
					cursor,
				})}`,
				user.followersCount, renderedFollowers, partOf,
				undefined,
				inStock ? `${partOf}?${url.query({
					page: 'true',
					cursor: followings.at(-1)!.id,
				})}` : undefined,
			);

			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(rendered));
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(
				partOf,
				user.followersCount,
				`${partOf}?page=true`,
			);
			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(rendered));
		}
	}

	@bindThis
	private async following(
		request: FastifyRequest<{ Params: { user: string; }; Querystring: { cursor?: string; page?: string; }; }>,
		reply: FastifyReply,
	) {
		const userId = request.params.user;

		const cursor = request.query.cursor;
		if (cursor != null && typeof cursor !== 'string') {
			reply.code(400);
			return;
		}

		const page = request.query.page === 'true';

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			reply.code(404);
			return;
		}

		//#region Check ff visibility
		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		if (profile.followingVisibility === 'private') {
			reply.code(403);
			reply.header('Cache-Control', 'public, max-age=30');
			return;
		} else if (profile.followingVisibility === 'followers') {
			reply.code(403);
			reply.header('Cache-Control', 'public, max-age=30');
			return;
		}
		//#endregion

		const limit = 10;
		const partOf = `${this.config.url}/users/${userId}/following`;

		if (page) {
			const query = {
				followerId: user.id,
			} as FindOptionsWhere<MiFollowing>;

			// カーソルが指定されている場合
			if (cursor) {
				query.id = LessThan(cursor);
			}

			// Get followings
			const followings = await this.followingsRepository.find({
				where: query,
				take: limit + 1,
				order: { id: -1 },
			});

			// 「次のページ」があるかどうか
			const inStock = followings.length === limit + 1;
			if (inStock) followings.pop();

			const renderedFollowees = await Promise.all(followings.map(following => this.apRendererService.renderFollowUser(following.followeeId)));
			const rendered = this.apRendererService.renderOrderedCollectionPage(
				`${partOf}?${url.query({
					page: 'true',
					cursor,
				})}`,
				user.followingCount, renderedFollowees, partOf,
				undefined,
				inStock ? `${partOf}?${url.query({
					page: 'true',
					cursor: followings.at(-1)!.id,
				})}` : undefined,
			);

			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(rendered));
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(
				partOf,
				user.followingCount,
				`${partOf}?page=true`,
			);
			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(rendered));
		}
	}

	@bindThis
	private async liked(
		request: FastifyRequest<{ Params: { user: string; }; Querystring: { cursor?: string; page?: string; }; }>,
		reply: FastifyReply,
	) {
		const userId = request.params.user;

		const cursor = request.query.cursor;
		if (cursor != null && typeof cursor !== 'string') {
			reply.code(400);
			return;
		}

		const page = request.query.page === 'true';

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			reply.code(404);
			return;
		}

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		if (!profile.publicReactions) {
			reply.code(403);
			reply.header('Cache-Control', 'public, max-age=30');
			return;
		}

		const limit = 10;
		const partOf = `${this.config.url}/users/${userId}/liked`;

		if (page) {
			const query = this.noteReactionsRepository.createQueryBuilder('reaction')
				.andWhere('reaction.userId = :userId', { userId: user.id });

			// カーソルが指定されている場合
			if (cursor) {
				query.andWhere('reaction.id < :id', { id: cursor });
			}

			const reactions = await query
				.limit(limit + 1)
				.orderBy('reaction.id', 'DESC')
				.innerJoinAndSelect('reaction.note', 'note')
				.leftJoinAndSelect('note.user', 'noteUser')
				.andWhere(new Brackets(qb => {
					qb
						.where('note.visibility = \'public\'')
						.orWhere('note.visibility = \'home\'');
				}))
				.andWhere('note.localOnly = FALSE')
				.andWhere('noteUser.isSuspended = FALSE')
				.getMany();

			// 「次のページ」があるかどうか
			const inStock = reactions.length === limit + 1;
			if (inStock) reactions.pop();

			const reactedNotes = await Promise.all(reactions.map(({ note }) => note!.uri || this.apRendererService.renderNote(note!, false)));
			const rendered = this.apRendererService.renderOrderedCollectionPage(
				`${partOf}?${url.query({
					page: 'true',
					cursor,
				})}`,
				undefined, reactedNotes, partOf,
				undefined,
				inStock ? `${partOf}?${url.query({
					page: 'true',
					cursor: reactions.at(-1)!.id,
				})}` : undefined,
			);

			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(rendered));
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(
				partOf,
				undefined,
				`${partOf}?page=true`,
			);
			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(rendered));
		}
	}

	@bindThis
	private async featured(request: FastifyRequest<{ Params: { user: string; }; }>, reply: FastifyReply) {
		const userId = request.params.user;

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			reply.code(404);
			return;
		}

		const pinings = await this.userNotePiningsRepository.find({
			where: { userId: user.id },
			order: { id: 'DESC' },
		});

		const pinnedNotes = (await Promise.all(pinings.map(pining =>
			this.notesRepository.findOneByOrFail({ id: pining.noteId }))))
			.filter(note => !note.localOnly && ['public', 'home'].includes(note.visibility));

		const renderedNotes = await Promise.all(pinnedNotes.map(note => this.apRendererService.renderNote(note)));

		const rendered = this.apRendererService.renderOrderedCollection(
			`${this.config.url}/users/${userId}/collections/featured`,
			renderedNotes.length,
			undefined,
			undefined,
			renderedNotes,
		);

		reply.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(request, reply);
		return (this.apRendererService.addContext(rendered));
	}

	@bindThis
	private async outbox(
		request: FastifyRequest<{
			Params: { user: string; };
			Querystring: { since_id?: string; until_id?: string; page?: string; };
		}>,
		reply: FastifyReply,
	) {
		const userId = request.params.user;

		const sinceId = request.query.since_id;
		if (sinceId != null && typeof sinceId !== 'string') {
			reply.code(400);
			return;
		}

		const untilId = request.query.until_id;
		if (untilId != null && typeof untilId !== 'string') {
			reply.code(400);
			return;
		}

		const page = request.query.page === 'true';

		if (countIf(x => x != null, [sinceId, untilId]) > 1) {
			reply.code(400);
			return;
		}

		const user = await this.usersRepository.findOneBy({
			id: userId,
			host: IsNull(),
		});

		if (user == null) {
			reply.code(404);
			return;
		}

		const limit = 20;
		const partOf = `${this.config.url}/users/${userId}/outbox`;

		if (page) {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), sinceId, untilId)
				.andWhere('note.userId = :userId', { userId: user.id })
				.andWhere(new Brackets(qb => {
					qb
						.where('note.visibility = \'public\'')
						.orWhere('note.visibility = \'home\'');
				}))
				.andWhere('note.localOnly = FALSE');

			const notes = await query.limit(limit).getMany();

			if (sinceId) notes.reverse();

			const activities = await Promise.all(notes.map(note => this.packActivity(note)));
			const rendered = this.apRendererService.renderOrderedCollectionPage(
				`${partOf}?${url.query({
					page: 'true',
					since_id: sinceId,
					until_id: untilId,
				})}`,
				user.notesCount, activities, partOf,
				notes.length ? `${partOf}?${url.query({
					page: 'true',
					since_id: notes[0].id,
				})}` : undefined,
				notes.length ? `${partOf}?${url.query({
					page: 'true',
					until_id: notes.at(-1)!.id,
				})}` : undefined,
			);

			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(rendered));
		} else {
			// index page
			const rendered = this.apRendererService.renderOrderedCollection(
				partOf,
				user.notesCount,
				`${partOf}?page=true`,
				`${partOf}?page=true&since_id=000000000000000000000000`,
			);
			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(rendered));
		}
	}

	@bindThis
	private async userInfo(request: FastifyRequest, reply: FastifyReply, user: MiUser | null) {
		if (user == null) {
			reply.code(404);
			return;
		}

		// リモートだったらリダイレクト
		if (user.host != null) {
			if (user.uri == null || this.utilityService.isSelfHost(user.host)) {
				reply.code(500);
				return;
			}
			reply.redirect(user.uri, 301);
			return;
		}

		reply.header('Cache-Control', 'public, max-age=180');
		this.setResponseType(request, reply);
		return (this.apRendererService.addContext(await this.apRendererService.renderPerson(user as MiLocalUser)));
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.addConstraintStrategy({
			name: 'apOrHtml',
			storage() {
				const store = {} as any;
				return {
					get(key: string) {
						return store[key] ?? null;
					},
					set(key: string, value: any) {
						store[key] = value;
					},
				};
			},
			deriveConstraint(request: IncomingMessage) {
				const accepted = accepts(request).type(['html', ACTIVITY_JSON, LD_JSON]);
				if (accepted === false) return null;
				return accepted !== 'html' ? 'ap' : 'html';
			},
		});

		const almostDefaultJsonParser: FastifyBodyParser<Buffer> = function (request, rawBody, done) {
			if (rawBody.length === 0) {
				const err = new Error('Body cannot be empty!') as any;
				err.statusCode = 400;
				return done(err);
			}

			try {
				const json = secureJson.parse(rawBody.toString('utf8'), null, {
					protoAction: 'ignore',
					constructorAction: 'ignore',
				});
				done(null, json);
			} catch (err: any) {
				err.statusCode = 400;
				return done(err);
			}
		};

		fastify.register(fastifyAccepts);
		fastify.addContentTypeParser('application/activity+json', { parseAs: 'buffer' }, almostDefaultJsonParser);
		fastify.addContentTypeParser('application/ld+json', { parseAs: 'buffer' }, almostDefaultJsonParser);

		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Access-Control-Allow-Headers', 'Accept');
			reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
			reply.header('Access-Control-Allow-Origin', '*');
			reply.header('Access-Control-Expose-Headers', 'Vary');
			done();
		});

		//#region Routing
		// inbox (limit: 64kb)
		fastify.post('/inbox', { config: { rawBody: true }, bodyLimit: 1024 * 64 }, async (request, reply) => await this.inbox(request, reply));
		fastify.post('/users/:user/inbox', { config: { rawBody: true }, bodyLimit: 1024 * 64 }, async (request, reply) => await this.inbox(request, reply));

		// note
		fastify.get<{ Params: { note: string; } }>('/notes/:note', { constraints: { apOrHtml: 'ap' } }, async (request, reply) => {
			vary(reply.raw, 'Accept');

			const note = await this.notesRepository.findOneBy({
				id: request.params.note,
				visibility: In(['public', 'home']),
				localOnly: false,
			});

			if (note == null) {
				reply.code(404);
				return;
			}

			// リモートだったらリダイレクト
			if (note.userHost != null) {
				if (note.uri == null || this.utilityService.isSelfHost(note.userHost)) {
					reply.code(500);
					return;
				}
				reply.redirect(note.uri);
				return;
			}

			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return this.apRendererService.addContext(await this.apRendererService.renderNote(note, false));
		});

		// note activity
		fastify.get<{ Params: { note: string; } }>('/notes/:note/activity', async (request, reply) => {
			vary(reply.raw, 'Accept');

			const note = await this.notesRepository.findOneBy({
				id: request.params.note,
				userHost: IsNull(),
				visibility: In(['public', 'home']),
				localOnly: false,
			});

			if (note == null) {
				reply.code(404);
				return;
			}

			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(await this.packActivity(note)));
		});

		// outbox
		fastify.get<{
			Params: { user: string; };
			Querystring: { since_id?: string; until_id?: string; page?: string; };
		}>('/users/:user/outbox', async (request, reply) => await this.outbox(request, reply));

		// followers
		fastify.get<{
			Params: { user: string; };
			Querystring: { cursor?: string; page?: string; };
		}>('/users/:user/followers', async (request, reply) => await this.followers(request, reply));

		// following
		fastify.get<{
			Params: { user: string; };
			Querystring: { cursor?: string; page?: string; };
		}>('/users/:user/following', async (request, reply) => await this.following(request, reply));

		// liked
		fastify.get<{
			Params: { user: string; };
			Querystring: { cursor?: string; page?: string; };
		}>('/users/:user/liked', async (request, reply) => await this.liked(request, reply));

		// featured
		fastify.get<{ Params: { user: string; }; }>('/users/:user/collections/featured', async (request, reply) => await this.featured(request, reply));

		// publickey
		fastify.get<{ Params: { user: string; } }>('/users/:user/publickey', async (request, reply) => {
			const userId = request.params.user;

			const user = await this.usersRepository.findOneBy({
				id: userId,
				host: IsNull(),
			});

			if (user == null) {
				reply.code(404);
				return;
			}

			const keypair = await this.userKeypairService.getUserKeypair(user.id);

			if (this.userEntityService.isLocalUser(user)) {
				reply.header('Cache-Control', 'public, max-age=180');
				this.setResponseType(request, reply);
				return (this.apRendererService.addContext(this.apRendererService.renderKey(user, keypair)));
			} else {
				reply.code(400);
				return;
			}
		});

		fastify.get<{ Params: { user: string; } }>('/users/:user', { constraints: { apOrHtml: 'ap' } }, async (request, reply) => {
			vary(reply.raw, 'Accept');

			const userId = request.params.user;

			const user = await this.usersRepository.findOneBy({
				id: userId,
				isSuspended: false,
			});

			return await this.userInfo(request, reply, user);
		});

		fastify.get<{ Params: { acct: string; } }>('/@:acct', { constraints: { apOrHtml: 'ap' } }, async (request, reply) => {
			vary(reply.raw, 'Accept');

			const acct = Acct.parse(request.params.acct);

			const user = await this.usersRepository.findOneBy({
				usernameLower: acct.username,
				host: acct.host ?? IsNull(),
				isSuspended: false,
			});

			return await this.userInfo(request, reply, user);
		});
		//#endregion

		// emoji
		fastify.get<{ Params: { emoji: string; } }>('/emojis/:emoji', async (request, reply) => {
			const emoji = await this.emojisRepository.findOneBy({
				host: IsNull(),
				name: request.params.emoji,
			});

			if (emoji == null || emoji.localOnly) {
				reply.code(404);
				return;
			}

			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(await this.apRendererService.renderEmoji(emoji)));
		});

		// like
		fastify.get<{ Params: { like: string; } }>('/likes/:like', async (request, reply) => {
			const reaction = await this.noteReactionsRepository.findOneBy({ id: request.params.like });

			if (reaction == null) {
				reply.code(404);
				return;
			}

			const note = await this.notesRepository.findOneBy({ id: reaction.noteId });

			if (note == null) {
				reply.code(404);
				return;
			}

			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(await this.apRendererService.renderLike(reaction, note)));
		});

		// follow
		fastify.get<{ Params: { follower: string; followee: string; } }>('/follows/:follower/:followee', async (request, reply) => {
			// This may be used before the follow is completed, so we do not
			// check if the following exists.

			const [follower, followee] = await Promise.all([
				this.usersRepository.findOneBy({
					id: request.params.follower,
					host: IsNull(),
				}),
				this.usersRepository.findOneBy({
					id: request.params.followee,
					host: Not(IsNull()),
				}),
			]) as [MiLocalUser | MiRemoteUser | null, MiLocalUser | MiRemoteUser | null];

			if (follower == null || followee == null) {
				reply.code(404);
				return;
			}

			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(this.apRendererService.renderFollow(follower, followee)));
		});

		// follow
		fastify.get<{ Params: { followRequestId: string ; } }>('/follows/:followRequestId', async (request, reply) => {
			// This may be used before the follow is completed, so we do not
			// check if the following exists and only check if the follow request exists.

			const followRequest = await this.followRequestsRepository.findOneBy({
				id: request.params.followRequestId,
			});

			if (followRequest == null) {
				reply.code(404);
				return;
			}

			const [follower, followee] = await Promise.all([
				this.usersRepository.findOneBy({
					id: followRequest.followerId,
					host: IsNull(),
				}),
				this.usersRepository.findOneBy({
					id: followRequest.followeeId,
					host: Not(IsNull()),
				}),
			]) as [MiLocalUser | MiRemoteUser | null, MiLocalUser | MiRemoteUser | null];

			if (follower == null || followee == null) {
				reply.code(404);
				return;
			}

			reply.header('Cache-Control', 'public, max-age=180');
			this.setResponseType(request, reply);
			return (this.apRendererService.addContext(this.apRendererService.renderFollow(follower, followee)));
		});

		done();
	}
}
