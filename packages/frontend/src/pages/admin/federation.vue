<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions"/></template>
		<MkSpacer :contentMax="900">
			<div class="_gaps">
				<div>
					<MkInput v-model="host" :debounce="true" class="">
						<template #prefix><i class="ti ti-search"></i></template>
						<template #label>{{ i18n.ts.host }}</template>
					</MkInput>
					<FormSplit style="margin-top: var(--margin);">
						<MkSelect v-model="state">
							<template #label>{{ i18n.ts.state }}</template>
							<option value="all">{{ i18n.ts.all }}</option>
							<option value="federating">{{ i18n.ts.federating }}</option>
							<option value="subscribing">{{ i18n.ts.subscribing }}</option>
							<option value="publishing">{{ i18n.ts.publishing }}</option>
							<option value="suspended">{{ i18n.ts.suspended }}</option>
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
					<div :class="$style.instances">
						<MkA v-for="instance in items" :key="instance.id" v-tooltip.mfm="`Status: ${getStatus(instance)}`" :class="$style.instance" :to="`/instance-info/${instance.host}`">
							<MkInstanceCardMini :instance="instance"/>
						</MkA>
					</div>
				</MkPagination>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';
import XHeader from './_header_.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkInstanceCardMini from '@/components/MkInstanceCardMini.vue';
import FormSplit from '@/components/form/split.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let host = $ref('');
let state = $ref('federating');
let sort = $ref('+pubSub');
const pagination = {
	endpoint: 'federation/instances' as const,
	limit: 10,
	offsetMode: true,
	params: computed(() => ({
		sort: sort,
		host: host !== '' ? host : null,
		...(
			state === 'federating' ? { federating: true } :
			state === 'subscribing' ? { subscribing: true } :
			state === 'publishing' ? { publishing: true } :
			state === 'suspended' ? { suspended: true } :
			state === 'blocked' ? { blocked: true } :
			state === 'notResponding' ? { notResponding: true } :
			{}),
	})),
};

function getStatus(instance) {
	if (instance.isSuspended) return 'Suspended';
	if (instance.isBlocked) return 'Blocked';
	if (instance.isNotResponding) return 'Error';
	return 'Alive';
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.federation,
	icon: 'ti ti-whirl',
})));
</script>

<style lang="scss" module>
.instances {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
	grid-gap: 12px;
}

.instance:hover {
	text-decoration: none;
}
</style>
