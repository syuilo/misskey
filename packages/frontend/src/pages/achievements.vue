<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	<MkSpacer :contentMax="1200">
		<MkAchievements :user="$i"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';
import MkAchievements from '@/components/MkAchievements.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';
import { claimAchievement } from '@/scripts/achievements';

let timer: number | null;

function viewAchievements3min() {
	claimAchievement('viewAchievements3min');
}

onMounted(() => {
	if (timer == null) timer = window.setTimeout(viewAchievements3min, 1000 * 60 * 3);
});

onUnmounted(() => {
	if (timer != null) {
		window.clearTimeout(timer);
		timer = null;
	}
});

onActivated(() => {
	if (timer == null) timer = window.setTimeout(viewAchievements3min, 1000 * 60 * 3);
});

onDeactivated(() => {
	if (timer != null) {
		window.clearTimeout(timer);
		timer = null;
	}
});

definePageMetadata({
	title: i18n.ts.achievements,
	icon: 'ti ti-medal',
});
</script>

<style lang="scss" module>

</style>
