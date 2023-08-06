// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { utils, values } from '@syuilo/aiscript';
import { v4 as uuid } from 'uuid';
import { ref, Ref } from 'vue';

export type AsUiComponentBase = {
	id: string;
	hidden?: boolean;
};

export type AsUiRoot = AsUiComponentBase & {
	type: 'root';
	children: AsUiComponent['id'][];
};

export type AsUiContainer = AsUiComponentBase & {
	type: 'container';
	children?: AsUiComponent['id'][];
	align?: 'left' | 'center' | 'right';
	bgColor?: string;
	fgColor?: string;
	font?: 'serif' | 'sans-serif' | 'monospace';
	borderWidth?: number;
	borderColor?: string;
	padding?: number;
	rounded?: boolean;
	hidden?: boolean;
};

export type AsUiText = AsUiComponentBase & {
	type: 'text';
	text?: string;
	size?: number;
	bold?: boolean;
	color?: string;
	font?: 'serif' | 'sans-serif' | 'monospace';
};

export type AsUiMfm = AsUiComponentBase & {
	type: 'mfm';
	text?: string;
	size?: number;
	bold?: boolean;
	color?: string;
	font?: 'serif' | 'sans-serif' | 'monospace';
};

export type AsUiButton = AsUiComponentBase & {
	type: 'button';
	text?: string;
	onClick?: () => void;
	primary?: boolean;
	rounded?: boolean;
	disabled?: boolean;
};

export type AsUiButtons = AsUiComponentBase & {
	type: 'buttons';
	buttons?: AsUiButton[];
};

export type AsUiSwitch = AsUiComponentBase & {
	type: 'switch';
	onChange?: (v: boolean) => void;
	default?: boolean;
	label?: string;
	caption?: string;
};

export type AsUiTextarea = AsUiComponentBase & {
	type: 'textarea';
	onInput?: (v: string) => void;
	default?: string;
	label?: string;
	caption?: string;
};

export type AsUiTextInput = AsUiComponentBase & {
	type: 'textInput';
	onInput?: (v: string) => void;
	default?: string;
	label?: string;
	caption?: string;
};

export type AsUiNumberInput = AsUiComponentBase & {
	type: 'numberInput';
	onInput?: (v: number) => void;
	default?: number;
	label?: string;
	caption?: string;
};

export type AsUiSelect = AsUiComponentBase & {
	type: 'select';
	items?: {
		text: string;
		value: string;
	}[];
	onChange?: (v: string) => void;
	default?: string;
	label?: string;
	caption?: string;
};

export type AsUiFolder = AsUiComponentBase & {
	type: 'folder';
	children?: AsUiComponent['id'][];
	title?: string;
	opened?: boolean;
};

export type AsUiPostFormButton = AsUiComponentBase & {
	type: 'postFormButton';
	text?: string;
	primary?: boolean;
	rounded?: boolean;
	form?: {
		text: string;
	};
};

export type AsUiComponent = AsUiRoot | AsUiContainer | AsUiText | AsUiMfm | AsUiButton | AsUiButtons | AsUiSwitch | AsUiTextarea | AsUiTextInput | AsUiNumberInput | AsUiSelect | AsUiFolder | AsUiPostFormButton;

export function patch(id: string, def: values.Value, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>) {
	// TODO
}

function getRootOptions(def: values.Value | undefined): Omit<AsUiRoot, 'id' | 'type'> {
	utils.assertObject(def);

	const children = def.value.get('children');
	utils.assertArray(children);

	return {
		children: children.value.map(v => {
			utils.assertObject(v);
			return v.value.get('id').value;
		}),
	};
}

function getContainerOptions(def: values.Value | undefined): Omit<AsUiContainer, 'id' | 'type'> {
	utils.assertObject(def);

	const children = def.value.get('children');
	if (children) utils.assertArray(children);
	const align = def.value.get('align');
	if (align) utils.assertString(align);
	const bgColor = def.value.get('bgColor');
	if (bgColor) utils.assertString(bgColor);
	const fgColor = def.value.get('fgColor');
	if (fgColor) utils.assertString(fgColor);
	const font = def.value.get('font');
	if (font) utils.assertString(font);
	const borderWidth = def.value.get('borderWidth');
	if (borderWidth) utils.assertNumber(borderWidth);
	const borderColor = def.value.get('borderColor');
	if (borderColor) utils.assertString(borderColor);
	const padding = def.value.get('padding');
	if (padding) utils.assertNumber(padding);
	const rounded = def.value.get('rounded');
	if (rounded) utils.assertBoolean(rounded);
	const hidden = def.value.get('hidden');
	if (hidden) utils.assertBoolean(hidden);

	return {
		children: children ? children.value.map(v => {
			utils.assertObject(v);
			return v.value.get('id').value;
		}) : [],
		align: align?.value,
		fgColor: fgColor?.value,
		bgColor: bgColor?.value,
		font: font?.value,
		borderWidth: borderWidth?.value,
		borderColor: borderColor?.value,
		padding: padding?.value,
		rounded: rounded?.value,
		hidden: hidden?.value,
	};
}

function getTextOptions(def: values.Value | undefined): Omit<AsUiText, 'id' | 'type'> {
	utils.assertObject(def);

	const text = def.value.get('text');
	if (text) utils.assertString(text);
	const size = def.value.get('size');
	if (size) utils.assertNumber(size);
	const bold = def.value.get('bold');
	if (bold) utils.assertBoolean(bold);
	const color = def.value.get('color');
	if (color) utils.assertString(color);
	const font = def.value.get('font');
	if (font) utils.assertString(font);

	return {
		text: text?.value,
		size: size?.value,
		bold: bold?.value,
		color: color?.value,
		font: font?.value,
	};
}

function getMfmOptions(def: values.Value | undefined): Omit<AsUiMfm, 'id' | 'type'> {
	utils.assertObject(def);

	const text = def.value.get('text');
	if (text) utils.assertString(text);
	const size = def.value.get('size');
	if (size) utils.assertNumber(size);
	const bold = def.value.get('bold');
	if (bold) utils.assertBoolean(bold);
	const color = def.value.get('color');
	if (color) utils.assertString(color);
	const font = def.value.get('font');
	if (font) utils.assertString(font);

	return {
		text: text?.value,
		size: size?.value,
		bold: bold?.value,
		color: color?.value,
		font: font?.value,
	};
}

function getTextInputOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Omit<AsUiTextInput, 'id' | 'type'> {
	utils.assertObject(def);

	const onInput = def.value.get('onInput');
	if (onInput) utils.assertFunction(onInput);
	const defaultValue = def.value.get('default');
	if (defaultValue) utils.assertString(defaultValue);
	const label = def.value.get('label');
	if (label) utils.assertString(label);
	const caption = def.value.get('caption');
	if (caption) utils.assertString(caption);

	return {
		onInput: (v) => {
			if (onInput) call(onInput, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getTextareaOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Omit<AsUiTextarea, 'id' | 'type'> {
	utils.assertObject(def);

	const onInput = def.value.get('onInput');
	if (onInput) utils.assertFunction(onInput);
	const defaultValue = def.value.get('default');
	if (defaultValue) utils.assertString(defaultValue);
	const label = def.value.get('label');
	if (label) utils.assertString(label);
	const caption = def.value.get('caption');
	if (caption) utils.assertString(caption);

	return {
		onInput: (v) => {
			if (onInput) call(onInput, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getNumberInputOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Omit<AsUiNumberInput, 'id' | 'type'> {
	utils.assertObject(def);

	const onInput = def.value.get('onInput');
	if (onInput) utils.assertFunction(onInput);
	const defaultValue = def.value.get('default');
	if (defaultValue) utils.assertNumber(defaultValue);
	const label = def.value.get('label');
	if (label) utils.assertString(label);
	const caption = def.value.get('caption');
	if (caption) utils.assertString(caption);

	return {
		onInput: (v) => {
			if (onInput) call(onInput, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getButtonOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Omit<AsUiButton, 'id' | 'type'> {
	utils.assertObject(def);

	const text = def.value.get('text');
	if (text) utils.assertString(text);
	const onClick = def.value.get('onClick');
	if (onClick) utils.assertFunction(onClick);
	const primary = def.value.get('primary');
	if (primary) utils.assertBoolean(primary);
	const rounded = def.value.get('rounded');
	if (rounded) utils.assertBoolean(rounded);
	const disabled = def.value.get('disabled');
	if (disabled) utils.assertBoolean(disabled);

	return {
		text: text?.value,
		onClick: () => {
			if (onClick) call(onClick, []);
		},
		primary: primary?.value,
		rounded: rounded?.value,
		disabled: disabled?.value,
	};
}

function getButtonsOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Omit<AsUiButtons, 'id' | 'type'> {
	utils.assertObject(def);

	const buttons = def.value.get('buttons');
	if (buttons) utils.assertArray(buttons);

	return {
		buttons: buttons ? buttons.value.map(button => {
			utils.assertObject(button);
			const text = button.value.get('text');
			utils.assertString(text);
			const onClick = button.value.get('onClick');
			utils.assertFunction(onClick);
			const primary = button.value.get('primary');
			if (primary) utils.assertBoolean(primary);
			const rounded = button.value.get('rounded');
			if (rounded) utils.assertBoolean(rounded);
			const disabled = button.value.get('disabled');
			if (disabled) utils.assertBoolean(disabled);

			return {
				text: text.value,
				onClick: () => {
					call(onClick, []);
				},
				primary: primary?.value,
				rounded: rounded?.value,
				disabled: disabled?.value,
			};
		}) : [],
	};
}

function getSwitchOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Omit<AsUiSwitch, 'id' | 'type'> {
	utils.assertObject(def);

	const onChange = def.value.get('onChange');
	if (onChange) utils.assertFunction(onChange);
	const defaultValue = def.value.get('default');
	if (defaultValue) utils.assertBoolean(defaultValue);
	const label = def.value.get('label');
	if (label) utils.assertString(label);
	const caption = def.value.get('caption');
	if (caption) utils.assertString(caption);

	return {
		onChange: (v) => {
			if (onChange) call(onChange, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getSelectOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Omit<AsUiSelect, 'id' | 'type'> {
	utils.assertObject(def);

	const items = def.value.get('items');
	if (items) utils.assertArray(items);
	const onChange = def.value.get('onChange');
	if (onChange) utils.assertFunction(onChange);
	const defaultValue = def.value.get('default');
	if (defaultValue) utils.assertString(defaultValue);
	const label = def.value.get('label');
	if (label) utils.assertString(label);
	const caption = def.value.get('caption');
	if (caption) utils.assertString(caption);

	return {
		items: items ? items.value.map(item => {
			utils.assertObject(item);
			const text = item.value.get('text');
			utils.assertString(text);
			const value = item.value.get('value');
			if (value) utils.assertString(value);
			return {
				text: text.value,
				value: value ? value.value : text.value,
			};
		}) : [],
		onChange: (v) => {
			if (onChange) call(onChange, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getFolderOptions(def: values.Value | undefined): Omit<AsUiFolder, 'id' | 'type'> {
	utils.assertObject(def);

	const children = def.value.get('children');
	if (children) utils.assertArray(children);
	const title = def.value.get('title');
	if (title) utils.assertString(title);
	const opened = def.value.get('opened');
	if (opened) utils.assertBoolean(opened);

	return {
		children: children ? children.value.map(v => {
			utils.assertObject(v);
			return v.value.get('id').value;
		}) : [],
		title: title?.value ?? '',
		opened: opened?.value ?? true,
	};
}

function getPostFormButtonOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Omit<AsUiPostFormButton, 'id' | 'type'> {
	utils.assertObject(def);

	const text = def.value.get('text');
	if (text) utils.assertString(text);
	const primary = def.value.get('primary');
	if (primary) utils.assertBoolean(primary);
	const rounded = def.value.get('rounded');
	if (rounded) utils.assertBoolean(rounded);
	const form = def.value.get('form');
	if (form) utils.assertObject(form);

	const getForm = () => {
		const text = form!.value.get('text');
		utils.assertString(text);
		return {
			text: text.value,
		};
	};

	return {
		text: text?.value,
		primary: primary?.value,
		rounded: rounded?.value,
		form: form ? getForm() : {
			text: '',
		},
	};
}

export function registerAsUiLib(components: Ref<AsUiComponent>[], done: (root: Ref<AsUiRoot>) => void) {
	const instances = {};

	function createComponentInstance(type: AsUiComponent['type'], def: values.Value | undefined, id: values.Value | undefined, getOptions: (def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>) => any, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>) {
		if (id) utils.assertString(id);
		const _id = id?.value ?? uuid();
		const component = ref({
			...getOptions(def, call),
			type,
			id: _id,
		});
		components.push(component);
		const instance = values.OBJ(new Map([
			['id', values.STR(_id)],
			['update', values.FN_NATIVE(([def], opts) => {
				utils.assertObject(def);
				const updates = getOptions(def, call);
				for (const update of def.value.keys()) {
					if (!Object.hasOwn(updates, update)) continue;
					component.value[update] = updates[update];
				}
			})],
		]));
		instances[_id] = instance;
		return instance;
	}

	const rootInstance = createComponentInstance('root', utils.jsToVal({ children: [] }), utils.jsToVal('___root___'), getRootOptions, () => {});
	const rootComponent = components[0] as Ref<AsUiRoot>;
	done(rootComponent);

	return {
		'Ui:root': rootInstance,

		'Ui:patch': values.FN_NATIVE(([id, val], opts) => {
			utils.assertString(id);
			utils.assertArray(val);
			patch(id.value, val.value, opts.call);
		}),

		'Ui:get': values.FN_NATIVE(([id], opts) => {
			utils.assertString(id);
			const instance = instances[id.value];
			if (instance) {
				return instance;
			} else {
				return values.NULL;
			}
		}),

		// Ui:root.update({ children: [...] }) の糖衣構文
		'Ui:render': values.FN_NATIVE(([children], opts) => {
			utils.assertArray(children);

			rootComponent.value.children = children.value.map(v => {
				utils.assertObject(v);
				return v.value.get('id').value;
			});
		}),

		'Ui:C:container': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('container', def, id, getContainerOptions, opts.call);
		}),

		'Ui:C:text': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('text', def, id, getTextOptions, opts.call);
		}),

		'Ui:C:mfm': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('mfm', def, id, getMfmOptions, opts.call);
		}),

		'Ui:C:textarea': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('textarea', def, id, getTextareaOptions, opts.call);
		}),

		'Ui:C:textInput': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('textInput', def, id, getTextInputOptions, opts.call);
		}),

		'Ui:C:numberInput': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('numberInput', def, id, getNumberInputOptions, opts.call);
		}),

		'Ui:C:button': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('button', def, id, getButtonOptions, opts.call);
		}),

		'Ui:C:buttons': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('buttons', def, id, getButtonsOptions, opts.call);
		}),

		'Ui:C:switch': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('switch', def, id, getSwitchOptions, opts.call);
		}),

		'Ui:C:select': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('select', def, id, getSelectOptions, opts.call);
		}),

		'Ui:C:folder': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('folder', def, id, getFolderOptions, opts.call);
		}),

		'Ui:C:postFormButton': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('postFormButton', def, id, getPostFormButtonOptions, opts.call);
		}),
	};
}
