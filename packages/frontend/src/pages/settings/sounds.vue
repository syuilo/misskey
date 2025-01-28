<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSwitch v-model="notUseSound">
		<template #label>{{ i18n.ts.notUseSound }}</template>
	</MkSwitch>
	<MkSwitch v-model="useSoundOnlyWhenActive">
		<template #label>{{ i18n.ts.useSoundOnlyWhenActive }}</template>
	</MkSwitch>
	<MkRange v-model="masterVolume" :min="0" :max="1" :step="0.05" :textConverter="(v) => `${Math.floor(v * 100)}%`">
		<template #label>{{ i18n.ts.masterVolume }}</template>
	</MkRange>

	<FormSection>
		<template #label>{{ i18n.ts.sounds }}</template>
		<div class="_gaps_s">
			<MkFolder v-for="type in operationTypes" :key="type">
				<template #label>{{ i18n.ts._sfx[type] }}</template>
				<template #suffix>{{ getSoundTypeName(sounds[type].type) }}</template>
				<Suspense>
					<template #default>
						<XSound :type="sounds[type].type" :volume="sounds[type].volume" :fileId="sounds[type].fileId" :fileUrl="sounds[type].fileUrl" @update="(res) => updated(type, res)"/>
					</template>
					<template #fallback>
						<MkLoading/>
					</template>
				</Suspense>
			</MkFolder>
		</div>
	</FormSection>

	<MkButton danger @click="reset()"><i class="ti ti-reload"></i> {{ i18n.ts.default }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import XSound from './sounds.sound.vue';
import type { SoundType, OperationType } from '@/scripts/sound.js';
import type { SoundStore } from '@/store.js';
import MkRange from '@/components/MkRange.vue';
import MkButton from '@/components/MkButton.vue';
import FormSection from '@/components/form/section.vue';
import MkFolder from '@/components/MkFolder.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { operationTypes } from '@/scripts/sound.js';
import { defaultStore } from '@/store.js';
import MkSwitch from '@/components/MkSwitch.vue';

const notUseSound = computed(defaultStore.makeGetterSetter('sound_notUseSound'));
const useSoundOnlyWhenActive = computed(defaultStore.makeGetterSetter('sound_useSoundOnlyWhenActive'));
const masterVolume = computed(defaultStore.makeGetterSetter('sound_masterVolume'));

const sounds = ref<Record<OperationType, Ref<SoundStore>>>({
	note: defaultStore.reactiveState.sound_note,
	noteMy: defaultStore.reactiveState.sound_noteMy,
	notification: defaultStore.reactiveState.sound_notification,
	reaction: defaultStore.reactiveState.sound_reaction,
});

function getSoundTypeName(f: SoundType): string {
	switch (f) {
		case null:
			return i18n.ts.none;
		case '_driveFile_':
			return i18n.ts._soundSettings.driveFile;
		default:
			return f;
	}
}

async function updated(type: keyof typeof sounds.value, sound) {
	const v: SoundStore = {
		type: sound.type,
		fileId: sound.fileId,
		fileUrl: sound.fileUrl,
		volume: sound.volume,
	};

	defaultStore.set(`sound_${type}`, v);
	sounds.value[type] = v;
}

function reset() {
	for (const sound of Object.keys(sounds.value) as Array<keyof typeof sounds.value>) {
		const v = defaultStore.def[`sound_${sound}`].default;
		defaultStore.set(`sound_${sound}`, v);
		sounds.value[sound] = v;
	}
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.sounds,
	icon: 'ti ti-music',
}));
</script>
