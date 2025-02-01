<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow ref="dialogEl" @close="cancel()" @closed="emit('closed')">
	<template #header>:{{ emoji.name }}:</template>
	<template #default>
		<MkSpacer>
			<div style="display: flex; flex-direction: column; gap: 1em;">
				<div :class="$style.emojiImgWrapper">
					<MkCustomEmoji :name="emoji.name" :normal="true" :useOriginalSize="true" style="height: 100%;"></MkCustomEmoji>
				</div>
				<MkKeyValue :copy="`:${emoji.name}:`">
					<template #key>{{ i18n.ts.name }}</template>
					<template #value>{{ emoji.name }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.tags }}</template>
					<template #value>
						<div v-if="emoji.aliases.length === 0">{{ i18n.ts.none }}</div>
						<div v-else :class="$style.aliases">
							<span v-for="alias in emoji.aliases" :key="alias" :class="$style.alias">
								{{ alias }}
							</span>
						</div>
					</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.category }}</template>
					<template #value>{{ emoji.category ?? i18n.ts.none }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.sensitive }}</template>
					<template #value>{{ emoji.isSensitive ? i18n.ts.yes : i18n.ts.no }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.localOnly }}</template>
					<template #value>{{ emoji.localOnly ? i18n.ts.yes : i18n.ts.no }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.license }}</template>
					<template #value><Mfm :text="emoji.license ?? i18n.ts.none"/></template>
				</MkKeyValue>
				<MkKeyValue :copy="emoji.url">
					<template #key>{{ i18n.ts.emojiUrl }}</template>
					<template #value>
						<MkLink :url="emoji.url" target="_blank">{{ emoji.url }}</MkLink>
					</template>
				</MkKeyValue>
			</div>
		</MkSpacer>
	</template>
</MkModalWindow>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { shallowRef } from 'vue';
import MkLink from '@/components/MkLink.vue';
import { i18n } from '@/i18n.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';

const props = defineProps<{
  emoji: Misskey.entities.EmojiDetailed,
}>();

const emit = defineEmits<{
	(ev: 'ok', cropped: Misskey.entities.DriveFile): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('cancel');
	dialogEl.value!.close();
}
</script>

<style lang="scss" module>
.emojiImgWrapper {
  max-width: 100%;
  height: 40cqh;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, var(--MI_THEME-X5) 8px, var(--MI_THEME-X5) 14px);
  border-radius: var(--MI-radius);
  margin: auto;
  overflow-y: hidden;
}

.aliases {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.alias {
  display: inline-block;
  word-break: break-all;
  padding: 3px 10px;
  background-color: var(--MI_THEME-X5);
  border: solid 1px var(--MI_THEME-divider);
  border-radius: var(--MI-radius);
}
</style>
