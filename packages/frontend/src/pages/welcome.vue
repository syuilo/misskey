<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="meta">
	<XSetup v-if="meta.requireSetup"/>
	<XEntrance v-else/>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';
import XSetup from './welcome.setup.vue';
import XEntrance from './welcome.entrance.a.vue';
import { instanceName } from '@/config';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';

let meta = $ref(null);

os.api('meta', { detail: true }).then(res => {
	meta = res;
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: instanceName,
	icon: null,
})));
</script>
