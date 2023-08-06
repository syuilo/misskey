<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="tab === 'overview'" :contentMax="600" :marginMin="20">
		<div class="_gaps_m">
			<div :class="$style.banner" :style="{ backgroundImage: `url(${ instance.bannerUrl })` }">
				<div style="overflow: clip;">
					<img :src="instance.iconUrl ?? instance.faviconUrl ?? '/favicon.ico'" alt="" :class="$style.bannerIcon"/>
					<div :class="$style.bannerName">
						<b>{{ instance.name ?? host }}</b>
					</div>
				</div>
			</div>

			<MkKeyValue>
				<template #key>{{ i18n.ts.description }}</template>
				<template #value><div v-html="instance.description"></div></template>
			</MkKeyValue>

			<FormSection>
				<div class="_gaps_m">
					<MkKeyValue :copy="version">
						<template #key>Misskey</template>
						<template #value>{{ version }}</template>
					</MkKeyValue>
					<div v-html="i18n.t('poweredByMisskeyDescription', { name: instance.name ?? host })">
					</div>
					<FormLink to="/about-misskey">{{ i18n.ts.aboutMisskey }}</FormLink>
				</div>
			</FormSection>

			<FormSection>
				<div class="_gaps_m">
					<FormSplit>
						<MkKeyValue>
							<template #key>{{ i18n.ts.administrator }}</template>
							<template #value>{{ instance.maintainerName }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>{{ i18n.ts.contact }}</template>
							<template #value>{{ instance.maintainerEmail }}</template>
						</MkKeyValue>
					</FormSplit>
					<MkFolder v-if="instance.serverRules.length > 0">
						<template #label>{{ i18n.ts.serverRules }}</template>

						<ol class="_gaps_s" :class="$style.rules">
							<li v-for="item in instance.serverRules" :class="$style.rule"><div :class="$style.ruleText" v-html="item"></div></li>
						</ol>
					</MkFolder>
					<FormLink v-if="instance.tosUrl" :to="instance.tosUrl" external>{{ i18n.ts.termsOfService }}</FormLink>
				</div>
			</FormSection>

			<FormSuspense :p="initStats">
				<FormSection>
					<template #label>{{ i18n.ts.statistics }}</template>
					<FormSplit>
						<MkKeyValue>
							<template #key>{{ i18n.ts.users }}</template>
							<template #value>{{ number(stats.originalUsersCount) }}</template>
						</MkKeyValue>
						<MkKeyValue>
							<template #key>{{ i18n.ts.notes }}</template>
							<template #value>{{ number(stats.originalNotesCount) }}</template>
						</MkKeyValue>
					</FormSplit>
				</FormSection>
			</FormSuspense>

			<FormSection>
				<template #label>Well-known resources</template>
				<div class="_formLinks">
					<FormLink :to="`/.well-known/host-meta`" external>host-meta</FormLink>
					<FormLink :to="`/.well-known/host-meta.json`" external>host-meta.json</FormLink>
					<FormLink :to="`/.well-known/nodeinfo`" external>nodeinfo</FormLink>
					<FormLink :to="`/robots.txt`" external>robots.txt</FormLink>
					<FormLink :to="`/manifest.json`" external>manifest.json</FormLink>
				</div>
			</FormSection>
		</div>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'emojis'" :contentMax="1000" :marginMin="20">
		<XEmojis/>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'federation'" :contentMax="1000" :marginMin="20">
		<XFederation/>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'charts'" :contentMax="1000" :marginMin="20">
		<MkInstanceStats/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, watch } from 'vue';
import XEmojis from './about.emojis.vue';
import XFederation from './about.federation.vue';
import { version, host } from '@/config';
import FormLink from '@/components/form/link.vue';
import FormSection from '@/components/form/section.vue';
import FormSuspense from '@/components/form/suspense.vue';
import FormSplit from '@/components/form/split.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkInstanceStats from '@/components/MkInstanceStats.vue';
import * as os from '@/os';
import number from '@/filters/number';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { claimAchievement } from '@/scripts/achievements';
import { instance } from '@/instance';

const props = withDefaults(defineProps<{
	initialTab?: string;
}>(), {
	initialTab: 'overview',
});

let stats = $ref(null);
let tab = $ref(props.initialTab);

watch($$(tab), () => {
	if (tab === 'charts') {
		claimAchievement('viewInstanceChart');
	}
});

const initStats = () => os.api('stats', {
}).then((res) => {
	stats = res;
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
}, {
	key: 'emojis',
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
}, {
	key: 'federation',
	title: i18n.ts.federation,
	icon: 'ti ti-whirl',
}, {
	key: 'charts',
	title: i18n.ts.charts,
	icon: 'ti ti-chart-line',
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.instanceInfo,
	icon: 'ti ti-info-circle',
})));
</script>

<style lang="scss" module>
.banner {
	text-align: center;
	border-radius: 10px;
	overflow: clip;
	background-size: cover;
	background-position: center center;
}

.bannerIcon {
	display: block;
	margin: 16px auto 0 auto;
	height: 64px;
	border-radius: 8px;
}

.bannerName {
	display: block;
	padding: 16px;
	color: #fff;
	text-shadow: 0 0 8px #000;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.rules {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
}

.rule {
	display: flex;
	gap: 8px;
	word-break: break-word;

	&::before {
		flex-shrink: 0;
		display: flex;
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 8px);
		counter-increment: item;
		content: counter(item);
		width: 32px;
		height: 32px;
		line-height: 32px;
		background-color: var(--accentedBg);
		color: var(--accent);
		font-size: 13px;
		font-weight: bold;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
	}
}

.ruleText {
	padding-top: 6px;
}
</style>
