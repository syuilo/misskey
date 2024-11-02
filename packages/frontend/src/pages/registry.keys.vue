<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="600" :marginMin="16">
		<div class="_gaps_m">
			<FormSplit>
				<MkKeyValue>
					<template #key>{{ i18n.ts._registry.domain }}</template>
					<template #value>{{ props.domain === '@' ? i18n.ts.system : props.domain.toUpperCase() }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts._registry.scope }}</template>
					<template #value>{{ scope.join('/') }}</template>
				</MkKeyValue>
			</FormSplit>

			<MkButton primary @click="createKey">{{ i18n.ts._registry.createKey }}</MkButton>

			<FormSection v-if="keys">
				<template #label>{{ i18n.ts.keys }}</template>
				<div class="_gaps_s">
					<FormLink v-for="key in keys" :to="`/registry/value/${props.domain}/${scope.join('/')}/${key[0]}`" class="_monospace">{{ key[0] }}<template #suffix>{{ key[1].toUpperCase() }}</template></FormLink>
				</div>
			</FormSection>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { watch, computed, ref } from 'vue';
import JSON5 from 'json5';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import MkButton from '@/components/MkButton.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import FormSplit from '@/components/form/split.vue';

const props = defineProps<{
	path: string;
	domain: string;
}>();

const scope = computed(() => props.path ? props.path.split('/') : []);

const keys = ref<[string, string][]>([]);

function fetchKeys() {
	misskeyApi('i/registry/keys-with-type', {
		scope: scope.value,
		domain: props.domain === '@' ? null : props.domain,
	}).then(res => {
		keys.value = Object.entries(res).sort((a, b) => a[0].localeCompare(b[0]));
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
			default: scope.value.join('/'),
		},
	});
	if (canceled) return;
	os.apiWithDialog('i/registry/set', {
		scope: result.scope.split('/'),
		key: result.key,
		value: JSON5.parse(result.value),
	}).then(() => {
		fetchKeys();
	});
}

watch(() => props.path, fetchKeys, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.registry,
	icon: 'ti ti-adjustments',
}));
</script>
