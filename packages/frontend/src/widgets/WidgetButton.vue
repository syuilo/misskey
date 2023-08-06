<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-cy-mkw-button class="mkw-button">
	<MkButton :primary="widgetProps.colored" full @click="run">
		{{ widgetProps.label }}
	</MkButton>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { Interpreter, Parser } from '@syuilo/aiscript';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import { $i } from '@/account';
import MkButton from '@/components/MkButton.vue';

const name = 'button';

const widgetPropsDef = {
	label: {
		type: 'string' as const,
		default: 'BUTTON',
	},
	colored: {
		type: 'boolean' as const,
		default: true,
	},
	script: {
		type: 'string' as const,
		multiline: true,
		default: 'Mk:dialog("hello" "world")',
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const parser = new Parser();

const run = async () => {
	const aiscript = new Interpreter(createAiScriptEnv({
		storageKey: 'widget',
		token: $i?.token,
	}), {
		in: (q) => {
			return new Promise(ok => {
				os.inputText({
					title: q,
				}).then(({ canceled, result: a }) => {
					if (canceled) {
						ok('');
					} else {
						ok(a);
					}
				});
			});
		},
		out: (value) => {
			// nop
		},
		log: (type, params) => {
			// nop
		},
	});

	let ast;
	try {
		ast = parser.parse(widgetProps.script);
	} catch (err) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err) {
		os.alert({
			type: 'error',
			text: err,
		});
	}
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
