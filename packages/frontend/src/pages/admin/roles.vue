<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700">
			<div class="_gaps">
				<MkFolder>
					<template #label>{{ i18n.ts._role.baseRole }}</template>
					<template #footer>
						<MkButton primary rounded @click="updateBaseRole">{{ i18n.ts.save }}</MkButton>
					</template>
					<div class="_gaps_s">
						<MkInput v-model="baseRoleQ" type="search">
							<template #prefix><i class="ti ti-search"></i></template>
						</MkInput>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.rateLimitFactor, 'rateLimitFactor'])">
							<template #label>{{ i18n.ts._role._options.rateLimitFactor }}</template>
							<template #suffix>{{ Math.floor(policies.rateLimitFactor * 100) }}%</template>
							<MkRange :modelValue="policies.rateLimitFactor * 100" :min="30" :max="300" :step="10" :textConverter="(v) => `${v}%`" @update:modelValue="v => policies.rateLimitFactor = (v / 100)">
								<template #caption>{{ i18n.ts._role._options.descriptionOfRateLimitFactor }}</template>
							</MkRange>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.gtlAvailable, 'gtlAvailable'])">
							<template #label>{{ i18n.ts._role._options.gtlAvailable }}</template>
							<template #suffix>{{ policies.gtlAvailable ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.gtlAvailable">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.ltlAvailable, 'ltlAvailable'])">
							<template #label>{{ i18n.ts._role._options.ltlAvailable }}</template>
							<template #suffix>{{ policies.ltlAvailable ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.ltlAvailable">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canPublicNote, 'canPublicNote'])">
							<template #label>{{ i18n.ts._role._options.canPublicNote }}</template>
							<template #suffix>{{ policies.canPublicNote ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canPublicNote">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.mentionMax, 'mentionLimit'])">
							<template #label>{{ i18n.ts._role._options.mentionMax }}</template>
							<template #suffix>{{ policies.mentionLimit }}</template>
							<MkInput v-model="policies.mentionLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canInvite, 'canInvite'])">
							<template #label>{{ i18n.ts._role._options.canInvite }}</template>
							<template #suffix>{{ policies.canInvite ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canInvite">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.inviteLimit, 'inviteLimit'])">
							<template #label>{{ i18n.ts._role._options.inviteLimit }}</template>
							<template #suffix>{{ policies.inviteLimit }}</template>
							<MkInput v-model="policies.inviteLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.inviteLimitCycle, 'inviteLimitCycle'])">
							<template #label>{{ i18n.ts._role._options.inviteLimitCycle }}</template>
							<template #suffix>{{ policies.inviteLimitCycle + i18n.ts._time.minute }}</template>
							<MkInput v-model="policies.inviteLimitCycle" type="number">
								<template #suffix>{{ i18n.ts._time.minute }}</template>
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.inviteExpirationTime, 'inviteExpirationTime'])">
							<template #label>{{ i18n.ts._role._options.inviteExpirationTime }}</template>
							<template #suffix>{{ policies.inviteExpirationTime + i18n.ts._time.minute }}</template>
							<MkInput v-model="policies.inviteExpirationTime" type="number">
								<template #suffix>{{ i18n.ts._time.minute }}</template>
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canManageAvatarDecorations, 'canManageAvatarDecorations'])">
							<template #label>{{ i18n.ts._role._options.canManageAvatarDecorations }}</template>
							<template #suffix>{{ policies.canManageAvatarDecorations ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canManageAvatarDecorations">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canManageCustomEmojis, 'canManageCustomEmojis'])">
							<template #label>{{ i18n.ts._role._options.canManageCustomEmojis }}</template>
							<template #suffix>{{ policies.canManageCustomEmojis ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canManageCustomEmojis">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canSearchNotes, 'canSearchNotes'])">
							<template #label>{{ i18n.ts._role._options.canSearchNotes }}</template>
							<template #suffix>{{ policies.canSearchNotes ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canSearchNotes">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canUseTranslator, 'canSearchNotes'])">
							<template #label>{{ i18n.ts._role._options.canUseTranslator }}</template>
							<template #suffix>{{ policies.canUseTranslator ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canUseTranslator">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.driveCapacity, 'driveCapacityMb'])">
							<template #label>{{ i18n.ts._role._options.driveCapacity }}</template>
							<template #suffix>{{ policies.driveCapacityMb }}MB</template>
							<MkInput v-model="policies.driveCapacityMb" type="number">
								<template #suffix>MB</template>
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.alwaysMarkNsfw, 'alwaysMarkNsfw'])">
							<template #label>{{ i18n.ts._role._options.alwaysMarkNsfw }}</template>
							<template #suffix>{{ policies.alwaysMarkNsfw ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.alwaysMarkNsfw">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canUpdateBioMedia, 'canUpdateBioMedia'])">
							<template #label>{{ i18n.ts._role._options.canUpdateBioMedia }}</template>
							<template #suffix>{{ policies.canUpdateBioMedia ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canUpdateBioMedia">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.pinMax, 'pinLimit'])">
							<template #label>{{ i18n.ts._role._options.pinMax }}</template>
							<template #suffix>{{ policies.pinLimit }}</template>
							<MkInput v-model="policies.pinLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.antennaMax, 'antennaLimit'])">
							<template #label>{{ i18n.ts._role._options.antennaMax }}</template>
							<template #suffix>{{ policies.antennaLimit }}</template>
							<MkInput v-model="policies.antennaLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.wordMuteMax, 'wordMuteLimit'])">
							<template #label>{{ i18n.ts._role._options.wordMuteMax }}</template>
							<template #suffix>{{ policies.wordMuteLimit }}</template>
							<MkInput v-model="policies.wordMuteLimit" type="number">
								<template #suffix>chars</template>
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.webhookMax, 'webhookLimit'])">
							<template #label>{{ i18n.ts._role._options.webhookMax }}</template>
							<template #suffix>{{ policies.webhookLimit }}</template>
							<MkInput v-model="policies.webhookLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.clipMax, 'clipLimit'])">
							<template #label>{{ i18n.ts._role._options.clipMax }}</template>
							<template #suffix>{{ policies.clipLimit }}</template>
							<MkInput v-model="policies.clipLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.noteEachClipsMax, 'noteEachClipsLimit'])">
							<template #label>{{ i18n.ts._role._options.noteEachClipsMax }}</template>
							<template #suffix>{{ policies.noteEachClipsLimit }}</template>
							<MkInput v-model="policies.noteEachClipsLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.userListMax, 'userListLimit'])">
							<template #label>{{ i18n.ts._role._options.userListMax }}</template>
							<template #suffix>{{ policies.userListLimit }}</template>
							<MkInput v-model="policies.userListLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.userEachUserListsMax, 'userEachUserListsLimit'])">
							<template #label>{{ i18n.ts._role._options.userEachUserListsMax }}</template>
							<template #suffix>{{ policies.userEachUserListsLimit }}</template>
							<MkInput v-model="policies.userEachUserListsLimit" type="number">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canHideAds, 'canHideAds'])">
							<template #label>{{ i18n.ts._role._options.canHideAds }}</template>
							<template #suffix>{{ policies.canHideAds ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canHideAds">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.avatarDecorationLimit, 'avatarDecorationLimit'])">
							<template #label>{{ i18n.ts._role._options.avatarDecorationLimit }}</template>
							<template #suffix>{{ policies.avatarDecorationLimit }}</template>
							<MkInput v-model="avatarDecorationLimit" type="number" :min="0" :max="16" @update:modelValue="updateAvatarDecorationLimit">
							</MkInput>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canImportAntennas, 'canImportAntennas'])">
							<template #label>{{ i18n.ts._role._options.canImportAntennas }}</template>
							<template #suffix>{{ policies.canImportAntennas ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canImportAntennas">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canImportBlocking, 'canImportBlocking'])">
							<template #label>{{ i18n.ts._role._options.canImportBlocking }}</template>
							<template #suffix>{{ policies.canImportBlocking ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canImportBlocking">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canImportFollowing, 'canImportFollowing'])">
							<template #label>{{ i18n.ts._role._options.canImportFollowing }}</template>
							<template #suffix>{{ policies.canImportFollowing ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canImportFollowing">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canImportMuting, 'canImportMuting'])">
							<template #label>{{ i18n.ts._role._options.canImportMuting }}</template>
							<template #suffix>{{ policies.canImportMuting ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canImportMuting">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>

						<MkFolder v-if="matchQuery([i18n.ts._role._options.canImportUserLists, 'canImportUserList'])">
							<template #label>{{ i18n.ts._role._options.canImportUserLists }}</template>
							<template #suffix>{{ policies.canImportUserLists ? i18n.ts.yes : i18n.ts.no }}</template>
							<MkSwitch v-model="policies.canImportUserLists">
								<template #label>{{ i18n.ts.enable }}</template>
							</MkSwitch>
						</MkFolder>
					</div>
				</MkFolder>
				<MkButton primary rounded @click="create"><i class="ti ti-plus"></i> {{ i18n.ts._role.new }}</MkButton>
				<div class="_gaps_s">
					<MkFoldableSection>
						<template #header>{{ i18n.ts._role.manualRoles }}</template>
						<div class="_gaps_s">
							<MkRolePreview v-for="role in roles.filter(x => x.target === 'manual')" :key="role.id" :role="role" :forModeration="true"/>
						</div>
					</MkFoldableSection>
					<MkFoldableSection>
						<template #header>{{ i18n.ts._role.conditionalRoles }}</template>
						<div class="_gaps_s">
							<MkRolePreview v-for="role in roles.filter(x => x.target === 'conditional')" :key="role.id" :role="role" :forModeration="true"/>
						</div>
					</MkFoldableSection>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { ROLE_POLICIES } from '@@/js/const.js';
import XHeader from './_header_.vue';
import MkInput from '@/components/MkInput.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';
import MkRange from '@/components/MkRange.vue';
import MkRolePreview from '@/components/MkRolePreview.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { instance, fetchInstance } from '@/instance.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();
const baseRoleQ = ref('');

const roles = await misskeyApi('admin/roles/list');

const policies = reactive<Record<typeof ROLE_POLICIES[number], any>>({});
for (const ROLE_POLICY of ROLE_POLICIES) {
	policies[ROLE_POLICY] = instance.policies[ROLE_POLICY];
}

const avatarDecorationLimit = computed({
	get: () => Math.min(16, Math.max(0, policies.avatarDecorationLimit)),
	set: (value) => {
		policies.avatarDecorationLimit = Math.min(Number(value), 16);
	},
});

function updateAvatarDecorationLimit(value: string | number) {
	avatarDecorationLimit.value = Number(value);
}

function matchQuery(keywords: string[]): boolean {
	if (baseRoleQ.value.trim().length === 0) return true;
	return keywords.some(keyword => keyword.toLowerCase().includes(baseRoleQ.value.toLowerCase()));
}

async function updateBaseRole() {
	await os.apiWithDialog('admin/roles/update-default-policies', {
		policies,
	});
	fetchInstance(true);
}

function create() {
	router.push('/admin/roles/new');
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.roles,
	icon: 'ti ti-badges',
}));
</script>

<style lang="scss" module>

</style>
