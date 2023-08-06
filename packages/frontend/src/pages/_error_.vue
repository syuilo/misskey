<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkLoading v-if="!loaded"/>
<Transition :name="defaultStore.state.animation ? '_transition_zoom' : ''" appear>
	<div v-show="loaded" :class="$style.root">
		<img :src="serverErrorImageUrl" class="_ghost" :class="$style.img"/>
		<div class="_gaps">
			<p><b><i class="ti ti-alert-triangle"></i> {{ i18n.ts.pageLoadError }}</b></p>
			<p v-if="meta && (version === meta.version)">{{ i18n.ts.pageLoadErrorDescription }}</p>
			<p v-else-if="serverIsDead">{{ i18n.ts.serverIsDead }}</p>
			<template v-else>
				<p>{{ i18n.ts.newVersionOfClientAvailable }}</p>
				<p>{{ i18n.ts.youShouldUpgradeClient }}</p>
				<MkButton style="margin: 8px auto;" @click="reload">{{ i18n.ts.reload }}</MkButton>
			</template>
			<p><MkA to="/docs/general/troubleshooting" class="_link">{{ i18n.ts.troubleshooting }}</MkA></p>
			<p v-if="error" style="opacity: 0.7;">ERROR: {{ error }}</p>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import { version } from '@/config';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { miLocalStorage } from '@/local-storage';
import { defaultStore } from '@/store';
import { serverErrorImageUrl } from '@/instance';

const props = withDefaults(defineProps<{
	error?: Error;
}>(), {
});

let loaded = $ref(false);
let serverIsDead = $ref(false);
let meta = $ref<misskey.entities.LiteInstanceMetadata | null>(null);

os.api('meta', {
	detail: false,
}).then(res => {
	loaded = true;
	serverIsDead = false;
	meta = res;
	miLocalStorage.setItem('v', res.version);
}, () => {
	loaded = true;
	serverIsDead = true;
});

function reload() {
	unisonReload();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.error,
	icon: 'ti ti-alert-triangle',
});
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;
}

.img {
	vertical-align: bottom;
	height: 128px;
	margin-bottom: 24px;
	border-radius: 16px;
}
</style>
