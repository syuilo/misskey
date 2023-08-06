<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="{ [$style.center]: page.alignCenter, [$style.serif]: page.font === 'serif' }">
	<XBlock v-for="child in page.content" :key="child.id" :page="page" :block="child" :h="2"/>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, nextTick } from 'vue';
import * as Misskey from 'misskey-js';
import XBlock from './page.block.vue';

defineProps<{
	page: Misskey.entities.Page,
}>();
</script>

<style lang="scss" module>
.serif {
	font-family: serif;
}

.center {
	text-align: center;
}
</style>
