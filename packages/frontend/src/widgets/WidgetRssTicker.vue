<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="widgetProps.showHeader" class="mkw-rss-ticker">
	<template #icon><i class="ti ti-rss"></i></template>
	<template #header>RSS</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configure"><i class="ti ti-settings"></i></button></template>

	<div :class="$style.feed">
		<div v-if="fetching" :class="$style.loading">
			<MkEllipsis/>
		</div>
		<div v-else>
			<Transition :name="$style.change" mode="default" appear>
				<MarqueeText :key="key" :duration="widgetProps.duration" :reverse="widgetProps.reverse">
					<span v-for="item in items" :key="item.link" :class="$style.item">
						<a :href="item.link" rel="nofollow noopener" target="_blank" :title="item.title">{{ item.title }}</a><span :class="$style.divider"></span>
					</span>
				</MarqueeText>
			</Transition>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import MarqueeText from '@/components/MkMarquee.vue';
import { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { shuffle } from '@/scripts/shuffle.js';
import { url as base } from '@@/js/config.js';
import { useInterval } from '@@/js/use-interval.js';

const name = 'rssTicker';

const widgetPropsDef = {
	url: {
		type: 'string' as const,
		default: 'http://feeds.afpbb.com/rss/afpbb/afpbbnews',
	},
	shuffle: {
		type: 'boolean' as const,
		default: true,
	},
	refreshIntervalSec: {
		type: 'number' as const,
		default: 60,
	},
	maxEntries: {
		type: 'number' as const,
		default: 15,
	},
	duration: {
		type: 'range' as const,
		default: 70,
		step: 1,
		min: 5,
		max: 200,
	},
	reverse: {
		type: 'boolean' as const,
		default: false,
	},
	showHeader: {
		type: 'boolean' as const,
		default: false,
	},
	transparent: {
		type: 'boolean' as const,
		default: false,
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
const items = computed(() => {
	const newItems = rawItems.value.slice(0, widgetProps.maxEntries);
	if (widgetProps.shuffle) {
		shuffle(newItems);
	}
	return newItems;
});
const fetching = ref(true);
const fetchEndpoint = computed(() => {
	const url = new URL('/api/fetch-rss', base);
	url.searchParams.set('url', encodeURIComponent(widgetProps.url));
	return url;
});
const intervalClear = ref<(() => void) | undefined>();

const key = ref(0);

const tick = () => {
	if (document.visibilityState === 'hidden' && rawItems.value.length !== 0) return;

	window.fetch(fetchEndpoint.value, {})
		.then(res => res.json())
		.then((feed: Misskey.entities.FetchRssResponse) => {
			rawItems.value = feed.items;
			fetching.value = false;
			key.value++;
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
.change {
	&:global(-enter-active),
	&:global(-leave-active) {
		position: absolute;
		top: 0;
		transition: all 1s ease;
	}
	&:global(-enter-from) {
		opacity: 0;
		transform: translateY(-100%);
	}
	&:global(-leave-to) {
		opacity: 0;
		transform: translateY(100%);
	}
}

.feed {
	--height: 42px;
	padding: 0;
	font-size: 0.9em;
	line-height: var(--height);
	height: var(--height);
	contain: strict;
}

.loading {
	text-align: center;
}

.item {
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	color: var(--MI_THEME-fg);
}

.divider {
	display: inline-block;
	width: 0.5px;
	height: 16px;
	margin: 0 1em;
	background: var(--MI_THEME-divider);
}
</style>
