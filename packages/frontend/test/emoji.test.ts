/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, test, assert, afterEach } from 'vitest';
import { render, cleanup, type RenderResult } from '@testing-library/vue';
import { defaultStoreState } from './init.js';
import { getEmojiName } from '../../frontend-shared/js/emojilist.js';
import { directives } from '@/directives/index.js';
import { components } from '@/components/index.js';
import MkEmoji from '@/components/global/MkEmoji.vue';

describe('Emoji', () => {
	const renderEmoji = (emoji: string): RenderResult => {
		return render(MkEmoji, {
			props: { emoji },
			global: { directives, components },
		});
	};

	afterEach(() => {
		cleanup();
		defaultStoreState.emojiStyle = '';
	});

	describe('MkEmoji', () => {
		test('Should render selector-less heart with color in native mode', async () => {
			defaultStoreState.emojiStyle = 'native';
			const mkEmoji = await renderEmoji('\u2764'); // monochrome heart
			assert.ok(mkEmoji.queryByText('\u2764\uFE0F')); // colored heart
			assert.ok(!mkEmoji.queryByText('\u2764'));
		});
	});

	describe('Emoji list', () => {
		test('Should get the name of the heart', () => {
			assert.strictEqual(getEmojiName('\u2764'), 'heart');
		});
	});
});
