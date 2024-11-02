<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" data-cy-mkw-rss class="mkw-rss">
	<template #icon><i class="ti ti-rss"></i></template>
	<template #header>RSS</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configure"><i class="ti ti-settings"></i></button></template>

	<div class="ekmkgxbj">
		<MkLoading v-if="fetching"/>
		<div v-else-if="(!items || items.length === 0) && widgetProps.showHeader" class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.nothing }}</div>
		</div>
		<div v-else :class="$style.feed">
			<a v-for="item in items" :key="item.link" :class="$style.item" :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { url as base } from '@@/js/config.js';
import { i18n } from '@/i18n.js';
import { useInterval } from '@@/js/use-interval.js';
import { infoImageUrl } from '@/instance.js';

const name = 'rss';

const widgetPropsDef = {
	url: {
		type: 'string' as const,
		default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
	},
	refreshIntervalSec: {
		type: 'number' as const,
		default: 60,
	},
	maxEntries: {
		type: 'number' as const,
		default: 15,
	},
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const rawItems = ref<Misskey.entities.FetchRssResponse['items']>([]);
const items = computed(() => rawItems.value.slice(0, widgetProps.maxEntries));
const fetching = ref(true);
const fetchEndpoint = computed(() => {
	const url = new URL('/api/fetch-rss', base);
	url.searchParams.set('url', encodeURIComponent(widgetProps.url));
	return url;
});
const intervalClear = ref<(() => void) | undefined>();

const tick = () => {
	if (document.visibilityState === 'hidden' && rawItems.value.length !== 0) return;

	window.fetch(fetchEndpoint.value, {})
		.then(res => res.json())
		.then((feed: Misskey.entities.FetchRssResponse) => {
			rawItems.value = feed.items;
			fetching.value = false;
		});
};

watch(() => fetchEndpoint, tick);
watch(() => widgetProps.refreshIntervalSec, () => {
	if (intervalClear.value) {
		intervalClear.value();
	}
	intervalClear.value = useInterval(tick, Math.max(10000, widgetProps.refreshIntervalSec * 1000), {
		immediate: true,
		afterMounted: true,
	});
}, { immediate: true });

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.feed {
	padding: 0;
	font-size: 0.9em;
}

.item {
	display: block;
	padding: 8px 16px;
	color: var(--MI_THEME-fg);
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;

	&:nth-child(even) {
		background: rgba(#000, 0.05);
	}
}
</style>
