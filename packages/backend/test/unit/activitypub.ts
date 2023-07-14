process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';

import { ApImageService } from '@/core/activitypub/models/ApImageService.js';
import { ApNoteService } from '@/core/activitypub/models/ApNoteService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { LoggerService } from '@/core/LoggerService.js';
import type { IActor, IApDocument, ICollection, IPost } from '@/core/activitypub/type.js';
import { Meta, Note } from '@/models/index.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { DownloadService } from '@/core/DownloadService.js';
import { MetaService } from '@/core/MetaService.js';
import type { RemoteUser } from '@/models/entities/User.js';
import { MockResolver } from '../misc/mock-resolver.js';

const host = 'https://host1.test';

type NonTransientIActor = IActor & { id: string };
type NonTransientIPost = IPost & { id: string };

function createRandomActor({ actorHost = host } = {}): NonTransientIActor {
	const preferredUsername = secureRndstr(8);
	const actorId = `${actorHost}/users/${preferredUsername.toLowerCase()}`;

	return {
		'@context': 'https://www.w3.org/ns/activitystreams',
		id: actorId,
		type: 'Person',
		preferredUsername,
		inbox: `${actorId}/inbox`,
		outbox: `${actorId}/outbox`,
	};
}

function createRandomNote(actor: NonTransientIActor): NonTransientIPost {
	const id = secureRndstr(8);
	const noteId = `${new URL(actor.id).origin}/notes/${id}`;

	return {
		id: noteId,
		type: 'Note',
		attributedTo: actor.id,
		content: 'test test foo',
	};
}

function createRandomNotes(actor: NonTransientIActor, length: number): NonTransientIPost[] {
	return new Array(length).fill(null).map(() => createRandomNote(actor));
}

function createRandomFeaturedCollection(actor: NonTransientIActor, length: number): ICollection {
	const items = createRandomNotes(actor, length);

	return {
		'@context': 'https://www.w3.org/ns/activitystreams',
		type: 'Collection',
		id: actor.outbox as string,
		totalItems: items.length,
		items,
	};
}

async function createRandomRemoteUser(
	resolver: MockResolver,
	personService: ApPersonService,
): Promise<RemoteUser> {
	const actor = createRandomActor();
	resolver.register(actor.id, actor);

	return await personService.createPerson(actor.id, resolver);
}

describe('ActivityPub', () => {
	let imageService: ApImageService;
	let noteService: ApNoteService;
	let personService: ApPersonService;
	let rendererService: ApRendererService;
	let resolver: MockResolver;

	const metaInitial = {
		cacheRemoteFiles: true,
		cacheRemoteSensitiveFiles: true,
		blockedHosts: [] as string[],
		sensitiveWords: [] as string[],
	} as Meta;
	let meta = metaInitial;

	beforeAll(async () => {
		const app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		})
			.overrideProvider(DownloadService).useValue({
				async downloadUrl(): Promise<{ filename: string }> {
					return {
						filename: 'dummy.tmp',
					};
				},
			})
			.overrideProvider(MetaService).useValue({
				async fetch(): Promise<Meta> {
					return meta;
				},
			}).compile();

		await app.init();
		app.enableShutdownHooks();

		noteService = app.get<ApNoteService>(ApNoteService);
		personService = app.get<ApPersonService>(ApPersonService);
		rendererService = app.get<ApRendererService>(ApRendererService);
		imageService = app.get<ApImageService>(ApImageService);
		resolver = new MockResolver(await app.resolve<LoggerService>(LoggerService));

		// Prevent ApPersonService from fetching instance, as it causes Jest import-after-test error
		const federatedInstanceService = app.get<FederatedInstanceService>(FederatedInstanceService);
		jest.spyOn(federatedInstanceService, 'fetch').mockImplementation(() => new Promise(() => { }));
	});

	beforeEach(() => {
		resolver.clear();
	});

	describe('Parse minimum object', () => {
		const actor = createRandomActor();

		const post = {
			'@context': 'https://www.w3.org/ns/activitystreams',
			id: `${host}/users/${secureRndstr(8)}`,
			type: 'Note',
			attributedTo: actor.id,
			to: 'https://www.w3.org/ns/activitystreams#Public',
			content: 'あ',
		};

		test('Minimum Actor', async () => {
			resolver.register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.uri, actor.id);
			assert.deepStrictEqual(user.username, actor.preferredUsername);
			assert.deepStrictEqual(user.inbox, actor.inbox);
		});

		test('Minimum Note', async () => {
			resolver.register(actor.id, actor);
			resolver.register(post.id, post);

			const note = await noteService.createNote(post.id, resolver, true);

			assert.deepStrictEqual(note?.uri, post.id);
			assert.deepStrictEqual(note.visibility, 'public');
			assert.deepStrictEqual(note.text, post.content);
		});
	});

	describe('Name field', () => {
		test('Truncate long name', async () => {
			const actor = {
				...createRandomActor(),
				name: secureRndstr(129),
			};

			resolver.register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.deepStrictEqual(user.name, actor.name.slice(0, 128));
		});

		test('Normalize empty name', async () => {
			const actor = {
				...createRandomActor(),
				name: '',
			};

			resolver.register(actor.id, actor);

			const user = await personService.createPerson(actor.id, resolver);

			assert.strictEqual(user.name, null);
		});
	});

	describe('Renderer', () => {
		test('Render an announce with visibility: followers', () => {
			rendererService.renderAnnounce(null, {
				createdAt: new Date(0),
				visibility: 'followers',
			} as Note);
		});
	});

	describe('Featured', () => {
		test('Fetch featured notes from IActor', async () => {
			const actor = createRandomActor();
			actor.featured = `${actor.id}/collections/featured`;

			const featured = createRandomFeaturedCollection(actor, 5);

			resolver.register(actor.id, actor);
			resolver.register(actor.featured, featured);

			await personService.createPerson(actor.id, resolver);

			// All notes in `featured` are same-origin, no need to fetch notes again
			assert.deepStrictEqual(resolver.remoteGetTrials(), [actor.id, actor.featured]);

			// Created notes without resolving anything
			for (const item of featured.items as IPost[]) {
				const note = await noteService.fetchNote(item);
				assert.ok(note);
				assert.strictEqual(note.text, 'test test foo');
				assert.strictEqual(note.uri, item.id);
			}
		});

		test('Fetch featured notes from IActor pointing to another remote server', async () => {
			const actor1 = createRandomActor();
			actor1.featured = `${actor1.id}/collections/featured`;
			const actor2 = createRandomActor({ actorHost: 'https://host2.test' });

			const actor2Note = createRandomNote(actor2);
			const featured = createRandomFeaturedCollection(actor1, 0);
			(featured.items as IPost[]).push({
				...actor2Note,
				content: 'test test bar', // fraud!
			});

			resolver.register(actor1.id, actor1);
			resolver.register(actor1.featured, featured);
			resolver.register(actor2.id, actor2);
			resolver.register(actor2Note.id, actor2Note);

			await personService.createPerson(actor1.id, resolver);

			// actor2Note is from a different server and needs to be fetched again
			assert.deepStrictEqual(
				resolver.remoteGetTrials(),
				[actor1.id, actor1.featured, actor2Note.id, actor2.id],
			);

			const note = await noteService.fetchNote(actor2Note.id);
			assert.ok(note);

			// Reflects the original content instead of the fraud
			assert.strictEqual(note.text, 'test test foo');
			assert.strictEqual(note.uri, actor2Note.id);
		});
	});

	describe('Images', () => {
		test('Create images', async () => {
			const imageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/foo.png',
				name: '',
			};
			const driveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				imageObject,
			);
			assert.ok(!driveFile.isLink);

			const sensitiveImageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/bar.png',
				name: '',
				sensitive: true,
			};
			const sensitiveDriveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				sensitiveImageObject,
			);
			assert.ok(!sensitiveDriveFile.isLink);
		});

		test('cacheRemoteFiles=false disables caching', async () => {
			meta = { ...metaInitial, cacheRemoteFiles: false };

			const imageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/foo.png',
				name: '',
			};
			const driveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				imageObject,
			);
			assert.ok(driveFile.isLink);

			const sensitiveImageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/bar.png',
				name: '',
				sensitive: true,
			};
			const sensitiveDriveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				sensitiveImageObject,
			);
			assert.ok(sensitiveDriveFile.isLink);
		});

		test('cacheRemoteSensitiveFiles=false only affects sensitive files', async () => {
			meta = { ...metaInitial, cacheRemoteSensitiveFiles: false };

			const imageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/foo.png',
				name: '',
			};
			const driveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				imageObject,
			);
			assert.ok(!driveFile.isLink);

			const sensitiveImageObject: IApDocument = {
				type: 'Document',
				mediaType: 'image/png',
				url: 'http://host1.test/bar.png',
				name: '',
				sensitive: true,
			};
			const sensitiveDriveFile = await imageService.createImage(
				await createRandomRemoteUser(resolver, personService),
				sensitiveImageObject,
			);
			assert.ok(sensitiveDriveFile.isLink);
		});
	});
});
