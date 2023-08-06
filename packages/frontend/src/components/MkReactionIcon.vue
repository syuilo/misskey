<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkCustomEmoji v-if="reaction[0] === ':'" :name="reaction" :normal="true" :noStyle="noStyle" :url="emojiUrl"/>
<MkEmoji v-else :emoji="reaction" :normal="true" :noStyle="noStyle"/>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';

const props = defineProps<{
	reaction: string;
	noStyle?: boolean;
	emojiUrl?: string;
}>();
</script>
