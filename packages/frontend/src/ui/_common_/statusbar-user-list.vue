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
				<span v-for="note in notes" :key="note.id" :class="$style.item">
					<img :class="$style.avatar" :src="note.user.avatarUrl" decoding="async"/>
					<MkA :class="$style.text" :to="notePage(note)">
						<Mfm :text="getNoteSummary(note)" :plain="true" :nowrap="true"/>
					</MkA>
					<span :class="$style.divider"></span>
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
import { ref, watch } from 'vue';
import * as misskey from 'misskey-js';
import MarqueeText from '@/components/MkMarquee.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { getNoteSummary } from '@/scripts/get-note-summary';
import { notePage } from '@/filters/note';

const props = defineProps<{
	userListId?: string;
	display?: 'marquee' | 'oneByOne';
	marqueeDuration?: number;
	marqueeReverse?: boolean;
	oneByOneInterval?: number;
	refreshIntervalSec?: number;
}>();

const notes = ref<misskey.entities.Note[]>([]);
const fetching = ref(true);
let key = $ref(0);

const tick = () => {
	if (props.userListId == null) return;
	os.api('notes/user-list-timeline', {
		listId: props.userListId,
	}).then(res => {
		notes.value = res;
		fetching.value = false;
		key++;
	});
};

watch(() => props.userListId, tick);

useInterval(tick, Math.max(5000, props.refreshIntervalSec * 1000), {
	immediate: true,
	afterMounted: true,
});
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
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	margin: 0;
}

.avatar {
	display: inline-block;
	height: var(--height);
	aspect-ratio: 1;
	vertical-align: bottom;
	margin-right: 8px;
}

.text {
	display: inline-block;
	vertical-align: bottom;
}

.divider {
	display: inline-block;
	width: 0.5px;
	height: 16px;
	margin: 0 3em;
	background: currentColor;
	opacity: 0;
}
</style>
