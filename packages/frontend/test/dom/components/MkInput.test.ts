/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkInput from '@/components/MkInput.vue';
import { fireEvent, render } from '@testing-library/vue';
import { components } from '@/components/index.js';
import { directives } from '@/directives/index.js';
import { describe, expect, test, vi } from 'vitest';
import { ComponentProps } from 'vue-component-type-helpers';

describe('MkInput', () => {
	function renderMkInput<P extends ComponentProps<typeof MkInput>>(props: P) {
		const mkInput = render(MkInput, {
			props,
			global: { directives, components },
		});
		const inputElement = mkInput.baseElement.getElementsByTagName('input')[0];
		expect(inputElement).not.toBeUndefined();
		return { props, mkInput, inputElement };
	}

	test('keydown', async () => {
		const { props, inputElement } = renderMkInput({
			modelValue: null,
			onKeydown: vi.fn((ev) => {
				expect(ev.code).toBe('keyA');
			}),
		});
		await fireEvent.keyDown(inputElement, { code: 'keyA' });
		expect(props.onKeydown).toHaveBeenCalledOnce();
	});

	test('enter', async () => {
		const { props, inputElement } = renderMkInput({
			modelValue: null,
			onEnter: vi.fn((ev) => {
				expect(ev.code).toBe('Enter');
			}),
		});
		await fireEvent.keyDown(inputElement, { code: 'Enter' });
		expect(props.onEnter).toHaveBeenCalledOnce();
	});

	test('update', async () => {
		const { props, inputElement } = renderMkInput({
			modelValue: null,
			'onUpdate:modelValue': vi.fn((value) => {
				expect(value).toBe('Hello');
			}),
		});
		await fireEvent.update(inputElement, 'Hello');
		expect(props['onUpdate:modelValue']).toHaveBeenCalledOnce();
	});

	test('update (type = "number")', async () => {
		const { props, inputElement } = renderMkInput({
			modelValue: null,
			type: 'number',
			'onUpdate:modelValue': vi.fn((value) => {
				expect(value).toBe(42);
			}),
		});
		await fireEvent.update(inputElement, '42');
		expect(props['onUpdate:modelValue']).toHaveBeenCalledOnce();
	});
});
