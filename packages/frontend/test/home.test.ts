// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, assert, afterEach } from 'vitest';
import { render, cleanup, type RenderResult } from '@testing-library/vue';
import './init';
import type * as misskey from 'misskey-js';
import { directives } from '@/directives';
import { components } from '@/components/index';
import XHome from '@/pages/user/home.vue';

describe('XHome', () => {
	const renderHome = (user: Partial<misskey.entities.UserDetailed>): RenderResult => {
		return render(XHome, {
			props: { user, disableNotes: true },
			global: { directives, components },
		});
	};

	afterEach(() => {
		cleanup();
	});

	test('Should render the remote caution when user.host exists', async () => {
		const home = renderHome({
			id: 'blobcat',
			name: 'blobcat',
			host: 'example.com',
			uri: 'https://example.com/@user',
			url: 'https://example.com/@user/profile',
			roles: [],
			createdAt: '1970-01-01T00:00:00.000Z',
			fields: [],
			pinnedNotes: [],
		});

		const anchor = home.container.querySelector<HTMLAnchorElement>('a[href^="https://example.com/"]');
		assert.exists(anchor, 'anchor to the remote exists');
		assert.strictEqual(anchor?.href, 'https://example.com/@user/profile');

		assert.ok(anchor?.parentElement?.classList.contains('warn'), 'the parent is a warning');
	});

	test('The remote caution should fall back to uri if url is null', async () => {
		const home = renderHome({
			id: 'blobcat',
			name: 'blobcat',
			host: 'example.com',
			uri: 'https://example.com/@user',
			url: null,
			roles: [],
			createdAt: '1970-01-01T00:00:00.000Z',
			fields: [],
			pinnedNotes: [],
		});

		const anchor = home.container.querySelector<HTMLAnchorElement>('a[href^="https://example.com/"]');
		assert.exists(anchor, 'anchor to the remote exists');
		assert.strictEqual(anchor?.href, 'https://example.com/@user');
	});
});
