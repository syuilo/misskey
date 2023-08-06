<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="600" :marginMin="16" :marginMax="32">
			<XEditor v-if="data" v-model="data"/>
		</MkSpacer>
		<template #footer>
			<div :class="$style.footer">
				<MkSpacer :contentMax="600" :marginMin="16" :marginMax="16">
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				</MkSpacer>
			</div>
		</template>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';
import { v4 as uuid } from 'uuid';
import XHeader from './_header_.vue';
import XEditor from './roles.editor.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { useRouter } from '@/router';
import MkButton from '@/components/MkButton.vue';
import { rolesCache } from '@/cache';

const router = useRouter();

const props = defineProps<{
	id?: string;
}>();

let role = $ref(null);
let data = $ref(null);

if (props.id) {
	role = await os.api('admin/roles/show', {
		roleId: props.id,
	});

	data = role;
} else {
	data = {
		name: 'New Role',
		description: '',
		isAdministrator: false,
		isModerator: false,
		color: null,
		iconUrl: null,
		target: 'manual',
		condFormula: { id: uuid(), type: 'isRemote' },
		isPublic: false,
		isExplorable: false,
		asBadge: false,
		canEditMembersByModerator: false,
		displayOrder: 0,
		policies: {},
	};
}

async function save() {
	rolesCache.delete();
	if (role) {
		os.apiWithDialog('admin/roles/update', {
			roleId: role.id,
			...data,
		});
		router.push('/admin/roles/' + role.id);
	} else {
		const created = await os.apiWithDialog('admin/roles/create', {
			...data,
		});
		router.push('/admin/roles/' + created.id);
	}
}

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => role ? {
	title: i18n.ts._role.edit + ': ' + role.name,
	icon: 'ti ti-badge',
} : {
	title: i18n.ts._role.new,
	icon: 'ti ti-badge',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
