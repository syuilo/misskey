/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkAsUi from '@/components/MkAsUi.vue';
import { components as globalComponents } from '@/components/index.js';
import { directives } from '@/directives/index.js';
import { describe, expect, test, vi } from 'vitest';
import { ComponentProps } from 'vue-component-type-helpers';
import { AsUiComponent } from '@/scripts/aiscript/ui.js';
import { Ref, ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import MkButton from '@/components/MkButton.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import type * as os from '@/os.js';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkFolder from '@/components/MkFolder.vue';

const osPostMock = vi.hoisted(() => vi.fn() satisfies typeof os.post);

vi.mock('@/os.js', () => {
	return {
		post: osPostMock,
	};
});

describe('MkAsUi', () => {
	function renderComponent<C extends AsUiComponent>(
		component: C,
		opts?: Omit<ComponentProps<typeof MkAsUi>, 'component' | 'components'>
	) {
		const componentsRef = ref([ref(component)]);
		const wrapper = shallowMountUi(component, componentsRef.value, opts);
		return { wrapper, component };
	}

	function shallowMountUi(
		component: AsUiComponent,
		components: Ref<AsUiComponent>[],
		opts?: Omit<ComponentProps<typeof MkAsUi>, 'component' | 'components'>,
	): ReturnType<typeof shallowMount<typeof MkAsUi>> {
		return shallowMount(MkAsUi, {
			props: { component, components, ...opts },
			global: {
				directives,
				components: globalComponents,
			},
		});
	};

	test('root', async () => {
		const { wrapper } = renderComponent({
			type: 'root',
			id: 'id',
			children: [],
		});
		expect(wrapper.text()).toBe('');
	});

	test('text', async () => {
		const { wrapper } = renderComponent({
			type: 'text',
			id: 'id',
			text: 'Hello, world!',
		});
		expect(wrapper.text()).toBe('Hello, world!');
	});

	test('mfm', async () => {
		const { component, wrapper } = renderComponent({
			type: 'mfm',
			id: 'id',
			text: '$[clickable.ev=evId Click me!]',
			onClickEv: vi.fn((evId) => {
				expect(evId).toBe('evId');
			}),
		});
		wrapper.findComponent(globalComponents.Mfm).vm.$emit('clickEv', 'evId');
		expect(component.onClickEv).toHaveBeenCalledOnce();
	});

	test('button', async () => {
		const { component, wrapper } = renderComponent({
			type: 'button',
			id: 'id',
			text: 'Click me!',
			onClick: vi.fn(),
		});
		wrapper.findComponent(MkButton).vm.$emit('click');
		expect(component.onClick).toHaveBeenCalledOnce();
	});

	test('buttons', async () => {
		const { component, wrapper } = renderComponent({
			type: 'buttons',
			id: 'id',
			buttons: [
				{
					text: 'left',
					onClick: vi.fn(),
				},
				{
					text: 'right',
					onClick: vi.fn(),
				},
			],
		});
		const buttons = wrapper.findAllComponents(MkButton);
		expect(buttons.length).toBe(2);

		const leftButton = buttons[0];
		leftButton.vm.$emit('click');
		expect(component.buttons[0].onClick).toHaveBeenCalledOnce();

		const rightButton = buttons[1];
		rightButton.vm.$emit('click');
		expect(component.buttons[1].onClick).toHaveBeenCalledOnce();
	});

	test('switch', async () => {
		const { component, wrapper } = renderComponent({
			type: 'switch',
			id: 'id',
			default: true,
			onChange: vi.fn((v) => {
				expect(v).toBe(false);
			}),
		});
		const switchComponent = wrapper.findComponent(MkSwitch);
		expect(switchComponent.props('modelValue')).toBe(true);
		switchComponent.vm.$emit('update:modelValue', false);
		expect(component.onChange).toHaveBeenCalledOnce();
	});

	test('textarea', async () => {
		const { component, wrapper } = renderComponent({
			type: 'textarea',
			id: 'id',
			onInput: vi.fn((v) => {
				expect(v).toBe('abc');
			}),
			default: 'Hello, world!',
		});
		const textarea = wrapper.findComponent(MkTextarea);
		expect(textarea.props('modelValue')).toBe('Hello, world!');
		textarea.vm.$emit('update:modelValue', 'abc');
		expect(component.onInput).toHaveBeenCalledOnce();
	});

	test('textInput', async () => {
		const { component, wrapper } = renderComponent({
			type: 'textInput',
			id: 'id',
			onInput: vi.fn((v) => {
				expect(v).toBe('abc');
			}),
			default: 'Hello, world!',
		});
		const input = wrapper.findComponent<typeof MkInput<'text'>>(MkInput);
		expect(input.props('modelValue')).toBe('Hello, world!');
		input.vm.$emit('update:modelValue', 'abc');
		expect(component.onInput).toHaveBeenCalledOnce();
	});

	test('numberInput', async () => {
		const { component, wrapper } = renderComponent({
			type: 'numberInput',
			id: 'id',
			onInput: vi.fn((v) => {
				expect(v).toBe(42);
			}),
			default: 0,
		});
		const input = wrapper.findComponent(MkInput);
		expect(input.props('modelValue')).toBe(0);
		input.vm.$emit('update:modelValue', 42);
		expect(component.onInput).toHaveBeenCalledOnce();
	});

	test('select', async () => {
		const { component, wrapper } = renderComponent({
			type: 'select',
			id: 'id',
			default: 'a',
			items: [
				{ text: 'A', value: 'a' },
				{ text: 'B', value: 'b' },
			],
			onChange: vi.fn((v) => {
				expect(v).toBe('b');
			}),
		});
		const select = wrapper.findComponent(MkSelect);
		expect(select.props('modelValue')).toBe('a');
		select.vm.$emit('update:modelValue', 'b');
		expect(component.onChange).toHaveBeenCalledOnce();
	});

	test('postFormButton', async () => {
		const { wrapper } = renderComponent({
			type: 'postFormButton',
			id: 'id',
			text: 'Click to post',
			primary: true,
			rounded: false,
			form: {
				text: 'Hello',
				cw: 'world',
				visibility: 'home',
				localOnly: true,
			}
		});
		const button = wrapper.findComponent(MkButton);
		expect(button.props('primary')).toBe(true);
		expect(button.props('rounded')).toBe(false);

		osPostMock.mockImplementationOnce(async (props) => {
			expect(props).toStrictEqual({
				initialText: 'Hello',
				initialCw: 'world',
				initialVisibility: 'home',
				initialLocalOnly: true,
				instant: true,
			});
		});
		await button.trigger('click');
		expect(osPostMock).toHaveBeenCalledOnce();
	});

	test('postForm', async () => {
		const { wrapper } = renderComponent({
			type: 'postForm',
			id: 'id',
			form: {
				text: 'Hello',
				cw: 'world',
				visibility: 'home',
				localOnly: true,
			}
		});
		const form = wrapper.findComponent(MkPostForm);
		expect(form.props('initialText')).toBe('Hello');
		expect(form.props('initialCw')).toBe('world');
		expect(form.props('initialVisibility')).toBe('home');
		expect(form.props('initialLocalOnly')).toBe(true);
	});

	test('folder', async () => {
		const childComponent = {
			type: 'text',
			id: 'id1',
			text: 'Hello, world!',
		} satisfies AsUiComponent;
		const component = {
			type: 'folder',
			id: 'id2',
			title: 'Title',
			children: [childComponent.id],
			opened: false,
		} satisfies AsUiComponent;
		const components = [ref(childComponent), ref(component)];
		const wrapper = shallowMountUi(component, components);
		const folder = wrapper.findComponent(MkFolder);
		expect(folder.props('defaultOpen')).toBe(false);
	});
});
