// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, watch } from 'vue';
import { throttle } from 'throttle-debounce';
import { Form, GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import { deepClone } from '@/scripts/clone';

export type Widget<P extends Record<string, unknown>> = {
	id: string;
	data: Partial<P>;
};

export type WidgetComponentProps<P extends Record<string, unknown>> = {
	widget?: Widget<P>;
};

export type WidgetComponentEmits<P extends Record<string, unknown>> = {
	(ev: 'updateProps', props: P);
};

export type WidgetComponentExpose = {
	name: string;
	id: string | null;
	configure: () => void;
};

export const useWidgetPropsManager = <F extends Form & Record<string, { default: any; }>>(
	name: string,
	propsDef: F,
	props: Readonly<WidgetComponentProps<GetFormResultType<F>>>,
	emit: WidgetComponentEmits<GetFormResultType<F>>,
): {
	widgetProps: GetFormResultType<F>;
	save: () => void;
	configure: () => void;
} => {
	const widgetProps = reactive(props.widget ? deepClone(props.widget.data) : {});

	const mergeProps = () => {
		for (const prop of Object.keys(propsDef)) {
			if (typeof widgetProps[prop] === 'undefined') {
				widgetProps[prop] = propsDef[prop].default;
			}
		}
	};
	watch(widgetProps, () => {
		mergeProps();
	}, { deep: true, immediate: true });

	const save = throttle(3000, () => {
		emit('updateProps', widgetProps);
	});

	const configure = async () => {
		const form = deepClone(propsDef);
		for (const item of Object.keys(form)) {
			form[item].default = widgetProps[item];
		}
		const { canceled, result } = await os.form(name, form);
		if (canceled) return;

		for (const key of Object.keys(result)) {
			widgetProps[key] = result[key];
		}

		save();
	};

	return {
		widgetProps,
		save,
		configure,
	};
};
