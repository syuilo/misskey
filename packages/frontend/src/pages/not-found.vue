<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div class="_fullinfo">
		<img :src="notFoundImageUrl" class="_ghost"/>
		<div>{{ i18n.ts.notFoundDescription }}</div>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { pleaseLogin } from '@/scripts/please-login';
import { notFoundImageUrl } from '@/instance';

const props = defineProps<{
	showLoginPopup?: boolean;
}>();

if (props.showLoginPopup) {
	pleaseLogin('/');
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.notFound,
	icon: 'ti ti-alert-triangle',
});
</script>
