<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="meta" :class="$style.root" :style="{ backgroundImage: `url(${ meta.backgroundImageUrl })` }"></div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import * as os from '@/os';

const meta = ref<Misskey.entities.DetailedInstanceMetadata>();

os.api('meta', { detail: true }).then(gotMeta => {
	meta.value = gotMeta;
});
</script>

<style lang="scss" module>
.root {
	background-position: center;
	background-size: cover;
}
</style>
