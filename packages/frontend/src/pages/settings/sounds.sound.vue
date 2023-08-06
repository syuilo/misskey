<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkSelect v-model="type">
		<template #label>{{ i18n.ts.sound }}</template>
		<option v-for="x in soundsTypes" :key="x" :value="x">{{ x == null ? i18n.ts.none : x }}</option>
	</MkSelect>
	<MkRange v-model="volume" :min="0" :max="1" :step="0.05" :textConverter="(v) => `${Math.floor(v * 100)}%`">
		<template #label>{{ i18n.ts.volume }}</template>
	</MkRange>

	<div class="_buttons">
		<MkButton inline @click="listen"><i class="ti ti-player-play"></i> {{ i18n.ts.listen }}</MkButton>
		<MkButton inline primary @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import MkRange from '@/components/MkRange.vue';
import { i18n } from '@/i18n';
import { playFile, soundsTypes } from '@/scripts/sound';

const props = defineProps<{
	type: string;
	volume: number;
}>();

const emit = defineEmits<{
	(ev: 'update', result: { type: string; volume: number; }): void;
}>();

let type = $ref(props.type);
let volume = $ref(props.volume);

function listen() {
	playFile(type, volume);
}

function save() {
	emit('update', { type, volume });
}
</script>
