/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, assert, afterEach } from 'vitest';
import { Window } from 'happy-dom';
import { onScrollBottom, onScrollTop } from '@@/js/scroll.js';

describe('Scroll', () => {
	describe('onScrollTop', () => {
		/* 動作しない(happy-domのバグ？)
		test('Initial onScrollTop callback for connected elements', () => {
			const { document } = new Window();
			const div = document.createElement('div');
			assert.strictEqual(div.scrollTop, 0);

			document.body.append(div);

			let called = false;
			onScrollTop(div as unknown as HTMLElement, () => called = true);

			assert.ok(called);
		});
		*/

		test('No onScrollTop callback for disconnected elements', () => {
			const { document } = new Window();
			const div = document.createElement('div');
			assert.strictEqual(div.scrollTop, 0);

			let called = false;
			onScrollTop(div as unknown as HTMLElement, () => called = true);

			assert.ok(!called);
		});
	});

	describe('onScrollBottom', () => {
		/* 動作しない(happy-domのバグ？)
		test('Initial onScrollBottom callback for connected elements', () => {
			const { document } = new Window();
			const div = document.createElement('div');
			assert.strictEqual(div.scrollTop, 0);

			document.body.append(div);

			let called = false;
			onScrollBottom(div as unknown as HTMLElement, () => called = true);

			assert.ok(called);
		});
		*/

		test('No onScrollBottom callback for disconnected elements', () => {
			const { document } = new Window();
			const div = document.createElement('div');
			assert.strictEqual(div.scrollTop, 0);

			let called = false;
			onScrollBottom(div as unknown as HTMLElement, () => called = true);

			assert.ok(!called);
		});
	});
});
