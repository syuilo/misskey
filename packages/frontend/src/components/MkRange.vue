<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="timctyfi" :class="{ disabled, easing }">
	<div class="label"><slot name="label"></slot></div>
	<div v-adaptive-border class="body">
		<div ref="containerEl" class="container">
			<div class="track">
				<div class="highlight" :style="{ width: (steppedRawValue * 100) + '%' }"></div>
			</div>
			<div v-if="steps && showTicks" class="ticks">
				<div v-for="i in (steps + 1)" class="tick" :style="{ left: (((i - 1) / steps) * 100) + '%' }"></div>
			</div>
			<div ref="thumbEl" v-tooltip="textConverter(finalValue)" class="thumb" :style="{ left: thumbPosition + 'px' }" @mousedown="onMousedown" @touchstart="onMousedown"></div>
		</div>
	</div>
	<div class="caption"><slot name="caption"></slot></div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch, shallowRef } from 'vue';
import * as os from '@/os';

const props = withDefaults(defineProps<{
	modelValue: number;
	disabled?: boolean;
	min: number;
	max: number;
	step?: number;
	textConverter?: (value: number) => string,
	showTicks?: boolean;
	easing?: boolean;
}>(), {
	step: 1,
	textConverter: (v) => v.toString(),
	easing: false,
});

const emit = defineEmits<{
	(ev: 'update:modelValue', value: number): void;
}>();

const containerEl = shallowRef<HTMLElement>();
const thumbEl = shallowRef<HTMLElement>();

const rawValue = ref((props.modelValue - props.min) / (props.max - props.min));
const steppedRawValue = computed(() => {
	if (props.step) {
		const step = props.step / (props.max - props.min);
		return (step * Math.round(rawValue.value / step));
	} else {
		return rawValue.value;
	}
});
const finalValue = computed(() => {
	if (Number.isInteger(props.step)) {
		return Math.round((steppedRawValue.value * (props.max - props.min)) + props.min);
	} else {
		return (steppedRawValue.value * (props.max - props.min)) + props.min;
	}
});

const getThumbWidth = () => {
	if (thumbEl.value == null) return 0;
	return thumbEl.value!.offsetWidth;
};
const thumbPosition = ref(0);
const calcThumbPosition = () => {
	if (containerEl.value == null) {
		thumbPosition.value = 0;
	} else {
		thumbPosition.value = (containerEl.value.offsetWidth - getThumbWidth()) * steppedRawValue.value;
	}
};
watch([steppedRawValue, containerEl], calcThumbPosition);

let ro: ResizeObserver | undefined;

onMounted(() => {
	ro = new ResizeObserver((entries, observer) => {
		calcThumbPosition();
	});
	ro.observe(containerEl.value);
});

onUnmounted(() => {
	if (ro) ro.disconnect();
});

const steps = computed(() => {
	if (props.step) {
		return (props.max - props.min) / props.step;
	} else {
		return 0;
	}
});

const onMousedown = (ev: MouseEvent | TouchEvent) => {
	ev.preventDefault();

	const tooltipShowing = ref(true);
	os.popup(defineAsyncComponent(() => import('@/components/MkTooltip.vue')), {
		showing: tooltipShowing,
		text: computed(() => {
			return props.textConverter(finalValue.value);
		}),
		targetElement: thumbEl,
	}, {}, 'closed');

	const style = document.createElement('style');
	style.appendChild(document.createTextNode('* { cursor: grabbing !important; } body * { pointer-events: none !important; }'));
	document.head.appendChild(style);

	const thumbWidth = getThumbWidth();

	const onDrag = (ev: MouseEvent | TouchEvent) => {
		ev.preventDefault();
		const containerRect = containerEl.value!.getBoundingClientRect();
		const pointerX = ev.touches && ev.touches.length > 0 ? ev.touches[0].clientX : ev.clientX;
		const pointerPositionOnContainer = pointerX - (containerRect.left + (thumbWidth / 2));
		rawValue.value = Math.min(1, Math.max(0, pointerPositionOnContainer / (containerEl.value!.offsetWidth - thumbWidth)));
	};

	let beforeValue = finalValue.value;

	const onMouseup = () => {
		document.head.removeChild(style);
		tooltipShowing.value = false;
		window.removeEventListener('mousemove', onDrag);
		window.removeEventListener('touchmove', onDrag);
		window.removeEventListener('mouseup', onMouseup);
		window.removeEventListener('touchend', onMouseup);

		// 値が変わってたら通知
		if (beforeValue !== finalValue.value) {
			emit('update:modelValue', finalValue.value);
		}
	};

	window.addEventListener('mousemove', onDrag);
	window.addEventListener('touchmove', onDrag);
	window.addEventListener('mouseup', onMouseup, { once: true });
	window.addEventListener('touchend', onMouseup, { once: true });
};
</script>

<style lang="scss" scoped>
@use "sass:math";

.timctyfi {
	position: relative;

	> .label {
		font-size: 0.85em;
		padding: 0 0 8px 0;
		user-select: none;

		&:empty {
			display: none;
		}
	}

	> .caption {
		font-size: 0.85em;
		padding: 8px 0 0 0;
		color: var(--fgTransparentWeak);

		&:empty {
			display: none;
		}
	}

	$thumbHeight: 20px;
	$thumbWidth: 20px;

	> .body {
		padding: 7px 12px;
		background: var(--panel);
		border: solid 1px var(--panel);
		border-radius: 6px;

		> .container {
			position: relative;
			height: $thumbHeight;

			> .track {
				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
				margin: auto;
				width: calc(100% - #{$thumbWidth});
				height: 3px;
				background: rgba(0, 0, 0, 0.1);
				border-radius: 999px;
				overflow: clip;

				> .highlight {
					position: absolute;
					top: 0;
					left: 0;
					height: 100%;
					background: var(--accent);
					opacity: 0.5;
				}
			}

			> .ticks {
				$tickWidth: 3px;

				position: absolute;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
				margin: auto;
				width: calc(100% - #{$thumbWidth});

				> .tick {
					position: absolute;
					bottom: 0;
					width: $tickWidth;
					height: 3px;
					margin-left: - math.div($tickWidth, 2);
					background: var(--divider);
					border-radius: 999px;
				}
			}

			> .thumb {
				position: absolute;
				width: $thumbWidth;
				height: $thumbHeight;
				cursor: grab;
				background: var(--accent);
				border-radius: 999px;

				&:hover {
					background: var(--accentLighten);
				}
			}
		}
	}

	&.easing {
		> .body {
			> .container {
				> .track {
					> .highlight {
						transition: width 0.2s cubic-bezier(0,0,0,1);
					}
				}

				> .thumb {
					transition: left 0.2s cubic-bezier(0,0,0,1);
				}
			}
		}
	}
}
</style>
