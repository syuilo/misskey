<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	v-if="!link"
	ref="el" class="_button"
	:class="[$style.root, { [$style.inline]: inline, [$style.primary]: primary, [$style.gradate]: gradate, [$style.danger]: danger, [$style.rounded]: rounded, [$style.full]: full, [$style.small]: small, [$style.large]: large, [$style.transparent]: transparent, [$style.asLike]: asLike }]"
	:type="type"
	:name="name"
	:value="value"
	@click="emit('click', $event)"
	@mousedown="onMousedown"
>
	<div ref="ripples" :class="$style.ripples" :data-children-class="$style.ripple"></div>
	<div :class="$style.content">
		<slot></slot>
	</div>
</button>
<MkA
	v-else class="_button"
	:class="[$style.root, { [$style.inline]: inline, [$style.primary]: primary, [$style.gradate]: gradate, [$style.danger]: danger, [$style.rounded]: rounded, [$style.full]: full, [$style.small]: small, [$style.large]: large, [$style.transparent]: transparent, [$style.asLike]: asLike }]"
	:to="to"
	@mousedown="onMousedown"
>
	<div ref="ripples" :class="$style.ripples" :data-children-class="$style.ripple"></div>
	<div :class="$style.content">
		<slot></slot>
	</div>
</MkA>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { nextTick, onMounted } from 'vue';

const props = defineProps<{
	type?: 'button' | 'submit' | 'reset';
	primary?: boolean;
	gradate?: boolean;
	rounded?: boolean;
	inline?: boolean;
	link?: boolean;
	to?: string;
	autofocus?: boolean;
	wait?: boolean;
	danger?: boolean;
	full?: boolean;
	small?: boolean;
	large?: boolean;
	transparent?: boolean;
	asLike?: boolean;
	name?: string;
	value?: string;
}>();

const emit = defineEmits<{
	(ev: 'click', payload: MouseEvent): void;
}>();

let el = $shallowRef<HTMLElement | null>(null);
let ripples = $shallowRef<HTMLElement | null>(null);

onMounted(() => {
	if (props.autofocus) {
		nextTick(() => {
			el!.focus();
		});
	}
});

function distance(p, q): number {
	return Math.hypot(p.x - q.x, p.y - q.y);
}

function calcCircleScale(boxW, boxH, circleCenterX, circleCenterY): number {
	const origin = { x: circleCenterX, y: circleCenterY };
	const dist1 = distance({ x: 0, y: 0 }, origin);
	const dist2 = distance({ x: boxW, y: 0 }, origin);
	const dist3 = distance({ x: 0, y: boxH }, origin);
	const dist4 = distance({ x: boxW, y: boxH }, origin);
	return Math.max(dist1, dist2, dist3, dist4) * 2;
}

function onMousedown(evt: MouseEvent): void {
	const target = evt.target! as HTMLElement;
	const rect = target.getBoundingClientRect();

	const ripple = document.createElement('div');
	ripple.classList.add(ripples!.dataset.childrenClass!);
	ripple.style.top = (evt.clientY - rect.top - 1).toString() + 'px';
	ripple.style.left = (evt.clientX - rect.left - 1).toString() + 'px';

	ripples!.appendChild(ripple);

	const circleCenterX = evt.clientX - rect.left;
	const circleCenterY = evt.clientY - rect.top;

	const scale = calcCircleScale(target.clientWidth, target.clientHeight, circleCenterX, circleCenterY);

	window.setTimeout(() => {
		ripple.style.transform = 'scale(' + (scale / 2) + ')';
	}, 1);
	window.setTimeout(() => {
		ripple.style.transition = 'all 1s ease';
		ripple.style.opacity = '0';
	}, 1000);
	window.setTimeout(() => {
		if (ripples) ripples.removeChild(ripple);
	}, 2000);
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	z-index: 1; // 他コンポーネントのbox-shadowに隠されないようにするため
	display: block;
	min-width: 100px;
	width: max-content;
	padding: 7px 14px;
	text-align: center;
	font-weight: normal;
	font-size: 95%;
	box-shadow: none;
	text-decoration: none;
	background: var(--buttonBg);
	border-radius: 5px;
	overflow: clip;
	box-sizing: border-box;
	transition: background 0.1s ease;

	&:not(:disabled):hover {
		background: var(--buttonHoverBg);
	}

	&:not(:disabled):active {
		background: var(--buttonHoverBg);
	}

	&.small {
		font-size: 90%;
		padding: 6px 12px;
	}

	&.large {
		font-size: 100%;
		padding: 8px 16px;
	}

	&.full {
		width: 100%;
	}

	&.rounded {
		border-radius: 999px;
	}

	&.primary {
		font-weight: bold;
		color: var(--fgOnAccent) !important;
		background: var(--accent);

		&:not(:disabled):hover {
			background: var(--X8);
		}

		&:not(:disabled):active {
			background: var(--X8);
		}
	}

	&.asLike {
		background: rgba(255, 86, 125, 0.07);
		color: #ff002f;

		&:not(:disabled):hover {
			background: rgba(255, 74, 116, 0.11);
		}

		&:not(:disabled):active {
			background: rgba(224, 57, 96, 0.125);
		}

		> .ripples {
			> .ripple {
				background: rgba(255, 60, 106, 0.15);
			}
		}

		&.primary {
			background: rgb(241 97 132);

			&:not(:disabled):hover {
				background: rgb(241 92 128);
			}

			&:not(:disabled):active {
				background: rgb(241 92 128);
			}
		}
	}

	&.transparent {
		background: transparent;
	}

	&.gradate {
		font-weight: bold;
		color: var(--fgOnAccent) !important;
		background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));

		&:not(:disabled):hover {
			background: linear-gradient(90deg, var(--X8), var(--X8));
		}

		&:not(:disabled):active {
			background: linear-gradient(90deg, var(--X8), var(--X8));
		}
	}

	&.danger {
		color: #ff2a2a;

		&.primary {
			color: #fff;
			background: #ff2a2a;

			&:not(:disabled):hover {
				background: #ff4242;
			}

			&:not(:disabled):active {
				background: #d42e2e;
			}
		}
	}

	&:disabled {
		opacity: 0.7;
	}

	&:focus-visible {
		outline: solid 2px var(--focus);
		outline-offset: 2px;
	}

	&.inline {
		display: inline-block;
		width: auto;
		min-width: 100px;
	}

	&.primary > .ripples > .ripple {
		background: rgba(0, 0, 0, 0.15);
	}
}

.ripples {
	position: absolute;
	z-index: 0;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 6px;
	overflow: clip;
	pointer-events: none;
}

.ripple {
	position: absolute;
	width: 2px;
	height: 2px;
	border-radius: 100%;
	background: rgba(0, 0, 0, 0.1);
	opacity: 1;
	transform: scale(1);
	transition: all 0.5s cubic-bezier(0,.5,0,1);
}

.content {
	position: relative;
	z-index: 1;
	pointer-events: none;
}
</style>
