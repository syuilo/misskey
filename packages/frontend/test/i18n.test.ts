/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';
import { I18n } from '../../frontend-shared/js/i18n.js'; // @@で参照できなかったので
import type { ParameterizedString } from '../../../locales/index.js';

// TODO: このテストはfrontend-sharedに移動する

describe('i18n', () => {
	it('t', () => {
		const i18n = new I18n({
			foo: 'foo',
			bar: {
				baz: 'baz',
				qux: 'qux {0}' as unknown as ParameterizedString<'0'>,
				quux: 'quux {0} {1}' as unknown as ParameterizedString<'0' | '1'>,
			},
		});

		expect(i18n.t('foo')).toBe('foo');
		expect(i18n.t('bar.baz')).toBe('baz');
		expect(i18n.tsx.bar.qux({ 0: 'hoge' })).toBe('qux hoge');
		expect(i18n.tsx.bar.quux({ 0: 'hoge', 1: 'fuga' })).toBe('quux hoge fuga');
	});
	it('ts', () => {
		const i18n = new I18n({
			foo: 'foo',
			bar: {
				baz: 'baz',
				qux: 'qux {0}' as unknown as ParameterizedString<'0'>,
				quux: 'quux {0} {1}' as unknown as ParameterizedString<'0' | '1'>,
			},
		});

		expect(i18n.ts.foo).toBe('foo');
		expect(i18n.ts.bar.baz).toBe('baz');
	});
	it('tsx', () => {
		const i18n = new I18n({
			foo: 'foo',
			bar: {
				baz: 'baz',
				qux: 'qux {0}' as unknown as ParameterizedString<'0'>,
				quux: 'quux {0} {1}' as unknown as ParameterizedString<'0' | '1'>,
			},
		});

		expect(i18n.tsx.bar.qux({ 0: 'hoge' })).toBe('qux hoge');
		expect(i18n.tsx.bar.quux({ 0: 'hoge', 1: 'fuga' })).toBe('quux hoge fuga');
	});
});
