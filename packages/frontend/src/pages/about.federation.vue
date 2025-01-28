<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div>
		<MkInput v-model="host" :debounce="true" class="">
			<template #prefix><i class="ti ti-search"></i></template>
			<template #label>{{ i18n.ts.host }}</template>
		</MkInput>
		<FormSplit style="margin-top: var(--MI-margin);">
			<MkSelect v-model="state">
				<template #label>{{ i18n.ts.state }}</template>
				<option value="all">{{ i18n.ts.all }}</option>
				<option value="federating">{{ i18n.ts.federating }}</option>
				<option value="subscribing">{{ i18n.ts.subscribing }}</option>
				<option value="publishing">{{ i18n.ts.publishing }}</option>
				<option value="suspended">{{ i18n.ts.suspended }}</option>
				<option value="silenced">{{ i18n.ts.silence }}</option>
				<option value="blocked">{{ i18n.ts.blocked }}</option>
				<option value="notResponding">{{ i18n.ts.notResponding }}</option>
			</MkSelect>
			<MkSelect v-model="sort">
				<template #label>{{ i18n.ts.sort }}</template>
				<option value="+pubSub">{{ i18n.ts.pubSub }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-pubSub">{{ i18n.ts.pubSub }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+notes">{{ i18n.ts.notes }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-notes">{{ i18n.ts.notes }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+users">{{ i18n.ts.users }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-users">{{ i18n.ts.users }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+following">{{ i18n.ts.following }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-following">{{ i18n.ts.following }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+followers">{{ i18n.ts.followers }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-followers">{{ i18n.ts.followers }} ({{ i18n.ts.ascendingOrder }})</option>
				<option value="+firstRetrievedAt">{{ i18n.ts.registeredAt }} ({{ i18n.ts.descendingOrder }})</option>
				<option value="-firstRetrievedAt">{{ i18n.ts.registeredAt }} ({{ i18n.ts.ascendingOrder }})</option>
			</MkSelect>
		</FormSplit>
	</div>

	<MkPagination v-slot="{items}" ref="instances" :key="host + state" :pagination="pagination">
		<div :class="$style.items">
			<MkA v-for="instance in items" :key="instance.id" v-tooltip.mfm="`Status: ${getStatus(instance)}`" :class="$style.item" :to="`/instance-info/${instance.host}`">
				<MkInstanceCardMini :instance="instance"/>
			</MkA>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import type { Paging } from '@/components/MkPagination.vue';
import MkInstanceCardMini from '@/components/MkInstanceCardMini.vue';
import FormSplit from '@/components/form/split.vue';
import { i18n } from '@/i18n.js';

const host = ref('');
const state = ref('federating');
const sort = ref('+pubSub');
const pagination = {
	endpoint: 'federation/instances' as const,
	limit: 10,
	displayLimit: 50,
	offsetMode: true,
	params: computed(() => ({
		sort: sort.value,
		host: host.value !== '' ? host.value : null,
		...(
			state.value === 'federating' ? { federating: true, suspended: false, blocked: false } :
			state.value === 'subscribing' ? { subscribing: true, suspended: false, blocked: false } :
			state.value === 'publishing' ? { publishing: true, suspended: false, blocked: false } :
			state.value === 'suspended' ? { suspended: true } :
			state.value === 'blocked' ? { blocked: true } :
			state.value === 'silenced' ? { silenced: true } :
			state.value === 'notResponding' ? { notResponding: true } :
			{}),
	})),
} as Paging;

function getStatus(instance) {
	if (instance.isSuspended) return 'Suspended';
	if (instance.isBlocked) return 'Blocked';
	if (instance.isSilenced) return 'Silenced';
	if (instance.isNotResponding) return 'Error';
	return 'Alive';
}
</script>

<style lang="scss" module>
.items {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;
}

.item:hover {
	text-decoration: none;
}
</style>
