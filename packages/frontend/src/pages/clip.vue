<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions"/></template>
	<MkSpacer :contentMax="800">
		<div v-if="clip" class="_gaps">
			<div class="_panel">
				<div v-if="clip.description" :class="$style.description">
					<Mfm :text="clip.description" :isNote="false" :i="$i"/>
				</div>
				<MkButton v-if="favorited" v-tooltip="i18n.ts.unfavorite" asLike rounded primary @click="unfavorite()"><i class="ti ti-heart"></i><span v-if="clip.favoritedCount > 0" style="margin-left: 6px;">{{ clip.favoritedCount }}</span></MkButton>
				<MkButton v-else v-tooltip="i18n.ts.favorite" asLike rounded @click="favorite()"><i class="ti ti-heart"></i><span v-if="clip.favoritedCount > 0" style="margin-left: 6px;">{{ clip.favoritedCount }}</span></MkButton>
				<div :class="$style.user">
					<MkAvatar :user="clip.user" :class="$style.avatar" indicator link preview/> <MkUserName :user="clip.user" :nowrap="false"/>
				</div>
			</div>

			<MkNotes :pagination="pagination" :detail="true"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, watch, provide } from 'vue';
import * as misskey from 'misskey-js';
import MkNotes from '@/components/MkNotes.vue';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { definePageMetadata } from '@/scripts/page-metadata';
import { url } from '@/config';
import MkButton from '@/components/MkButton.vue';
import { clipsCache } from '@/cache';

const props = defineProps<{
	clipId: string,
}>();

let clip: misskey.entities.Clip = $ref<misskey.entities.Clip>();
let favorited = $ref(false);
const pagination = {
	endpoint: 'clips/notes' as const,
	limit: 10,
	params: computed(() => ({
		clipId: props.clipId,
	})),
};

const isOwned: boolean | null = $computed<boolean | null>(() => $i && clip && ($i.id === clip.userId));

watch(() => props.clipId, async () => {
	clip = await os.api('clips/show', {
		clipId: props.clipId,
	});
	favorited = clip.isFavorited;
}, {
	immediate: true,
});

provide('currentClip', $$(clip));

function favorite() {
	os.apiWithDialog('clips/favorite', {
		clipId: props.clipId,
	}).then(() => {
		favorited = true;
	});
}

async function unfavorite() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unfavoriteConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('clips/unfavorite', {
		clipId: props.clipId,
	}).then(() => {
		favorited = false;
	});
}

const headerActions = $computed(() => clip && isOwned ? [{
	icon: 'ti ti-pencil',
	text: i18n.ts.edit,
	handler: async (): Promise<void> => {
		const { canceled, result } = await os.form(clip.name, {
			name: {
				type: 'string',
				label: i18n.ts.name,
				default: clip.name,
			},
			description: {
				type: 'string',
				required: false,
				multiline: true,
				label: i18n.ts.description,
				default: clip.description,
			},
			isPublic: {
				type: 'boolean',
				label: i18n.ts.public,
				default: clip.isPublic,
			},
		});
		if (canceled) return;

		os.apiWithDialog('clips/update', {
			clipId: clip.id,
			...result,
		});

		clipsCache.delete();
	},
}, ...(clip.isPublic ? [{
	icon: 'ti ti-share',
	text: i18n.ts.share,
	handler: async (): Promise<void> => {
		navigator.share({
			title: clip.name,
			text: clip.description,
			url: `${url}/clips/${clip.id}`,
		});
	},
}] : []), {
	icon: 'ti ti-trash',
	text: i18n.ts.delete,
	danger: true,
	handler: async (): Promise<void> => {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.t('deleteAreYouSure', { x: clip.name }),
		});
		if (canceled) return;

		await os.apiWithDialog('clips/delete', {
			clipId: clip.id,
		});

		clipsCache.delete();
	},
}] : null);

definePageMetadata(computed(() => clip ? {
	title: clip.name,
	icon: 'ti ti-paperclip',
} : null));
</script>

<style lang="scss" module>
.description {
	padding: 16px;
}

.user {
	--height: 32px;
	padding: 16px;
	border-top: solid 0.5px var(--divider);
	line-height: var(--height);
}

.avatar {
	width: var(--height);
	height: var(--height);
}
</style>
