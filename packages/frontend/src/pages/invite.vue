<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader/>
	</template>
	<MKSpacer v-if="!instance.disableRegistration || !($i && ($i.isAdmin || $i.policies.canInvite))" :contentMax="1200">
		<div :class="$style.root">
			<img :class="$style.img" :src="serverErrorImageUrl" class="_ghost"/>
			<div :class="$style.text">
				<i class="ti ti-alert-triangle"></i>
				{{ i18n.ts.nothing }}
			</div>
		</div>
	</MKSpacer>
	<MkSpacer v-else :contentMax="800">
		<div class="_gaps_m" style="text-align: center;">
			<div v-if="resetCycle && inviteLimit">{{ i18n.t('inviteLimitResetCycle', { time: resetCycle, limit: inviteLimit }) }}</div>
			<MkButton inline primary rounded :disabled="currentInviteLimit !== null && currentInviteLimit <= 0" @click="create"><i class="ti ti-user-plus"></i> {{ i18n.ts.createInviteCode }}</MkButton>
			<div v-if="currentInviteLimit !== null">{{ i18n.t('createLimitRemaining', { limit: currentInviteLimit }) }}</div>

			<MkPagination ref="pagingComponent" :pagination="pagination">
				<template #default="{ items }">
					<div class="_gaps_s">
						<MkInviteCode v-for="item in (items as Invite[])" :key="item.id" :invite="item" :onDeleted="deleted"/>
					</div>
				</template>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, ref, shallowRef } from 'vue';
import type { Invite } from 'misskey-js/built/entities';
import { i18n } from '@/i18n';
import * as os from '@/os';
import MkButton from '@/components/MkButton.vue';
import MkPagination, { Paging } from '@/components/MkPagination.vue';
import MkInviteCode from '@/components/MkInviteCode.vue';
import { definePageMetadata } from '@/scripts/page-metadata';
import { serverErrorImageUrl, instance } from '@/instance';
import { $i } from '@/account';

const pagingComponent = shallowRef<InstanceType<typeof MkPagination>>();
const currentInviteLimit = ref<null | number>(null);
const inviteLimit = (($i != null && $i.policies.inviteLimit) || (($i == null && instance.policies.inviteLimit))) as number;
const inviteLimitCycle = (($i != null && $i.policies.inviteLimitCycle) || ($i == null && instance.policies.inviteLimitCycle)) as number;

const pagination: Paging = {
	endpoint: 'invite/list' as const,
	limit: 10,
};

const resetCycle = computed<null | string>(() => {
	if (!inviteLimitCycle) return null;

	const minutes = inviteLimitCycle;
	if (minutes < 60) return minutes + i18n.ts._time.minute;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return hours + i18n.ts._time.hour;
	return Math.floor(hours / 24) + i18n.ts._time.day;
});

async function create() {
	const ticket = await os.api('invite/create');
	os.alert({
		type: 'success',
		title: i18n.ts.inviteCodeCreated,
		text: ticket.code,
	});

	pagingComponent.value?.prepend(ticket);
	update();
}

function deleted(id: string) {
	if (pagingComponent.value) {
		pagingComponent.value.items.delete(id);
	}
	update();
}

async function update() {
	currentInviteLimit.value = (await os.api('invite/limit')).remaining;
}

update();

definePageMetadata({
	title: i18n.ts.invite,
	icon: 'ti ti-user-plus',
});
</script>

<style lang="scss" module>
.root {
	padding: 32px;
	text-align: center;
	align-items: center;
}

.text {
	margin: 0 0 8px 0;
}

.img {
	vertical-align: bottom;
	width: 128px;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}
</style>
