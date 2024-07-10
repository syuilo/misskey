<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root" role="group" :aria-expanded="opened">
	<MkStickyContainer>
		<template #header>
			<MkHeaderButton
				:class="[$style.header, { [$style.opened]: opened }]"
				data-cy-folder-header
				@click="toggle"
			>
				<template v-if="$slots.icon" #icon><slot name="icon"></slot></template>
				<template #default><slot name="label"></slot></template>
				<template v-if="$slots.caption" #caption><slot name="caption"></slot></template>
				<template v-if="$slots.suffix" #suffix><slot name="suffix"></slot></template>
				<template #suffixIcon>
					<i v-if="opened" class="ti ti-chevron-up icon"></i>
					<i v-else class="ti ti-chevron-down icon"></i>
				</template>
			</MkHeaderButton>
		</template>

		<div v-if="openedAtLeastOnce" :class="[$style.body, { [$style.bgSame]: bgSame }]" :style="{ maxHeight: maxHeight ? `${maxHeight}px` : undefined, overflow: maxHeight ? `auto` : undefined }" :aria-hidden="!opened">
			<Transition
				:enterActiveClass="defaultStore.state.animation ? $style.transition_toggle_enterActive : ''"
				:leaveActiveClass="defaultStore.state.animation ? $style.transition_toggle_leaveActive : ''"
				:enterFromClass="defaultStore.state.animation ? $style.transition_toggle_enterFrom : ''"
				:leaveToClass="defaultStore.state.animation ? $style.transition_toggle_leaveTo : ''"
				@enter="enter"
				@afterEnter="afterEnter"
				@leave="leave"
				@afterLeave="afterLeave"
			>
				<KeepAlive>
					<div v-show="opened">
						<MkSpacer :marginMin="14" :marginMax="22">
							<slot></slot>
						</MkSpacer>
					</div>
				</KeepAlive>
			</Transition>
		</div>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, shallowRef, ref } from 'vue';
import { defaultStore } from '@/store.js';
import MkHeaderButton from '@/components/MkHeaderButton.vue';

const props = withDefaults(defineProps<{
	defaultOpen?: boolean;
	maxHeight?: number | null;
}>(), {
	defaultOpen: false,
	maxHeight: null,
});

const getBgColor = (el: HTMLElement) => {
	const style = window.getComputedStyle(el);
	if (style.backgroundColor && !['rgba(0, 0, 0, 0)', 'rgba(0,0,0,0)', 'transparent'].includes(style.backgroundColor)) {
		return style.backgroundColor;
	} else {
		return el.parentElement ? getBgColor(el.parentElement) : 'transparent';
	}
};

const rootEl = shallowRef<HTMLElement>();
const bgSame = ref(false);
const opened = ref(props.defaultOpen);
const openedAtLeastOnce = ref(props.defaultOpen);

function enter(el) {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = 0;
	el.offsetHeight; // reflow
	el.style.height = Math.min(elementHeight, props.maxHeight ?? Infinity) + 'px';
}

function afterEnter(el) {
	el.style.height = null;
}

function leave(el) {
	const elementHeight = el.getBoundingClientRect().height;
	el.style.height = elementHeight + 'px';
	el.offsetHeight; // reflow
	el.style.height = 0;
}

function afterLeave(el) {
	el.style.height = null;
}

function toggle() {
	if (!opened.value) {
		openedAtLeastOnce.value = true;
	}

	nextTick(() => {
		opened.value = !opened.value;
	});
}

onMounted(() => {
	const computedStyle = getComputedStyle(document.documentElement);
	const parentBg = getBgColor(rootEl.value!.parentElement!);
	const myBg = computedStyle.getPropertyValue('--panel');
	bgSame.value = parentBg === myBg;
});
</script>

<style lang="scss" module>
.transition_toggle_enterActive,
.transition_toggle_leaveActive {
	overflow-y: clip;
	transition: opacity 0.3s, height 0.3s, transform 0.3s !important;
}
.transition_toggle_enterFrom,
.transition_toggle_leaveTo {
	opacity: 0;
}

.root {
	display: block;
}

.header {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	transition: border-radius 0.3s;

	&.opened {
		border-radius: 6px 6px 0 0;
	}
}

.body {
	background: var(--panel);
	border-radius: 0 0 6px 6px;
	container-type: inline-size;

	&.bgSame {
		background: var(--bg);
	}
}
</style>
