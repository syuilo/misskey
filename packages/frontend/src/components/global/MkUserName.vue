<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Mfm :text="user.name ?? user.username" :author="user" :plain="true" :nowrap="nowrap" :emojiUrls="user.emojis"/>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import * as misskey from 'misskey-js';

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
	nowrap?: boolean;
}>(), {
	nowrap: true,
});
</script>
