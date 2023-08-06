<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span v-if="!fetching" :class="$style.root">
	<template v-if="display === 'marquee'">
		<Transition
			:enterActiveClass="$style.transition_change_enterActive"
			:leaveActiveClass="$style.transition_change_leaveActive"
			:enterFromClass="$style.transition_change_enterFrom"
			:leaveToClass="$style.transition_change_leaveTo"
			mode="default"
		>
			<MarqueeText :key="key" :duration="marqueeDuration" :reverse="marqueeReverse">
				<span v-for="instance in instances" :key="instance.id" :class="[$style.item, { [$style.colored]: colored }]" :style="{ background: colored ? instance.themeColor : null }">
					<img :class="$style.icon" :src="getInstanceIcon(instance)" alt=""/>
					<MkA :to="`/instance-info/${instance.host}`" :class="$style.host" class="_monospace">
						{{ instance.host }}
					</MkA>
					<span></span>
				</span>
			</MarqueeText>
		</Transition>
	</template>
	<template v-else-if="display === 'oneByOne'">
		<!-- TODO -->
	</template>
</span>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref } from 'vue';
import * as misskey from 'misskey-js';
import MarqueeText from '@/components/MkMarquee.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy';

const props = defineProps<{
	display?: 'marquee' | 'oneByOne';
	colored?: boolean;
	marqueeDuration?: number;
	marqueeReverse?: boolean;
	oneByOneInterval?: number;
	refreshIntervalSec?: number;
}>();

const instances = ref<misskey.entities.Instance[]>([]);
const fetching = ref(true);
let key = $ref(0);

const tick = () => {
	os.api('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 30,
	}).then(res => {
		instances.value = res;
		fetching.value = false;
		key++;
	});
};

useInterval(tick, Math.max(5000, props.refreshIntervalSec * 1000), {
	immediate: true,
	afterMounted: true,
});

function getInstanceIcon(instance): string {
	return getProxiedImageUrlNullable(instance.iconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? '/client-assets/dummy.png';
}
</script>

<style lang="scss" module>
.transition_change_enterActive,
.transition_change_leaveActive {
	position: absolute;
	top: 0;
  transition: all 1s ease;
}
.transition_change_enterFrom {
	opacity: 0;
	transform: translateY(-100%);
}
.transition_change_leaveTo {
	opacity: 0;
	transform: translateY(100%);
}

.root {
	display: inline-block;
	position: relative;
}

.item {
	display: inline-block;
	vertical-align: bottom;
	margin-right: 5em;

	&.colored {
		padding-right: 1em;
		color: #fff;
	}
}

.icon {
	display: inline-block;
	height: var(--height);
	aspect-ratio: 1;
	vertical-align: bottom;
	margin-right: 1em;
}

.host {
	vertical-align: bottom;
}
</style>
