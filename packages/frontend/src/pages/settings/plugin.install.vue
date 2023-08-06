<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormInfo warn>{{ i18n.ts._plugin.installWarn }}</FormInfo>

	<MkTextarea v-model="code" tall>
		<template #label>{{ i18n.ts.code }}</template>
	</MkTextarea>

	<div>
		<MkButton :disabled="code == null" primary inline @click="install"><i class="ti ti-check"></i> {{ i18n.ts.install }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent, nextTick, ref } from 'vue';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';
import { v4 as uuid } from 'uuid';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import FormInfo from '@/components/MkInfo.vue';
import * as os from '@/os';
import { ColdDeviceStorage } from '@/store';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const parser = new Parser();
const code = ref(null);

function installPlugin({ id, meta, src, token }) {
	ColdDeviceStorage.set('plugins', ColdDeviceStorage.get('plugins').concat({
		...meta,
		id,
		active: true,
		configData: {},
		token: token,
		src: src,
	}));
}

async function install() {
	if (code.value == null) return;

	const lv = utils.getLangVersion(code.value);
	if (lv == null) {
		os.alert({
			type: 'error',
			text: 'No language version annotation found :(',
		});
		return;
	} else if (!(lv.startsWith('0.12.') || lv.startsWith('0.13.'))) {
		os.alert({
			type: 'error',
			text: `aiscript version '${lv}' is not supported :(`,
		});
		return;
	}

	let ast;
	try {
		ast = parser.parse(code.value);
	} catch (err) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}

	const meta = Interpreter.collectMetadata(ast);
	if (meta == null) {
		os.alert({
			type: 'error',
			text: 'No metadata found :(',
		});
		return;
	}

	const metadata = meta.get(null);
	if (metadata == null) {
		os.alert({
			type: 'error',
			text: 'No metadata found :(',
		});
		return;
	}

	const { name, version, author, description, permissions, config } = metadata;
	if (name == null || version == null || author == null) {
		os.alert({
			type: 'error',
			text: 'Required property not found :(',
		});
		return;
	}

	const token = permissions == null || permissions.length === 0 ? null : await new Promise((res, rej) => {
		os.popup(defineAsyncComponent(() => import('@/components/MkTokenGenerateWindow.vue')), {
			title: i18n.ts.tokenRequested,
			information: i18n.ts.pluginTokenRequestedDescription,
			initialName: name,
			initialPermissions: permissions,
		}, {
			done: async result => {
				const { name, permissions } = result;
				const { token } = await os.api('miauth/gen-token', {
					session: null,
					name: name,
					permission: permissions,
				});
				res(token);
			},
		}, 'closed');
	});

	installPlugin({
		id: uuid(),
		meta: {
			name, version, author, description, permissions, config,
		},
		token,
		src: code.value,
	});

	os.success();

	nextTick(() => {
		unisonReload();
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts._plugin.install,
	icon: 'ti ti-download',
});
</script>
