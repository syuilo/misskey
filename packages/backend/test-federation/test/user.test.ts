import assert, { rejects, strictEqual } from 'node:assert';
import * as Misskey from 'misskey-js';
import { createAccount, deepStrictEqualWithExcludedFields, fetchAdmin, type LoginUser, resolveRemoteNote, resolveRemoteUser, sleep } from './utils.js';

const [aAdmin, bAdmin] = await Promise.all([
	fetchAdmin('a.test'),
	fetchAdmin('b.test'),
]);

describe('User', () => {
	describe('Profile', () => {
		describe('Consistency of profile', () => {
			let alice: LoginUser;
			let aliceWatcher: LoginUser;
			let aliceWatcherInB: LoginUser;

			beforeAll(async () => {
				alice = await createAccount('a.test');
				[
					aliceWatcher,
					aliceWatcherInB,
				] = await Promise.all([
					createAccount('a.test'),
					createAccount('b.test'),
				]);
			});

			test('Check consistency', async () => {
				const aliceInA = await aliceWatcher.client.request('users/show', { userId: alice.id });
				const resolved = await resolveRemoteUser('a.test', aliceInA.id, aliceWatcherInB);
				const aliceInB = await aliceWatcherInB.client.request('users/show', { userId: resolved.id });

				// console.log(`a.test: ${JSON.stringify(aliceInA, null, '\t')}`);
				// console.log(`b.test: ${JSON.stringify(aliceInB, null, '\t')}`);

				deepStrictEqualWithExcludedFields(aliceInA, aliceInB, [
					'id',
					'host',
					'avatarUrl',
					'instance',
					'badgeRoles',
					'url',
					'uri',
					'createdAt',
					'lastFetchedAt',
				]);
			});
		});

		describe('ff/reactions visibility is federated', () => {
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

				// NOTE: follow each other
				await Promise.all([
					alice.client.request('following/create', { userId: bobInA.id }),
					bob.client.request('following/create', { userId: aliceInB.id }),
				]);
				await sleep();
			});

			test('Visibility set public by default', async () => {
				for (const user of await Promise.all([
					alice.client.request('users/show', { userId: bobInA.id }),
					bob.client.request('users/show', { userId: aliceInB.id }),
				])) {
					strictEqual(user.followersVisibility, 'public');
					strictEqual(user.followingVisibility, 'public');
					strictEqual(user.publicReactions, true);
				}
			});

			/** FIXME: not working */
			test.skip('Setting private for followersVisibility is federated', async () => {
				await Promise.all([
					alice.client.request('i/update', { followersVisibility: 'private' }),
					bob.client.request('i/update', { followersVisibility: 'private' }),
				]);
				await sleep();

				for (const user of await Promise.all([
					alice.client.request('users/show', { userId: bobInA.id }),
					bob.client.request('users/show', { userId: aliceInB.id }),
				])) {
					strictEqual(user.followersVisibility, 'private');
					strictEqual(user.followingVisibility, 'public');
				}
			});

			test.skip('Setting private for followingVisibility is federated', async () => {
				await Promise.all([
					alice.client.request('i/update', { followingVisibility: 'private' }),
					bob.client.request('i/update', { followingVisibility: 'private' }),
				]);
				await sleep();

				for (const user of await Promise.all([
					alice.client.request('users/show', { userId: bobInA.id }),
					bob.client.request('users/show', { userId: aliceInB.id }),
				])) {
					strictEqual(user.followersVisibility, 'private');
					strictEqual(user.followingVisibility, 'private');
				}
			});

			test.skip('Setting false for publicReactions is federated', async () => {
				await Promise.all([
					alice.client.request('i/update', { publicReactions: false }),
					bob.client.request('i/update', { publicReactions: false }),
				]);
				await sleep();

				for (const user of await Promise.all([
					alice.client.request('users/show', { userId: bobInA.id }),
					bob.client.request('users/show', { userId: aliceInB.id }),
				])) {
					strictEqual(user.publicReactions, false);
					strictEqual(user.publicReactions, false);
				}
			});
		});

		describe('isCat is federated', () => {
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
			});

			test('Not isCat for default', () => {
				strictEqual(aliceInB.isCat, false);
			});

			test('Becoming a cat is sent to their followers', async () => {
				await bob.client.request('following/create', { userId: aliceInB.id });
				await sleep();

				await alice.client.request('i/update', { isCat: true });
				await sleep();

				const res = await bob.client.request('users/show', { userId: aliceInB.id });
				strictEqual(res.isCat, true);
			});
		});

		describe('Pinning Notes', () => {
			let alice: LoginUser, bob: LoginUser;
			let aliceInB: Misskey.entities.UserDetailedNotMe;

			beforeAll(async () => {
				[alice, bob] = await Promise.all([
					createAccount('a.test'),
					createAccount('b.test'),
				]);
				aliceInB = await resolveRemoteUser('a.test', alice.id, bob);

				await bob.client.request('following/create', { userId: aliceInB.id });
			});

			test('Pinning localOnly Note is not delivered', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a', localOnly: true })).createdNote;
				await alice.client.request('i/pin', { noteId: note.id });
				await sleep();

				const _aliceInB = await bob.client.request('users/show', { userId: aliceInB.id });
				strictEqual(_aliceInB.pinnedNoteIds.length, 0);
			});

			test('Pinning followers-only Note is not delivered', async () => {
				const note = (await alice.client.request('notes/create', { text: 'a', visibility: 'followers' })).createdNote;
				await alice.client.request('i/pin', { noteId: note.id });
				await sleep();

				const _aliceInB = await bob.client.request('users/show', { userId: aliceInB.id });
				strictEqual(_aliceInB.pinnedNoteIds.length, 0);
			});

			let pinnedNote: Misskey.entities.Note;

			test('Pinning normal Note is delivered', async () => {
				pinnedNote = (await alice.client.request('notes/create', { text: 'a' })).createdNote;
				await alice.client.request('i/pin', { noteId: pinnedNote.id });
				await sleep();

				const _aliceInB = await bob.client.request('users/show', { userId: aliceInB.id });
				strictEqual(_aliceInB.pinnedNoteIds.length, 1);
				const pinnedNoteInB = await resolveRemoteNote('a.test', pinnedNote.id, bob);
				strictEqual(_aliceInB.pinnedNotes[0].id, pinnedNoteInB.id);
			});

			test('Unpinning normal Note is delivered', async () => {
				await alice.client.request('i/unpin', { noteId: pinnedNote.id });
				await sleep();

				const _aliceInB = await bob.client.request('users/show', { userId: aliceInB.id });
				strictEqual(_aliceInB.pinnedNoteIds.length, 0);
			});
		});
	});

	describe('Follow / Unfollow', () => {
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
		});

		describe('Follow a.test ==> b.test', () => {
			beforeAll(async () => {
				await alice.client.request('following/create', { userId: bobInA.id });

				await sleep();
			});

			test('Check consistency with `users/following` and `users/followers` endpoints', async () => {
				await Promise.all([
					strictEqual(
						(await alice.client.request('users/following', { userId: alice.id }))
							.some(v => v.followeeId === bobInA.id),
						true,
					),
					strictEqual(
						(await bob.client.request('users/followers', { userId: bob.id }))
							.some(v => v.followerId === aliceInB.id),
						true,
					),
				]);
			});
		});

		describe('Unfollow a.test ==> b.test', () => {
			beforeAll(async () => {
				await alice.client.request('following/delete', { userId: bobInA.id });

				await sleep();
			});

			test('Check consistency with `users/following` and `users/followers` endpoints', async () => {
				await Promise.all([
					strictEqual(
						(await alice.client.request('users/following', { userId: alice.id }))
							.some(v => v.followeeId === bobInA.id),
						false,
					),
					strictEqual(
						(await bob.client.request('users/followers', { userId: bob.id }))
							.some(v => v.followerId === aliceInB.id),
						false,
					),
				]);
			});
		});
	});

	describe('Follow requests', () => {
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

			await alice.client.request('i/update', { isLocked: true });
		});

		describe('Send follow request from Bob to Alice and cancel', () => {
			describe('Bob sends follow request to Alice', () => {
				beforeAll(async () => {
					await bob.client.request('following/create', { userId: aliceInB.id });
					await sleep();
				});

				test('Alice should have a request', async () => {
					const requests = await alice.client.request('following/requests/list', {});
					strictEqual(requests.length, 1);
					strictEqual(requests[0].followee.id, alice.id);
					strictEqual(requests[0].follower.id, bobInA.id);
				});
			});

			describe('Alice cancels it', () => {
				beforeAll(async () => {
					await bob.client.request('following/requests/cancel', { userId: aliceInB.id });
					await sleep();
				});

				test('Alice should have no requests', async () => {
					const requests = await alice.client.request('following/requests/list', {});
					strictEqual(requests.length, 0);
				});
			});
		});

		describe('Send follow request from Bob to Alice and reject', () => {
			beforeAll(async () => {
				await bob.client.request('following/create', { userId: aliceInB.id });
				await sleep();

				await alice.client.request('following/requests/reject', { userId: bobInA.id });
				await sleep();
			});

			test('Bob should have no requests', async () => {
				await rejects(
					async () => await bob.client.request('following/requests/cancel', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'FOLLOW_REQUEST_NOT_FOUND');
						return true;
					},
				);
			});

			test('Bob doesn\'t follow Alice', async () => {
				const following = await bob.client.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0);
			});
		});

		describe('Send follow request from Bob to Alice and accept', () => {
			beforeAll(async () => {
				await bob.client.request('following/create', { userId: aliceInB.id });
				await sleep();

				await alice.client.request('following/requests/accept', { userId: bobInA.id });
				await sleep();
			});

			test('Bob follows Alice', async () => {
				const following = await bob.client.request('users/following', { userId: bob.id });
				strictEqual(following.length, 1);
				strictEqual(following[0].followeeId, aliceInB.id);
				strictEqual(following[0].followerId, bob.id);
			});
		});
	});

	describe('Deletion', () => {
		describe('Check Delete consistency', () => {
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
			});

			test('Bob follows Alice, and Alice deleted themself', async () => {
				await bob.client.request('following/create', { userId: aliceInB.id });
				await sleep();

				const followers = await alice.client.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 1); // followed by Bob

				await alice.client.request('i/delete-account', { password: alice.password });
				await sleep();

				const following = await bob.client.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0); // no following relation

				await rejects(
					async () => await bob.client.request('following/create', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'NO_SUCH_USER');
						return true;
					},
				);
			});
		});

		describe('Deletion of remote user for moderation', () => {
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
			});

			test('Bob follows Alice, then Alice gets deleted in B server', async () => {
				await bob.client.request('following/create', { userId: aliceInB.id });
				await sleep();

				const followers = await alice.client.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 1); // followed by Bob

				await bAdmin.client.request('admin/delete-account', { userId: aliceInB.id });
				await sleep();

				/**
				 * FIXME: remote account is not deleted!
				 *        @see https://github.com/misskey-dev/misskey/issues/14728
				 */
				const deletedAlice = await bob.client.request('users/show', { userId: aliceInB.id });
				assert(deletedAlice.id, aliceInB.id);

				// TODO: why still following relation?
				const following = await bob.client.request('users/following', { userId: bob.id });
				strictEqual(following.length, 1);
				await rejects(
					async () => await bob.client.request('following/create', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'ALREADY_FOLLOWING');
						return true;
					},
				);
			});

			test('Alice tries to follow Bob, but it is not processed', async () => {
				await alice.client.request('following/create', { userId: bobInA.id });
				await sleep();

				const following = await alice.client.request('users/following', { userId: alice.id });
				strictEqual(following.length, 0); // Not following Bob because B server doesn't return Accept

				const followers = await bob.client.request('users/followers', { userId: bob.id });
				strictEqual(followers.length, 0); // Alice's Follow is not processed
			});
		});
	});

	describe('Suspension', () => {
		describe('Check suspend/unsuspend consistency', () => {
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
			});

			test('Bob follows Alice, and Alice gets suspended, there is no following relation, and Bob fails to follow again', async () => {
				await bob.client.request('following/create', { userId: aliceInB.id });
				await sleep();

				const followers = await alice.client.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 1); // followed by Bob

				await aAdmin.client.request('admin/suspend-user', { userId: alice.id });
				await sleep();

				const following = await bob.client.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0); // no following relation

				await rejects(
					async () => await bob.client.request('following/create', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'NO_SUCH_USER');
						return true;
					},
				);
			});

			test('Alice gets unsuspended, Bob succeeds in following Alice', async () => {
				await aAdmin.client.request('admin/unsuspend-user', { userId: alice.id });
				await sleep();

				const followers = await alice.client.request('users/followers', { userId: alice.id });
				strictEqual(followers.length, 1); // FIXME: followers are not deleted??

				/**
				 * FIXME: still rejected!
				 *        seems to can't process Undo Delete activity because it is not implemented
				 *        related @see https://github.com/misskey-dev/misskey/issues/13273
				 */
				await rejects(
					async () => await bob.client.request('following/create', { userId: aliceInB.id }),
					(err: any) => {
						strictEqual(err.code, 'NO_SUCH_USER');
						return true;
					},
				);

				// FIXME: resolving also fails
				await rejects(
					async () => await resolveRemoteUser('a.test', alice.id, bob),
					(err: any) => {
						strictEqual(err.code, 'INTERNAL_ERROR');
						return true;
					},
				);
			});

			/**
			 * instead of simple unsuspension, let's tell existence by following from Alice
			 */
			test('Alice can follow Bob', async () => {
				await alice.client.request('following/create', { userId: bobInA.id });
				await sleep();

				const bobFollowers = await bob.client.request('users/followers', { userId: bob.id });
				strictEqual(bobFollowers.length, 1); // followed by Alice
				assert(bobFollowers[0].follower != null);
				const renewedaliceInB = bobFollowers[0].follower;
				assert(aliceInB.username === renewedaliceInB.username);
				assert(aliceInB.host === renewedaliceInB.host);
				assert(aliceInB.id !== renewedaliceInB.id); // TODO: Same username and host, but their ids are different! Is it OK?

				const following = await bob.client.request('users/following', { userId: bob.id });
				strictEqual(following.length, 0); // following are deleted

				// Bob tries to follow Alice
				await bob.client.request('following/create', { userId: renewedaliceInB.id });
				await sleep();

				const aliceFollowers = await alice.client.request('users/followers', { userId: alice.id });
				strictEqual(aliceFollowers.length, 1);

				// FIXME: but resolving still fails ...
				await rejects(
					async () => await resolveRemoteUser('a.test', alice.id, bob),
					(err: any) => {
						strictEqual(err.code, 'INTERNAL_ERROR');
						return true;
					},
				);
			});
		});
	});
});
