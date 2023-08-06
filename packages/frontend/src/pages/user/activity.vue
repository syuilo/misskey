<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="700">
	<div class="_gaps">
		<MkFoldableSection class="item">
			<template #header><i class="ti ti-activity"></i> Heatmap</template>
			<XHeatmap :user="user" :src="'notes'"/>
		</MkFoldableSection>
		<MkFoldableSection class="item">
			<template #header><i class="ti ti-pencil"></i> Notes</template>
			<XNotes :user="user"/>
		</MkFoldableSection>
		<MkFoldableSection class="item">
			<template #header><i class="ti ti-users"></i> Following</template>
			<XFollowing :user="user"/>
		</MkFoldableSection>
		<MkFoldableSection class="item">
			<template #header><i class="ti ti-eye"></i> PV</template>
			<XPv :user="user"/>
		</MkFoldableSection>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import * as misskey from 'misskey-js';
import XHeatmap from './activity.heatmap.vue';
import XPv from './activity.pv.vue';
import XNotes from './activity.notes.vue';
import XFollowing from './activity.following.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';

const props = defineProps<{
	user: misskey.entities.User;
}>();

</script>
