<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkButton v-if="$i && ($i.isModerator || $i.policies.canManageCustomEmojis)" primary link to="/custom-emojis-manager">{{ i18n.ts.manageCustomEmojis }}</MkButton>

	<div class="query">
		<MkInput v-model="q" class="" :placeholder="i18n.ts.search">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>

		<!-- たくさんあると邪魔
		<div class="tags">
			<span class="tag _button" v-for="tag in customEmojiTags" :class="{ active: selectedTags.has(tag) }" @click="toggleTag(tag)">{{ tag }}</span>
		</div>
		-->
	</div>

	<MkFoldableSection v-if="searchEmojis">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<div :class="$style.emojis">
			<XEmoji v-for="emoji in searchEmojis" :key="emoji.name" :emoji="emoji"/>
		</div>
	</MkFoldableSection>

	<MkFoldableSection v-for="category in customEmojiCategories" v-once :key="category">
		<template #header>{{ category || i18n.ts.other }}</template>
		<div :class="$style.emojis">
			<XEmoji v-for="emoji in customEmojis.filter(e => e.category === category)" :key="emoji.name" :emoji="emoji"/>
		</div>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { watch } from 'vue';
import * as Misskey from 'misskey-js';
import XEmoji from './emojis.emoji.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { customEmojis, customEmojiCategories, getCustomEmojiTags } from '@/custom-emojis';
import { i18n } from '@/i18n';
import { $i } from '@/account';

const customEmojiTags = getCustomEmojiTags();
let q = $ref('');
let searchEmojis = $ref<Misskey.entities.CustomEmoji[]>(null);
let selectedTags = $ref(new Set());

function search() {
	if ((q === '' || q == null) && selectedTags.size === 0) {
		searchEmojis = null;
		return;
	}

	if (selectedTags.size === 0) {
		const queryarry = q.match(/\:([a-z0-9_]*)\:/g);

		if (queryarry) {
			searchEmojis = customEmojis.value.filter(emoji =>
				queryarry.includes(`:${emoji.name}:`),
			);
		} else {
			searchEmojis = customEmojis.value.filter(emoji => emoji.name.includes(q) || emoji.aliases.includes(q));
		}
	} else {
		searchEmojis = customEmojis.value.filter(emoji => (emoji.name.includes(q) || emoji.aliases.includes(q)) && [...selectedTags].every(t => emoji.aliases.includes(t)));
	}
}

function toggleTag(tag) {
	if (selectedTags.has(tag)) {
		selectedTags.delete(tag);
	} else {
		selectedTags.add(tag);
	}
}

watch($$(q), () => {
	search();
});

watch($$(selectedTags), () => {
	search();
}, { deep: true });
</script>

<style lang="scss" module>
.emojis {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	grid-gap: 12px;
}
</style>
