<!--
SPDX-FileCopyrightText: syuilo and misskey-project
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
import { Interpreter, Parser } from '@syuilo/aiscript';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import * as os from '@/os.js';
import { aiScriptReadline, createAiScriptEnv } from '@/scripts/aiscript/api.js';
import { $i } from '@/account.js';
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
		in: aiScriptReadline,
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
