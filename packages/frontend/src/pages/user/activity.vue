<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkSpacer :contentMax="700">
	<div class="_gaps">
		<MkFoldableSection class="item">
			<template #header><i class="ti ti-activity"></i> Heatmap</template>
			<MkHeatmap :user="user" :src="'notes'"/>
		</MkFoldableSection>
		<MkFoldableSection class="item">
			<template #header><i class="ti ti-pencil"></i> Notes</template>
			<XNotes :user="user"/>
		</MkFoldableSection>
		<MkFoldableSection
			v-if="isFollowersVisibleForMe(user) && isFollowingVisibleForMe(user)"
			class="item"
		>
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
import * as Misskey from 'misskey-js';
import XPv from './activity.pv.vue';
import XNotes from './activity.notes.vue';
import XFollowing from './activity.following.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkHeatmap from '@/components/MkHeatmap.vue';
import { isFollowersVisibleForMe, isFollowingVisibleForMe } from '@/scripts/isFfVisibleForMe.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

</script>
