import { strictEqual } from 'assert';
import * as Misskey from 'misskey-js';
import { createAccount, fetchAdmin, isNoteUpdatedEventFired, isFired, type LoginUser, type Request, resolveRemoteUser, sleep, createRole } from './utils.js';

const bAdmin = await fetchAdmin('b.test');

describe('Timeline', () => {
	let alice: LoginUser, bob: LoginUser;
	let bobInA: Misskey.entities.UserDetailedNotMe, aliceInB: Misskey.entities.UserDetailedNotMe;

	beforeAll(async () => {
		[alice, bob] = await Promise.all([
			createAccount('a.test'),
			createAccount('b.test'),
		]);

		[bobInA, aliceInB] = await Promise.all([
			resolveRemoteUser('b.test', bob.id, alice),
			resolveRemoteUser('a.test', alice.id, bob),
		]);

		await bob.client.request('following/create', { userId: aliceInB.id });
		await sleep();
	});

	type TimelineChannel = keyof Misskey.Channels & (`${string}Timeline` | 'antenna' | 'userList' | 'hashtag');
	type TimelineEndpoint = keyof Misskey.Endpoints & (`${string}timeline` | 'antennas/notes' | 'roles/notes' | 'notes/search-by-tag');
	const timelineMap = new Map<TimelineChannel, TimelineEndpoint>([
		['antenna', 'antennas/notes'],
		['globalTimeline', 'notes/global-timeline'],
		['homeTimeline', 'notes/timeline'],
		['hybridTimeline', 'notes/hybrid-timeline'],
		['localTimeline', 'notes/local-timeline'],
		['roleTimeline', 'roles/notes'],
		['hashtag', 'notes/search-by-tag'],
		['userList', 'notes/user-list-timeline'],
	]);

	async function postAndCheckReception<C extends TimelineChannel>(
		timelineChannel: C,
		expect: boolean,
		noteParams: Misskey.entities.NotesCreateRequest = {},
		channelParams: Misskey.Channels[C]['params'] = {},
	) {
		let note: Misskey.entities.Note | undefined;
		const text = noteParams.text ?? crypto.randomUUID();
		const streamingFired = await isFired(
			'b.test', bob, timelineChannel,
			async () => {
				note = (await alice.client.request('notes/create', { text, ...noteParams })).createdNote;
			},
			'note', (msg) => {
				if (Misskey.note.isStreamNote(msg)) {
					return false;
				}
				return msg.text === text;
			},
			channelParams,
		);
		strictEqual(streamingFired, expect);

		const endpoint = timelineMap.get(timelineChannel)!;
		const params: Misskey.Endpoints[typeof endpoint]['req'] =
			endpoint === 'antennas/notes' ? { antennaId: (channelParams as Misskey.Channels['antenna']['params']).antennaId } :
			endpoint === 'notes/user-list-timeline' ? { listId: (channelParams as Misskey.Channels['userList']['params']).listId } :
			endpoint === 'notes/search-by-tag' ? { query: (channelParams as Misskey.Channels['hashtag']['params']).q } :
			endpoint === 'roles/notes' ? { roleId: (channelParams as Misskey.Channels['roleTimeline']['params']).roleId } :
			{};

		await sleep();
		const notes = await (bob.client.request as Request)(endpoint, params);
		const noteInB = notes.filter(({ uri }) => uri === `https://a.test/notes/${note!.id}`).pop();
		const endpointFired = noteInB != null;
		strictEqual(endpointFired, expect);

		// Let's check Delete reception
		if (expect) {
			const streamingFired = await isNoteUpdatedEventFired(
				'b.test', bob, noteInB!.id,
				async () => await alice.client.request('notes/delete', { noteId: note!.id }),
				msg => msg.type === 'deleted' && msg.id === noteInB!.id,
			);
			strictEqual(streamingFired, true);

			await sleep();
			const notes = await (bob.client.request as Request)(endpoint, params);
			const endpointFired = notes.every(({ uri }) => uri !== `https://a.test/notes/${note!.id}`);
			strictEqual(endpointFired, true);
		}
	}

	describe('homeTimeline', () => {
		// NOTE: narrowing scope intentionally to prevent mistakes by copy-and-paste
		const homeTimeline = 'homeTimeline';

		describe('Check reception of remote followee\'s Note', () => {
			test('Receive remote followee\'s Note', async () => {
				await postAndCheckReception(homeTimeline, true);
			});

			test('Receive remote followee\'s home-only Note', async () => {
				await postAndCheckReception(homeTimeline, true, { visibility: 'home' });
			});

			test('Receive remote followee\'s followers-only Note', async () => {
				await postAndCheckReception(homeTimeline, true, { visibility: 'followers' });
			});

			test('Receive remote followee\'s visible specified-only Note', async () => {
				await postAndCheckReception(homeTimeline, true, { visibility: 'specified', visibleUserIds: [bobInA.id] });
			});

			test('Don\'t receive remote followee\'s localOnly Note', async () => {
				await postAndCheckReception(homeTimeline, false, { localOnly: true });
			});

			test('Don\'t receive remote followee\'s invisible specified-only Note', async () => {
				await postAndCheckReception(homeTimeline, false, { visibility: 'specified' });
			});

			/**
			 * FIXME: can receive this
			 * @see https://github.com/misskey-dev/misskey/issues/14083
			 */
			test.failing('Don\'t receive remote followee\'s invisible and mentioned specified-only Note', async () => {
				await postAndCheckReception(homeTimeline, false, { text: `@${bob.username}@b.test Hello`, visibility: 'specified' });
			});

			/**
			 * FIXME: cannot receive this
			 * @see https://github.com/misskey-dev/misskey/issues/14084
			 */
			test.failing('Receive remote followee\'s visible specified-only reply to invisible specified-only Note', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a', visibility: 'specified' })).createdNote;
				await postAndCheckReception(homeTimeline, true, { replyId: note.id, visibility: 'specified', visibleUserIds: [bobInA.id] });
			});
		});
	});

	describe('localTimeline', () => {
		const localTimeline = 'localTimeline';

		describe('Check reception of remote followee\'s Note', () => {
			test('Don\'t receive remote followee\'s Note', async () => {
				await postAndCheckReception(localTimeline, false);
			});
		});
	});

	describe('hybridTimeline', () => {
		const hybridTimeline = 'hybridTimeline';

		describe('Check reception of remote followee\'s Note', () => {
			test('Receive remote followee\'s Note', async () => {
				await postAndCheckReception(hybridTimeline, true);
			});

			test('Receive remote followee\'s home-only Note', async () => {
				await postAndCheckReception(hybridTimeline, true, { visibility: 'home' });
			});

			test('Receive remote followee\'s followers-only Note', async () => {
				await postAndCheckReception(hybridTimeline, true, { visibility: 'followers' });
			});

			test('Receive remote followee\'s visible specified-only Note', async () => {
				await postAndCheckReception(hybridTimeline, true, { visibility: 'specified', visibleUserIds: [bobInA.id] });
			});
		});
	});

	describe('globalTimeline', () => {
		const globalTimeline = 'globalTimeline';

		describe('Check reception of remote followee\'s Note', () => {
			test('Receive remote followee\'s Note', async () => {
				await postAndCheckReception(globalTimeline, true);
			});

			test('Don\'t receive remote followee\'s home-only Note', async () => {
				await postAndCheckReception(globalTimeline, false, { visibility: 'home' });
			});

			test('Don\'t receive remote followee\'s followers-only Note', async () => {
				await postAndCheckReception(globalTimeline, false, { visibility: 'followers' });
			});

			test('Don\'t receive remote followee\'s visible specified-only Note', async () => {
				await postAndCheckReception(globalTimeline, false, { visibility: 'specified', visibleUserIds: [bobInA.id] });
			});
		});
	});

	describe('userList', () => {
		const userList = 'userList';

		let list: Misskey.entities.UserList;

		beforeAll(async () => {
			list = await bob.client.request('users/lists/create', { name: 'Bob\'s List' });
			await bob.client.request('users/lists/push', { listId: list.id, userId: aliceInB.id });
			await sleep();
		});

		describe('Check reception of remote followee\'s Note', () => {
			test('Receive remote followee\'s Note', async () => {
				await postAndCheckReception(userList, true, {}, { listId: list.id });
			});

			test('Receive remote followee\'s home-only Note', async () => {
				await postAndCheckReception(userList, true, { visibility: 'home' }, { listId: list.id });
			});

			test('Receive remote followee\'s followers-only Note', async () => {
				await postAndCheckReception(userList, true, { visibility: 'followers' }, { listId: list.id });
			});

			test('Receive remote followee\'s visible specified-only Note', async () => {
				await postAndCheckReception(userList, true, { visibility: 'specified', visibleUserIds: [bobInA.id] }, { listId: list.id });
			});
		});
	});

	describe('hashtag', () => {
		const hashtag = 'hashtag';

		describe('Check reception of remote followee\'s Note', () => {
			test('Receive remote followee\'s Note', async () => {
				const tag = crypto.randomUUID();
				await postAndCheckReception(hashtag, true, { text: `#${tag}` }, { q: [[tag]] });
			});

			test('Receive remote followee\'s home-only Note', async () => {
				const tag = crypto.randomUUID();
				await postAndCheckReception(hashtag, true, { text: `#${tag}`, visibility: 'home' }, { q: [[tag]] });
			});

			test('Receive remote followee\'s followers-only Note', async () => {
				const tag = crypto.randomUUID();
				await postAndCheckReception(hashtag, true, { text: `#${tag}`, visibility: 'followers' }, { q: [[tag]] });
			});

			test('Receive remote followee\'s visible specified-only Note', async () => {
				const tag = crypto.randomUUID();
				await postAndCheckReception(hashtag, true, { text: `#${tag}`, visibility: 'specified', visibleUserIds: [bobInA.id] }, { q: [[tag]] });
			});
		});
	});

	describe('roleTimeline', () => {
		const roleTimeline = 'roleTimeline';

		let role: Misskey.entities.Role;

		beforeAll(async () => {
			role = await createRole('b.test', {
				name: 'Remote Users',
				description: 'Remote users are assigned to this role.',
				condFormula: {
					/** TODO: @see https://github.com/misskey-dev/misskey/issues/14169 */
					type: 'isRemote' as never,
				},
			});
			await sleep();
		});

		describe('Check reception of remote followee\'s Note', () => {
			test('Receive remote followee\'s Note', async () => {
				await postAndCheckReception(roleTimeline, true, {}, { roleId: role.id });
			});

			test('Don\'t receive remote followee\'s home-only Note', async () => {
				await postAndCheckReception(roleTimeline, false, { visibility: 'home' }, { roleId: role.id });
			});

			test('Don\'t receive remote followee\'s followers-only Note', async () => {
				await postAndCheckReception(roleTimeline, false, { visibility: 'followers' }, { roleId: role.id });
			});

			test('Don\'t receive remote followee\'s visible specified-only Note', async () => {
				await postAndCheckReception(roleTimeline, false, { visibility: 'specified', visibleUserIds: [bobInA.id] }, { roleId: role.id });
			});
		});

		afterAll(async () => {
			await bAdmin.client.request('admin/roles/delete', { roleId: role.id });
		});
	});

	// TODO: Cannot test
	describe.skip('antenna', () => {
		const antenna = 'antenna';

		let bobAntenna: Misskey.entities.Antenna;

		beforeAll(async () => {
			bobAntenna = await bob.client.request('antennas/create', {
				name: 'Bob\'s Egosurfing Antenna',
				src: 'all',
				keywords: [['Bob']],
				excludeKeywords: [],
				users: [],
				caseSensitive: false,
				localOnly: false,
				withReplies: true,
				withFile: true,
			});
			await sleep();
		});

		describe('Check reception of remote followee\'s Note', () => {
			test('Receive remote followee\'s Note', async () => {
				await postAndCheckReception(antenna, true, { text: 'I love Bob (1)' }, { antennaId: bobAntenna.id });
			});

			test('Don\'t receive remote followee\'s home-only Note', async () => {
				await postAndCheckReception(antenna, false, { text: 'I love Bob (2)', visibility: 'home' }, { antennaId: bobAntenna.id });
			});

			test('Don\'t receive remote followee\'s followers-only Note', async () => {
				await postAndCheckReception(antenna, false, { text: 'I love Bob (3)', visibility: 'followers' }, { antennaId: bobAntenna.id });
			});

			test('Don\'t receive remote followee\'s visible specified-only Note', async () => {
				await postAndCheckReception(antenna, false, { text: 'I love Bob (4)', visibility: 'specified', visibleUserIds: [bobInA.id] }, { antennaId: bobAntenna.id });
			});
		});

		afterAll(async () => {
			await bob.client.request('antennas/delete', { antennaId: bobAntenna.id });
		});
	});
});
