<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormLink :to="`/settings/webhook/new`">
		{{ i18n.ts._webhookSettings.createWebhook }}
	</FormLink>

	<FormSection>
		<MkPagination :pagination="pagination">
			<template #default="{items}">
				<div class="_gaps">
					<FormLink v-for="webhook in items" :key="webhook.id" :to="`/settings/webhook/edit/${webhook.id}`">
						<template #icon>
							<i v-if="webhook.active === false" class="ti ti-player-pause"></i>
							<i v-else-if="webhook.latestStatus === null" class="ti ti-circle"></i>
							<i v-else-if="[200, 201, 204].includes(webhook.latestStatus)" class="ti ti-check" :style="{ color: 'var(--success)' }"></i>
							<i v-else class="ti ti-alert-triangle" :style="{ color: 'var(--error)' }"></i>
						</template>
						{{ webhook.name || webhook.url }}
						<template #suffix>
							<MkTime v-if="webhook.latestSentAt" :time="webhook.latestSentAt"></MkTime>
						</template>
					</FormLink>
				</div>
			</template>
		</MkPagination>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'i/webhooks/list' as const,
	limit: 100,
	noPaging: true,
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: 'Webhook',
	icon: 'ti ti-webhook',
});
</script>
