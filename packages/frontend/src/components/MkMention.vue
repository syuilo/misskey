<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkA v-user-preview="canonical" :class="[$style.root, { [$style.isMe]: isMe }]" :to="url" :behavior="navigationBehavior">
	<img :class="$style.icon" :src="avatarUrl" alt="">
	<span>
		<span>@{{ username }}</span>
		<span v-if="(host != localHost) || defaultStore.state.showFullAcct" :class="$style.host">@{{ toUnicode(host) }}</span>
	</span>
</MkA>
</template>

<script lang="ts" setup>
import { toUnicode } from 'punycode.js';
import { computed } from 'vue';
import { host as localHost } from '@@/js/config.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';
import { getStaticImageUrl } from '@/scripts/media-proxy.js';
import type { MkABehavior } from '@/components/global/MkA.vue';

const props = defineProps<{
	username: string;
	host: string;
	navigationBehavior?: MkABehavior;
}>();

const canonical = props.host === localHost ? `@${props.username}` : `@${props.username}@${toUnicode(props.host)}`;

const url = `/${canonical}`;

const isMe = $i && (
	`@${props.username}@${toUnicode(props.host)}` === `@${$i.username}@${toUnicode(localHost)}`.toLowerCase()
);

const avatarUrl = computed(() => defaultStore.state.disableShowingAnimatedImages || defaultStore.state.dataSaver.avatar
	? getStaticImageUrl(`/avatar/@${props.username}@${props.host}`)
	: `/avatar/@${props.username}@${props.host}`,
);
</script>

<style lang="scss" module>
.root {
	display: inline-block;
	padding: 4px 8px 4px 4px;
	border-radius: 999px;
	color: var(--MI_THEME-mention);
	background: color(from var(--MI_THEME-mention) srgb r g b / 0.1);

	&.isMe {
		color: var(--MI_THEME-mentionMe);
		background: color(from var(--MI_THEME-mentionMe) srgb r g b / 0.1);
	}
}

.icon {
	width: 1.5em;
	height: 1.5em;
	object-fit: cover;
	margin: 0 0.2em 0 0;
	vertical-align: bottom;
	border-radius: 100%;
}

.host {
	opacity: 0.5;
}
</style>
