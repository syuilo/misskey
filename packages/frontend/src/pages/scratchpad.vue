<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="800">
	<div :class="$style.root">
		<div :class="$style.editor" class="_panel">
			<PrismEditor v-model="code" class="_code code" :highlight="highlighter" :lineNumbers="false"/>
			<MkButton style="position: absolute; top: 8px; right: 8px;" primary @click="run()"><i class="ti ti-player-play"></i></MkButton>
		</div>

		<MkContainer v-if="root && components.length > 1" :key="uiKey" :foldable="true">
			<template #header>UI</template>
			<div :class="$style.ui">
				<MkAsUi :component="root" :components="components" size="small"/>
			</div>
		</MkContainer>

		<MkContainer :foldable="true" class="">
			<template #header>{{ i18n.ts.output }}</template>
			<div :class="$style.logs">
				<div v-for="log in logs" :key="log.id" class="log" :class="{ print: log.print }">{{ log.text }}</div>
			</div>
		</MkContainer>

		<div class="">
			{{ i18n.ts.scratchpadDescription }}
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onDeactivated, onUnmounted, Ref, ref, watch } from 'vue';
import 'prismjs';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-okaidia.css';
import { PrismEditor } from 'vue-prism-editor';
import 'vue-prism-editor/dist/prismeditor.min.css';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import MkContainer from '@/components/MkContainer.vue';
import MkButton from '@/components/MkButton.vue';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import * as os from '@/os';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { AsUiComponent, AsUiRoot, registerAsUiLib } from '@/scripts/aiscript/ui';
import MkAsUi from '@/components/MkAsUi.vue';
import { miLocalStorage } from '@/local-storage';
import { claimAchievement } from '@/scripts/achievements';

const parser = new Parser();
let aiscript: Interpreter;
const code = ref('');
const logs = ref<any[]>([]);
const root = ref<AsUiRoot>();
let components: Ref<AsUiComponent>[] = $ref([]);
let uiKey = $ref(0);

const saved = miLocalStorage.getItem('scratchpad');
if (saved) {
	code.value = saved;
}

watch(code, () => {
	miLocalStorage.setItem('scratchpad', code.value);
});

async function run() {
	if (aiscript) aiscript.abort();
	root.value = undefined;
	components = [];
	uiKey++;
	logs.value = [];
	aiscript = new Interpreter(({
		...createAiScriptEnv({
			storageKey: 'widget',
			token: $i?.token,
		}),
		...registerAsUiLib(components, (_root) => {
			root.value = _root.value;
		}),
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
			if (value.type === 'str' && value.value.toLowerCase().replace(',', '').includes('hello world')) {
				claimAchievement('outputHelloWorldOnScratchpad');
			}
			logs.value.push({
				id: Math.random(),
				text: value.type === 'str' ? value.value : utils.valToString(value),
				print: true,
			});
		},
		log: (type, params) => {
			switch (type) {
				case 'end': logs.value.push({
					id: Math.random(),
					text: utils.valToString(params.val, true),
					print: false,
				}); break;
				default: break;
			}
		},
	});

	let ast;
	try {
		ast = parser.parse(code.value);
	} catch (error) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err: any) {
		os.alert({
			type: 'error',
			title: 'AiScript Error',
			text: err.message,
		});
	}
}

function highlighter(code) {
	return highlight(code, languages.js, 'javascript');
}

onDeactivated(() => {
	if (aiscript) aiscript.abort();
});

onUnmounted(() => {
	if (aiscript) aiscript.abort();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.scratchpad,
	icon: 'ti ti-terminal-2',
});
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: var(--margin);
}

.editor {
	position: relative;
}

.ui {
	padding: 32px;
}

.logs {
	padding: 16px;

	&:global {
		> .log {
			&:not(.print) {
				opacity: 0.7;
			}
		}
	}
}
</style>
