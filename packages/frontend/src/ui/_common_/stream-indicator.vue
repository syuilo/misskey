<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="hasDisconnected && defaultStore.state.serverDisconnectedBehavior === 'quiet'" :class="$style.root" class="_panel _shadow" @click="resetDisconnected">
	<div><i class="ti ti-alert-triangle"></i> {{ i18n.ts.disconnectedFromServer }}</div>
	<div :class="$style.command" class="_buttons">
		<MkButton small primary @click="reload">{{ i18n.ts.reload }}</MkButton>
		<MkButton small>{{ i18n.ts.doNothing }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { defaultStore } from '@/store.js';

const zIndex = os.claimZIndex('high');

const hasDisconnected = ref(false);
let timeoutId: number | null = null;

function onDisconnected() {
	if (timeoutId != null) window.clearTimeout(timeoutId);
	timeoutId = window.setTimeout(() => {
		hasDisconnected.value = true;
	}, 5000);
}

function resetDisconnected() {
	if (timeoutId != null) window.clearTimeout(timeoutId);
	hasDisconnected.value = false;
}

function reload() {
	location.reload();
}

useStream().on('_connected_', resetDisconnected);
useStream().on('_disconnected_', onDisconnected);

onUnmounted(() => {
	if (timeoutId != null) window.clearTimeout(timeoutId);
	useStream().off('_connected_', resetDisconnected);
	useStream().off('_disconnected_', onDisconnected);
});
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: calc(var(--MI-minBottomSpacing) + var(--MI-margin));
	right: var(--MI-margin);
	margin: 0;
	padding: 12px;
	font-size: 0.9em;
	max-width: 320px;
}

.command {
	margin-top: 8px;
}
</style>
