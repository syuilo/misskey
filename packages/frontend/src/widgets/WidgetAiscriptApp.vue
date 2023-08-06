<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-aiscriptApp">
	<template #header>App</template>
	<div :class="$style.root">
		<MkAsUi v-if="root" :component="root" :components="components" size="small"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, Ref, ref, watch } from 'vue';
import { Interpreter, Parser } from '@syuilo/aiscript';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import { $i } from '@/account';
import MkAsUi from '@/components/MkAsUi.vue';
import MkContainer from '@/components/MkContainer.vue';
import { AsUiComponent, AsUiRoot, registerAsUiLib } from '@/scripts/aiscript/ui';

const name = 'aiscriptApp';

const widgetPropsDef = {
	script: {
		type: 'string' as const,
		multiline: true,
		default: '',
	},
	showHeader: {
		type: 'boolean' as const,
		default: true,
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

const root = ref<AsUiRoot>();
const components: Ref<AsUiComponent>[] = $ref([]);

async function run() {
	const aiscript = new Interpreter({
		...createAiScriptEnv({
			storageKey: 'widget',
			token: $i?.token,
		}),
		...registerAsUiLib(components, (_root) => {
			root.value = _root.value;
		}),
	}, {
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
			title: 'AiScript Error',
			text: err.message,
		});
	}
}

watch(() => widgetProps.script, () => {
	run();
});

onMounted(() => {
	run();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root {
	padding: 16px;
}
</style>
