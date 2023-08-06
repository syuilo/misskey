<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m">
	<FormSection first>
		<template #label>{{ i18n.ts.rolesAssignedToMe }}</template>
		<div class="_gaps_s">
			<MkRolePreview v-for="role in $i.roles" :key="role.id" :role="role" :forModeration="false"/>
		</div>
	</FormSection>
	<FormSection>
		<template #label>{{ i18n.ts._role.policies }}</template>
		<div class="_gaps_s">
			<div v-for="policy in Object.keys($i.policies)" :key="policy">
				{{ policy }} ... {{ $i.policies[policy] }}
			</div>
		</div>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, reactive, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSplit from '@/components/form/split.vue';
import MkFolder from '@/components/MkFolder.vue';
import FormSlot from '@/components/form/slot.vue';
import FormSection from '@/components/form/section.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { definePageMetadata } from '@/scripts/page-metadata';
import { defaultStore } from '@/store';
import MkRolePreview from '@/components/MkRolePreview.vue';

function save() {
	os.apiWithDialog('i/update', {

	});
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.roles,
	icon: 'ti ti-badges',
});
</script>

<style lang="scss" module>

</style>
