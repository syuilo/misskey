<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label>{{ i18n.ts.password }}</template>
		<MkButton primary @click="change()">{{ i18n.ts.changePassword }}</MkButton>
	</FormSection>

	<X2fa/>

	<FormSection>
		<template #label>{{ i18n.ts.signinHistory }}</template>
		<MkPagination :pagination="pagination" disableAutoLoad>
			<template #default="{items}">
				<div>
					<div v-for="item in items" :key="item.id" v-panel class="timnmucd">
						<header>
							<i v-if="item.success" class="ti ti-check icon succ"></i>
							<i v-else class="ti ti-circle-x icon fail"></i>
							<code class="ip _monospace">{{ item.ip }}</code>
							<MkTime :time="item.createdAt" class="time"/>
						</header>
					</div>
				</div>
			</template>
		</MkPagination>
	</FormSection>

	<FormSection>
		<FormSlot>
			<MkButton danger @click="regenerateToken"><i class="ti ti-refresh"></i> {{ i18n.ts.regenerateLoginToken }}</MkButton>
			<template #caption>{{ i18n.ts.regenerateLoginTokenDescription }}</template>
		</FormSlot>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import X2fa from './2fa.vue';
import FormSection from '@/components/form/section.vue';
import FormSlot from '@/components/form/slot.vue';
import MkButton from '@/components/MkButton.vue';
import MkPagination from '@/components/MkPagination.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const pagination = {
	endpoint: 'i/signin-history' as const,
	limit: 5,
};

async function change() {
	const { canceled: canceled1, result: currentPassword } = await os.inputText({
		title: i18n.ts.currentPassword,
		type: 'password',
		autocomplete: 'current-password',
	});
	if (canceled1) return;

	const { canceled: canceled2, result: newPassword } = await os.inputText({
		title: i18n.ts.newPassword,
		type: 'password',
		autocomplete: 'new-password',
	});
	if (canceled2) return;

	const { canceled: canceled3, result: newPassword2 } = await os.inputText({
		title: i18n.ts.newPasswordRetype,
		type: 'password',
		autocomplete: 'new-password',
	});
	if (canceled3) return;

	if (newPassword !== newPassword2) {
		os.alert({
			type: 'error',
			text: i18n.ts.retypedNotMatch,
		});
		return;
	}

	os.apiWithDialog('i/change-password', {
		currentPassword,
		newPassword,
	});
}

function regenerateToken() {
	os.inputText({
		title: i18n.ts.password,
		type: 'password',
	}).then(({ canceled, result: password }) => {
		if (canceled) return;
		os.api('i/regenerate-token', {
			password: password,
		});
	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.security,
	icon: 'ti ti-lock',
});
</script>

<style lang="scss" scoped>
.timnmucd {
	padding: 12px;

	&:first-child {
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}

	&:last-child {
		border-bottom-left-radius: 6px;
		border-bottom-right-radius: 6px;
	}

	&:not(:last-child) {
		border-bottom: solid 0.5px var(--divider);
	}

	> header {
		display: flex;
		align-items: center;

		> .icon {
			width: 1em;
			margin-right: 0.75em;

			&.succ {
				color: var(--success);
			}

			&.fail {
				color: var(--error);
			}
		}

		> .ip {
			flex: 1;
			min-width: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-right: 12px;
		}

		> .time {
			margin-left: auto;
			opacity: 0.7;
		}
	}
}
</style>
