<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :style="{ height: height + 'px' }"></div>
</template>

<script setup lang="ts">
defineProps<{
	height: number;
}>();
</script>
