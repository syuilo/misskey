/*
 * Tests of streaming API
 *
 * How to run the tests:
 * > mocha test/streaming.ts --require ts-node/register
 *
 * To specify test:
 * > mocha test/streaming.ts --require ts-node/register -g 'test name'
 *
 * If the tests not start, try set following enviroment variables:
 * TS_NODE_FILES=true and TS_NODE_TRANSPILE_ONLY=true
 * for more details, please see: https://github.com/TypeStrong/ts-node/issues/754
 */

process.env.NODE_ENV = 'test';

import * as assert from 'assert';
import * as childProcess from 'child_process';
import { connectStream, signup, request, post } from './utils';

describe('Streaming', () => {
	let p: childProcess.ChildProcess;

	beforeEach(done => {
		p = childProcess.spawn('node', [__dirname + '/../index.js'], {
			stdio: ['inherit', 'inherit', 'ipc'],
			env: { NODE_ENV: 'test' }
		});
		p.on('message', message => {
			if (message === 'ok') {
				(p.channel as any).onread = () => {};
				done();
			}
		});
	});

	afterEach(() => {
		p.kill();
	});

	it('mention event', () => new Promise(async done => {
		const alice = await signup({ username: 'alice' });
		const bob = await signup({ username: 'bob' });

		const ws = await connectStream(bob, 'main', ({ type, body }) => {
			if (type == 'mention') {
				assert.deepStrictEqual(body.userId, alice.id);
				ws.close();
				done();
			}
		});

		post(alice, {
			text: 'foo @bob bar'
		});
	}));

	it('renote event', () => new Promise(async done => {
		const alice = await signup({ username: 'alice' });
		const bob = await signup({ username: 'bob' });
		const bobNote = await post(bob, {
			text: 'foo'
		});

		const ws = await connectStream(bob, 'main', ({ type, body }) => {
			if (type == 'renote') {
				assert.deepStrictEqual(body.renoteId, bobNote.id);
				ws.close();
				done();
			}
		});

		post(alice, {
			renoteId: bobNote.id
		});
	}));

	describe('Home Timeline', () => {
		it('自分の投稿が流れる', () => new Promise(async done => {
			const post = {
				text: 'foo'
			};

			const me = await signup();

			const ws = await connectStream(me, 'homeTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.text, post.text);
					ws.close();
					done();
				}
			});

			request('/notes/create', post, me);
		}));

		it('フォローしているユーザーの投稿が流れる', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			// Alice が Bob をフォロー
			await request('/following/create', {
				userId: bob.id
			}, alice);

			const ws = await connectStream(alice, 'homeTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, bob.id);
					ws.close();
					done();
				}
			});

			post(bob, {
				text: 'foo'
			});
		}));

		it('フォローしていないユーザーの投稿は流れない', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			let fired = false;

			const ws = await connectStream(alice, 'homeTimeline', ({ type, body }) => {
				if (type == 'note') {
					fired = true;
				}
			});

			post(bob, {
				text: 'foo'
			});

			setTimeout(() => {
				assert.strictEqual(fired, false);
				ws.close();
				done();
			}, 5000);
		}));
	});

	describe('Local Timeline', () => {
		it('自分の投稿が流れる', () => new Promise(async done => {
			const me = await signup();

			const ws = await connectStream(me, 'localTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, me.id);
					ws.close();
					done();
				}
			});

			post(me, {
				text: 'foo'
			});
		}));

		it('フォローしていないローカルユーザーの投稿が流れる', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const ws = await connectStream(alice, 'localTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, bob.id);
					ws.close();
					done();
				}
			});

			post(bob, {
				text: 'foo'
			});
		}));

		it('リモートユーザーの投稿は流れない', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob', host: 'example.com' });

			let fired = false;

			const ws = await connectStream(alice, 'localTimeline', ({ type, body }) => {
				if (type == 'note') {
					fired = true;
				}
			});

			post(bob, {
				text: 'foo'
			});

			setTimeout(() => {
				assert.strictEqual(fired, false);
				ws.close();
				done();
			}, 5000);
		}));

		it('フォローしてたとしてもリモートユーザーの投稿は流れない', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob', host: 'example.com' });

			// Alice が Bob をフォロー
			await request('/following/create', {
				userId: bob.id
			}, alice);

			let fired = false;

			const ws = await connectStream(alice, 'localTimeline', ({ type, body }) => {
				if (type == 'note') {
					fired = true;
				}
			});

			post(bob, {
				text: 'foo'
			});

			setTimeout(() => {
				assert.strictEqual(fired, false);
				ws.close();
				done();
			}, 5000);
		}));
	});

	describe('Social Timeline', () => {
		it('自分の投稿が流れる', () => new Promise(async done => {
			const me = await signup();

			const ws = await connectStream(me, 'hybridTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, me.id);
					ws.close();
					done();
				}
			});

			post(me, {
				text: 'foo'
			});
		}));

		it('フォローしていないローカルユーザーの投稿が流れる', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const ws = await connectStream(alice, 'hybridTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, bob.id);
					ws.close();
					done();
				}
			});

			post(bob, {
				text: 'foo'
			});
		}));

		it('フォローしているリモートユーザーの投稿が流れる', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob', host: 'example.com' });

			// Alice が Bob をフォロー
			await request('/following/create', {
				userId: bob.id
			}, alice);

			const ws = await connectStream(alice, 'hybridTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, bob.id);
					ws.close();
					done();
				}
			});

			post(bob, {
				text: 'foo'
			});
		}));

		it('フォローしていないリモートユーザーの投稿は流れない', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob', host: 'example.com' });

			let fired = false;

			const ws = await connectStream(alice, 'hybridTimeline', ({ type, body }) => {
				if (type == 'note') {
					fired = true;
				}
			});

			post(bob, {
				text: 'foo'
			});

			setTimeout(() => {
				assert.strictEqual(fired, false);
				ws.close();
				done();
			}, 5000);
		}));
	});

	describe('Global Timeline', () => {
		it('フォローしていないローカルユーザーの投稿が流れる', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			const ws = await connectStream(alice, 'globalTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, bob.id);
					ws.close();
					done();
				}
			});

			post(bob, {
				text: 'foo'
			});
		}));

		it('フォローしていないリモートユーザーの投稿が流れる', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob', host: 'example.com' });

			const ws = await connectStream(alice, 'globalTimeline', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, bob.id);
					ws.close();
					done();
				}
			});

			post(bob, {
				text: 'foo'
			});
		}));
	});

	describe('UserList Timeline', () => {
		it('リストに入れているユーザーの投稿が流れる', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			// リスト作成
			const list = await request('/users/lists/create', {
				title: 'my list'
			}, alice).then(x => x.body);

			// Alice が Bob をリスイン
			await request('/users/lists/push', {
				listId: list.id,
				userId: bob.id
			}, alice);

			const ws = await connectStream(alice, 'userList', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.userId, bob.id);
					ws.close();
					done();
				}
			}, {
				listId: list.id
			});

			post(bob, {
				text: 'foo'
			});
		}));

		it('リストに入れていないユーザーの投稿は流れない', () => new Promise(async done => {
			const alice = await signup({ username: 'alice' });
			const bob = await signup({ username: 'bob' });

			// リスト作成
			const list = await request('/users/lists/create', {
				title: 'my list'
			}, alice).then(x => x.body);

			let fired = false;

			const ws = await connectStream(alice, 'userList', ({ type, body }) => {
				if (type == 'note') {
					fired = true;
				}
			}, {
				listId: list.id
			});

			post(bob, {
				text: 'foo'
			});

			setTimeout(() => {
				assert.strictEqual(fired, false);
				ws.close();
				done();
			}, 5000);
		}));
	});

	describe('Hashtag Timeline', () => {
		it('指定したハッシュタグの投稿が流れる', () => new Promise(async done => {
			const me = await signup();

			const ws = await connectStream(me, 'hashtag', ({ type, body }) => {
				if (type == 'note') {
					assert.deepStrictEqual(body.text, '#foo');
					ws.close();
					done();
				}
			}, {
				q: [
					['foo']
				]
			});

			post(me, {
				text: '#foo'
			});
		}));

		it('指定したハッシュタグの投稿が流れる (AND)', () => new Promise(async done => {
			const me = await signup();

			let fooCount = 0;
			let barCount = 0;
			let fooBarCount = 0;

			const ws = await connectStream(me, 'hashtag', ({ type, body }) => {
				if (type == 'note') {
					if (body.text === '#foo') fooCount++;
					if (body.text === '#bar') barCount++;
					if (body.text === '#foo #bar') fooBarCount++;
				}
			}, {
				q: [
					['foo', 'bar']
				]
			});

			post(me, {
				text: '#foo'
			});

			post(me, {
				text: '#bar'
			});

			post(me, {
				text: '#foo #bar'
			});

			setTimeout(() => {
				assert.strictEqual(fooCount, 0);
				assert.strictEqual(barCount, 0);
				assert.strictEqual(fooBarCount, 1);
				ws.close();
				done();
			}, 5000);
		}));

		it('指定したハッシュタグの投稿が流れる (OR)', () => new Promise(async done => {
			const me = await signup();

			let fooCount = 0;
			let barCount = 0;
			let fooBarCount = 0;
			let piyoCount = 0;

			const ws = await connectStream(me, 'hashtag', ({ type, body }) => {
				if (type == 'note') {
					if (body.text === '#foo') fooCount++;
					if (body.text === '#bar') barCount++;
					if (body.text === '#foo #bar') fooBarCount++;
					if (body.text === '#piyo') piyoCount++;
				}
			}, {
				q: [
					['foo'],
					['bar']
				]
			});

			post(me, {
				text: '#foo'
			});

			post(me, {
				text: '#bar'
			});

			post(me, {
				text: '#foo #bar'
			});

			post(me, {
				text: '#piyo'
			});

			setTimeout(() => {
				assert.strictEqual(fooCount, 1);
				assert.strictEqual(barCount, 1);
				assert.strictEqual(fooBarCount, 1);
				assert.strictEqual(piyoCount, 0);
				ws.close();
				done();
			}, 5000);
		}));

		it('指定したハッシュタグの投稿が流れる (AND + OR)', () => new Promise(async done => {
			const me = await signup();

			let fooCount = 0;
			let barCount = 0;
			let fooBarCount = 0;
			let piyoCount = 0;
			let waaaCount = 0;

			const ws = await connectStream(me, 'hashtag', ({ type, body }) => {
				if (type == 'note') {
					if (body.text === '#foo') fooCount++;
					if (body.text === '#bar') barCount++;
					if (body.text === '#foo #bar') fooBarCount++;
					if (body.text === '#piyo') piyoCount++;
					if (body.text === '#waaa') waaaCount++;
				}
			}, {
				q: [
					['foo', 'bar'],
					['piyo']
				]
			});

			post(me, {
				text: '#foo'
			});

			post(me, {
				text: '#bar'
			});

			post(me, {
				text: '#foo #bar'
			});

			post(me, {
				text: '#piyo'
			});

			post(me, {
				text: '#waaa'
			});

			setTimeout(() => {
				assert.strictEqual(fooCount, 0);
				assert.strictEqual(barCount, 0);
				assert.strictEqual(fooBarCount, 1);
				assert.strictEqual(piyoCount, 1);
				assert.strictEqual(waaaCount, 0);
				ws.close();
				done();
			}, 5000);
		}));
	});
});
