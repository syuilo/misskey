<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="600" :marginMin="16">
		<MkButton primary @click="createKey">{{ i18n.ts._registry.createKey }}</MkButton>

		<FormSection v-if="scopes">
			<template #label>{{ i18n.ts.system }}</template>
			<div class="_formLinks">
				<FormLink v-for="scope in scopes" :to="`/registry/keys/system/${scope.join('/')}`" class="_monospace">{{ scope.join('/') }}</FormLink>
			</div>
		</FormSection>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import JSON5 from 'json5';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';

let scopes = $ref(null);

function fetchScopes() {
	os.api('i/registry/scopes').then(res => {
		scopes = res.slice().sort((a, b) => a.join('/').localeCompare(b.join('/')));
	});
}

async function createKey() {
	const { canceled, result } = await os.form(i18n.ts._registry.createKey, {
		key: {
			type: 'string',
			label: i18n.ts._registry.key,
		},
		value: {
			type: 'string',
			multiline: true,
			label: i18n.ts.value,
		},
		scope: {
			type: 'string',
			label: i18n.ts._registry.scope,
		},
	});
	if (canceled) return;
	os.apiWithDialog('i/registry/set', {
		scope: result.scope.split('/'),
		key: result.key,
		value: JSON5.parse(result.value),
	}).then(() => {
		fetchScopes();
	});
}

fetchScopes();

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.registry,
	icon: 'ti ti-adjustments',
});
</script>
