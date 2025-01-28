<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-aiscript class="mkw-aiscript">
	<template #icon><i class="ti ti-terminal-2"></i></template>
	<template #header>{{ i18n.ts._widgets.aiscript }}</template>

	<div class="uylguesu _monospace">
		<textarea v-model="widgetProps.script" placeholder="(1 + 1)"></textarea>
		<button class="_buttonPrimary" @click="run">RUN</button>
		<div class="logs">
			<div v-for="log in logs" :key="log.id" class="log" :class="{ print: log.print }">{{ log.text }}</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import * as os from '@/os.js';
import MkContainer from '@/components/MkContainer.vue';
import { aiScriptReadline, createAiScriptEnv } from '@/scripts/aiscript/api.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';

const name = 'aiscript';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	script: {
		type: 'string' as const,
		multiline: true,
		default: '(1 + 1)',
		hidden: true,
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

const logs = ref<{
	id: string;
	text: string;
	print: boolean;
}[]>([]);

const run = async () => {
	logs.value = [];
	const aiscript = new Interpreter(createAiScriptEnv({
		storageKey: 'widget',
		token: $i?.token,
	}), {
		in: aiScriptReadline,
		out: (value) => {
			logs.value.push({
				id: Math.random().toString(),
				text: value.type === 'str' ? value.value : utils.valToString(value),
				print: true,
			});
		},
		log: (type, params) => {
			switch (type) {
				case 'end': logs.value.push({
					id: Math.random().toString(),
					text: utils.valToString(params.val, true),
					print: false,
				}); break;
				default: break;
			}
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

<style lang="scss" scoped>
.uylguesu {
	text-align: right;

	> textarea {
		display: block;
		width: 100%;
		max-width: 100%;
		min-width: 100%;
		padding: 16px;
		color: var(--MI_THEME-fg);
		background: transparent;
		border: none;
		border-bottom: solid 0.5px var(--MI_THEME-divider);
		border-radius: 0;
		box-sizing: border-box;
		font: inherit;

		&:focus-visible {
			outline: none;
		}
	}

	> button {
		display: inline-block;
		margin: 8px;
		padding: 0 10px;
		height: 28px;
		outline: none;
		border-radius: 4px;

		&:disabled {
			opacity: 0.7;
			cursor: default;
		}
	}

	> .logs {
		border-top: solid 0.5px var(--MI_THEME-divider);
		text-align: left;
		padding: 16px;

		&:empty {
			display: none;
		}

		> .log {
			&:not(.print) {
				opacity: 0.7;
			}
		}
	}
}
</style>
