<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="800">
	<MkTab v-model="tab" style="margin-bottom: var(--MI-margin);">
		<option value="notes">{{ i18n.ts.notes }}</option>
		<option value="notesWithSensitive">{{ i18n.ts.notes }} (+{{ i18n.ts.sensitive }})</option>
		<option value="polls">{{ i18n.ts.poll }}</option>
	</MkTab>
	<MkNotes v-if="tab === 'notes'" :pagination="paginationForNotes"/>
	<MkNotes v-else-if="tab === 'notesWithSensitive'" :pagination="paginationForNotesWithSensitive"/>
	<MkNotes v-else-if="tab === 'polls'" :pagination="paginationForPolls"/>
</MkSpacer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkTab from '@/components/MkTab.vue';
import { i18n } from '@/i18n.js';

const paginationForNotes = {
	endpoint: 'notes/featured' as const,
	limit: 10,
	params: {
		withSensitive: false,
	},
};

const paginationForNotesWithSensitive = {
	endpoint: 'notes/featured' as const,
	limit: 10,
	params: {
		withSensitive: true,
	},
};

const paginationForPolls = {
	endpoint: 'notes/polls/recommendation' as const,
	limit: 10,
	offsetMode: true,
	params: {
		excludeChannels: true,
	},
};

const tab = ref('notes');
</script>
