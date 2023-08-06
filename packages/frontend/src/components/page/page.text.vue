<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<Mfm :text="block.text" :isNote="false" :i="$i"/>
	<MkUrlPreview v-for="url in urls" :key="url" :url="url"/>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent } from 'vue';
import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { TextBlock } from './block.type';
import { extractUrlFromMfm } from '@/scripts/extract-url-from-mfm';
import { $i } from '@/account';

const MkUrlPreview = defineAsyncComponent(() => import('@/components/MkUrlPreview.vue'));

const props = defineProps<{
	block: TextBlock,
	page: Misskey.entities.Page,
}>();

const urls = props.block.text ? extractUrlFromMfm(mfm.parse(props.block.text)) : [];
</script>
