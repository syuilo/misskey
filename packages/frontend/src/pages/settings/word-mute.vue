<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<MkTab v-model="tab">
		<option value="soft">{{ i18n.ts._wordMute.soft }}</option>
		<option value="hard">{{ i18n.ts._wordMute.hard }}</option>
	</MkTab>
	<div>
		<div v-show="tab === 'soft'" class="_gaps_m">
			<MkInfo>{{ i18n.ts._wordMute.softDescription }}</MkInfo>
			<MkTextarea v-model="softMutedWords">
				<span>{{ i18n.ts._wordMute.muteWords }}</span>
				<template #caption>{{ i18n.ts._wordMute.muteWordsDescription }}<br>{{ i18n.ts._wordMute.muteWordsDescription2 }}</template>
			</MkTextarea>
		</div>
		<div v-show="tab === 'hard'" class="_gaps_m">
			<MkInfo>{{ i18n.ts._wordMute.hardDescription }} {{ i18n.ts.reflectMayTakeTime }}</MkInfo>
			<MkTextarea v-model="hardMutedWords">
				<span>{{ i18n.ts._wordMute.muteWords }}</span>
				<template #caption>{{ i18n.ts._wordMute.muteWordsDescription }}<br>{{ i18n.ts._wordMute.muteWordsDescription2 }}</template>
			</MkTextarea>
			<MkKeyValue v-if="hardWordMutedNotesCount != null">
				<template #key>{{ i18n.ts._wordMute.mutedNotes }}</template>
				<template #value>{{ number(hardWordMutedNotesCount) }}</template>
			</MkKeyValue>
		</div>
	</div>
	<MkButton primary inline :disabled="!changed" @click="save()"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref, watch } from 'vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkTab from '@/components/MkTab.vue';
import * as os from '@/os';
import number from '@/filters/number';
import { defaultStore } from '@/store';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const render = (mutedWords) => mutedWords.map(x => {
	if (Array.isArray(x)) {
		return x.join(' ');
	} else {
		return x;
	}
}).join('\n');

const tab = ref('soft');
const softMutedWords = ref(render(defaultStore.state.mutedWords));
const hardMutedWords = ref(render($i!.mutedWords));
const hardWordMutedNotesCount = ref(null);
const changed = ref(false);

os.api('i/get-word-muted-notes-count', {}).then(response => {
	hardWordMutedNotesCount.value = response?.count;
});

watch(softMutedWords, () => {
	changed.value = true;
});

watch(hardMutedWords, () => {
	changed.value = true;
});

async function save() {
	const parseMutes = (mutes, tab) => {
		// split into lines, remove empty lines and unnecessary whitespace
		let lines = mutes.trim().split('\n').map(line => line.trim()).filter(line => line !== '');

		// check each line if it is a RegExp or not
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const regexp = line.match(/^\/(.+)\/(.*)$/);
			if (regexp) {
				// check that the RegExp is valid
				try {
					new RegExp(regexp[1], regexp[2]);
					// note that regex lines will not be split by spaces!
				} catch (err: any) {
					// invalid syntax: do not save, do not reset changed flag
					os.alert({
						type: 'error',
						title: i18n.ts.regexpError,
						text: i18n.t('regexpErrorDescription', { tab, line: i + 1 }) + '\n' + err.toString(),
					});
					// re-throw error so these invalid settings are not saved
					throw err;
				}
			} else {
				lines[i] = line.split(' ');
			}
		}

		return lines;
	};

	let softMutes, hardMutes;
	try {
		softMutes = parseMutes(softMutedWords.value, i18n.ts._wordMute.soft);
		hardMutes = parseMutes(hardMutedWords.value, i18n.ts._wordMute.hard);
	} catch (err) {
		// already displayed error message in parseMutes
		return;
	}

	defaultStore.set('mutedWords', softMutes);
	await os.api('i/update', {
		mutedWords: hardMutes,
	});

	changed.value = false;
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.wordMute,
	icon: 'ti ti-message-off',
});
</script>
