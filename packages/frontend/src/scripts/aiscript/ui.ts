/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { utils, values } from '@syuilo/aiscript';
import { v4 as uuid } from 'uuid';
import { ref } from 'vue';
import type { Ref } from 'vue';
import * as Misskey from 'misskey-js';
import { assertStringAndIsIn } from './common.js';

const ALIGNS = ['left', 'center', 'right'] as const;
const FONTS = ['serif', 'sans-serif', 'monospace'] as const;
const BORDER_STYLES = ['hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'] as const;

type Align = (typeof ALIGNS)[number];
type Font = (typeof FONTS)[number];
type BorderStyle = (typeof BORDER_STYLES)[number];

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
	align?: Align;
	bgColor?: string;
	fgColor?: string;
	font?: Font;
	borderWidth?: number;
	borderColor?: string;
	borderStyle?: BorderStyle;
	borderRadius?: number;
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
	font?: Font;
};

export type AsUiMfm = AsUiComponentBase & {
	type: 'mfm';
	text?: string;
	size?: number;
	bold?: boolean;
	color?: string;
	font?: Font;
	onClickEv?: (evId: string) => Promise<void>;
};

export type AsUiButton = AsUiComponentBase & {
	type: 'button';
	text?: string;
	onClick?: () => Promise<void>;
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
	onChange?: (v: boolean) => Promise<void>;
	default?: boolean;
	label?: string;
	caption?: string;
};

export type AsUiTextarea = AsUiComponentBase & {
	type: 'textarea';
	onInput?: (v: string) => Promise<void>;
	default?: string;
	label?: string;
	caption?: string;
};

export type AsUiTextInput = AsUiComponentBase & {
	type: 'textInput';
	onInput?: (v: string) => Promise<void>;
	default?: string;
	label?: string;
	caption?: string;
};

export type AsUiNumberInput = AsUiComponentBase & {
	type: 'numberInput';
	onInput?: (v: number) => Promise<void>;
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
	onChange?: (v: string) => Promise<void>;
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

type PostFormPropsForAsUi = {
	text: string;
	cw?: string;
	visibility?: (typeof Misskey.noteVisibilities)[number];
	localOnly?: boolean;
};

export type AsUiPostFormButton = AsUiComponentBase & {
	type: 'postFormButton';
	text?: string;
	primary?: boolean;
	rounded?: boolean;
	form?: PostFormPropsForAsUi;
};

export type AsUiPostForm = AsUiComponentBase & {
	type: 'postForm';
	form?: PostFormPropsForAsUi;
};

export type AsUiComponent = AsUiRoot | AsUiContainer | AsUiText | AsUiMfm | AsUiButton | AsUiButtons | AsUiSwitch | AsUiTextarea | AsUiTextInput | AsUiNumberInput | AsUiSelect | AsUiFolder | AsUiPostFormButton | AsUiPostForm;

type Options<T extends AsUiComponent> = T extends AsUiButtons
	? Omit<T, 'id' | 'type' | 'buttons'> & { 'buttons'?: Options<AsUiButton>[] }
	: Omit<T, 'id' | 'type'>;

export function patch(id: string, def: values.Value, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>) {
	// TODO
}

function getRootOptions(def: values.Value | undefined): Options<AsUiRoot> {
	utils.assertObject(def);

	const children = def.value.get('children');
	utils.assertArray(children);

	return {
		children: children.value.map(v => {
			utils.assertObject(v);
			const id = v.value.get('id');
			utils.assertString(id);
			return id.value;
		}),
	};
}

function getContainerOptions(def: values.Value | undefined): Options<AsUiContainer> {
	utils.assertObject(def);

	const children = def.value.get('children');
	if (children) utils.assertArray(children);
	const align = def.value.get('align');
	if (align) assertStringAndIsIn(align, ALIGNS);
	const bgColor = def.value.get('bgColor');
	if (bgColor) utils.assertString(bgColor);
	const fgColor = def.value.get('fgColor');
	if (fgColor) utils.assertString(fgColor);
	const font = def.value.get('font');
	if (font) assertStringAndIsIn(font, FONTS);
	const borderWidth = def.value.get('borderWidth');
	if (borderWidth) utils.assertNumber(borderWidth);
	const borderColor = def.value.get('borderColor');
	if (borderColor) utils.assertString(borderColor);
	const borderStyle = def.value.get('borderStyle');
	if (borderStyle) assertStringAndIsIn(borderStyle, BORDER_STYLES);
	const borderRadius = def.value.get('borderRadius');
	if (borderRadius) utils.assertNumber(borderRadius);
	const padding = def.value.get('padding');
	if (padding) utils.assertNumber(padding);
	const rounded = def.value.get('rounded');
	if (rounded) utils.assertBoolean(rounded);
	const hidden = def.value.get('hidden');
	if (hidden) utils.assertBoolean(hidden);

	return {
		children: children ? children.value.map(v => {
			utils.assertObject(v);
			const id = v.value.get('id');
			utils.assertString(id);
			return id.value;
		}) : [],
		align: align?.value,
		fgColor: fgColor?.value,
		bgColor: bgColor?.value,
		font: font?.value,
		borderWidth: borderWidth?.value,
		borderColor: borderColor?.value,
		borderStyle: borderStyle?.value,
		borderRadius: borderRadius?.value,
		padding: padding?.value,
		rounded: rounded?.value,
		hidden: hidden?.value,
	};
}

function getTextOptions(def: values.Value | undefined): Options<AsUiText> {
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
	if (font) assertStringAndIsIn(font, FONTS);

	return {
		text: text?.value,
		size: size?.value,
		bold: bold?.value,
		color: color?.value,
		font: font?.value,
	};
}

function getMfmOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiMfm> {
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
	if (font) assertStringAndIsIn(font, FONTS);
	const onClickEv = def.value.get('onClickEv');
	if (onClickEv) utils.assertFunction(onClickEv);

	return {
		text: text?.value,
		size: size?.value,
		bold: bold?.value,
		color: color?.value,
		font: font?.value,
		onClickEv: async (evId: string) => {
			if (onClickEv) await call(onClickEv, [values.STR(evId)]);
		},
	};
}

function getTextInputOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiTextInput> {
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
		onInput: async (v) => {
			if (onInput) await call(onInput, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getTextareaOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiTextarea> {
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
		onInput: async (v) => {
			if (onInput) await call(onInput, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getNumberInputOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiNumberInput> {
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
		onInput: async (v) => {
			if (onInput) await call(onInput, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getButtonOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiButton> {
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
		onClick: async () => {
			if (onClick) await call(onClick, []);
		},
		primary: primary?.value,
		rounded: rounded?.value,
		disabled: disabled?.value,
	};
}

function getButtonsOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiButtons> {
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
				onClick: async () => {
					await call(onClick, []);
				},
				primary: primary?.value,
				rounded: rounded?.value,
				disabled: disabled?.value,
			};
		}) : [],
	};
}

function getSwitchOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiSwitch> {
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
		onChange: async (v) => {
			if (onChange) await call(onChange, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getSelectOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiSelect> {
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
		onChange: async (v) => {
			if (onChange) await call(onChange, [utils.jsToVal(v)]);
		},
		default: defaultValue?.value,
		label: label?.value,
		caption: caption?.value,
	};
}

function getFolderOptions(def: values.Value | undefined): Options<AsUiFolder> {
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
			const id = v.value.get('id');
			utils.assertString(id);
			return id.value;
		}) : [],
		title: title?.value ?? '',
		opened: opened?.value ?? true,
	};
}

function getPostFormProps(form: values.VObj): PostFormPropsForAsUi {
	const text = form.value.get('text');
	utils.assertString(text);
	const cw = form.value.get('cw');
	if (cw) utils.assertString(cw);
	const visibility = form.value.get('visibility');
	if (visibility) utils.assertString(visibility);
	const localOnly = form.value.get('localOnly');
	if (localOnly) utils.assertBoolean(localOnly);

	return {
		text: text.value,
		cw: cw?.value,
		visibility: (visibility?.value && (Misskey.noteVisibilities as readonly string[]).includes(visibility.value)) ? visibility.value as typeof Misskey.noteVisibilities[number] : undefined,
		localOnly: localOnly?.value,
	};
}

function getPostFormButtonOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiPostFormButton> {
	utils.assertObject(def);

	const text = def.value.get('text');
	if (text) utils.assertString(text);
	const primary = def.value.get('primary');
	if (primary) utils.assertBoolean(primary);
	const rounded = def.value.get('rounded');
	if (rounded) utils.assertBoolean(rounded);
	const form = def.value.get('form');
	if (form) utils.assertObject(form);

	return {
		text: text?.value,
		primary: primary?.value,
		rounded: rounded?.value,
		form: form ? getPostFormProps(form) : {
			text: '',
		},
	};
}

function getPostFormOptions(def: values.Value | undefined, call: (fn: values.VFn, args: values.Value[]) => Promise<values.Value>): Options<AsUiPostForm> {
	utils.assertObject(def);

	const form = def.value.get('form');
	if (form) utils.assertObject(form);

	return {
		form: form ? getPostFormProps(form) : {
			text: '',
		},
	};
}

export function registerAsUiLib(components: Ref<AsUiComponent>[], done: (root: Ref<AsUiRoot>) => void) {
	type OptionsConverter<T extends AsUiComponent, C> = (def: values.Value | undefined, call: C) => Options<T>;

	const instances = {};

	function createComponentInstance<T extends AsUiComponent, C>(
		type: T['type'],
		def: values.Value | undefined,
		id: values.Value | undefined,
		getOptions: OptionsConverter<T, C>,
		call: C,
	) {
		if (id) utils.assertString(id);
		const _id = id?.value ?? uuid();
		const component = ref({
			...getOptions(def, call),
			type,
			id: _id,
		} as T);
		components.push(component);
		const instance = values.OBJ(new Map<string, values.Value>([
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
			// patch(id.value, val.value, opts.call); // TODO
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
				const id = v.value.get('id');
				utils.assertString(id);
				return id.value;
			});
		}),

		'Ui:C:container': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('container', def, id, getContainerOptions, opts.topCall);
		}),

		'Ui:C:text': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('text', def, id, getTextOptions, opts.topCall);
		}),

		'Ui:C:mfm': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('mfm', def, id, getMfmOptions, opts.topCall);
		}),

		'Ui:C:textarea': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('textarea', def, id, getTextareaOptions, opts.topCall);
		}),

		'Ui:C:textInput': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('textInput', def, id, getTextInputOptions, opts.topCall);
		}),

		'Ui:C:numberInput': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('numberInput', def, id, getNumberInputOptions, opts.topCall);
		}),

		'Ui:C:button': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('button', def, id, getButtonOptions, opts.topCall);
		}),

		'Ui:C:buttons': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('buttons', def, id, getButtonsOptions, opts.topCall);
		}),

		'Ui:C:switch': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('switch', def, id, getSwitchOptions, opts.topCall);
		}),

		'Ui:C:select': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('select', def, id, getSelectOptions, opts.topCall);
		}),

		'Ui:C:folder': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('folder', def, id, getFolderOptions, opts.topCall);
		}),

		'Ui:C:postFormButton': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('postFormButton', def, id, getPostFormButtonOptions, opts.topCall);
		}),

		'Ui:C:postForm': values.FN_NATIVE(([def, id], opts) => {
			return createComponentInstance('postForm', def, id, getPostFormOptions, opts.topCall);
		}),
	};
}
