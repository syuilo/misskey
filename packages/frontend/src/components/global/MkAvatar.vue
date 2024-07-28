<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<component :is="link ? MkA : 'span'" v-user-preview="preview ? user.id : undefined" v-bind="bound" class="_noSelect" :class="[$style.root, { [$style.animation]: animation, [$style.cat]: user.isCat, [$style.square]: squareAvatars }]" :style="{ color: outerCatEarColor }" :title="acct(user)" @click="onClick">
	<MkImgWithBlurhash :class="$style.inner" :src="url" :hash="user.avatarBlurhash" :cover="true" :onlyAvgColor="true"/>
	<MkUserOnlineIndicator v-if="indicator" :class="$style.indicator" :user="user"/>
	<div v-if="user.isCat" :class="[$style.ears]">
		<div :class="$style.earLeft">
			<div :class="$style.innerEar" :style="{ backgroundColor: innerCatEarColor }"></div>
			<div v-if="false" :class="$style.layer">
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
			</div>
		</div>
		<div :class="$style.earRight">
			<div :class="$style.innerEar" :style="{ backgroundColor: innerCatEarColor }"></div>
			<div v-if="false" :class="$style.layer">
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
				<div :class="$style.plot" :style="{ backgroundImage: `url(${JSON.stringify(url)})` }"/>
			</div>
		</div>
	</div>
	<template v-if="showDecoration">
		<img
			v-for="decoration in decorations ?? user.avatarDecorations"
			:class="[$style.decoration]"
			:src="getDecorationUrl(decoration)"
			:style="{
				rotate: getDecorationAngle(decoration),
				scale: getDecorationScale(decoration),
				translate: getDecorationOffset(decoration),
			}"
			alt=""
		>
	</template>
</component>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkImgWithBlurhash from '../MkImgWithBlurhash.vue';
import MkA from './MkA.vue';
import { getStaticImageUrl } from '@/scripts/media-proxy.js';
import { extractAvgColorFromBlurhash } from '@/scripts/extract-avg-color-from-blurhash.js';
import { acct, userPage } from '@/filters/user.js';
import MkUserOnlineIndicator from '@/components/MkUserOnlineIndicator.vue';
import { defaultStore } from '@/store.js';

const animation = ref(defaultStore.state.animation);
const squareAvatars = ref(defaultStore.state.squareAvatars);
const useBlurEffect = ref(defaultStore.state.useBlurEffect);

const props = withDefaults(defineProps<{
	user: Misskey.entities.User;
	target?: string | null;
	link?: boolean;
	preview?: boolean;
	indicator?: boolean;
	decorations?: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>[];
	forceShowDecoration?: boolean;
}>(), {
	target: null,
	link: false,
	preview: false,
	indicator: false,
	decorations: undefined,
	forceShowDecoration: false,
});

const emit = defineEmits<{
	(ev: 'click', v: MouseEvent): void;
}>();

const showDecoration = props.forceShowDecoration || defaultStore.state.showAvatarDecorations;

const bound = computed(() => props.link
	? { to: userPage(props.user), target: props.target }
	: {});

const url = computed(() => {
	if (props.user.avatarUrl == null) return null;
	if (defaultStore.state.disableShowingAnimatedImages || defaultStore.state.dataSaver.avatar) return getStaticImageUrl(props.user.avatarUrl);
	return props.user.avatarUrl;
});

function onClick(ev: MouseEvent): void {
	if (props.link) return;
	emit('click', ev);
}

function getDecorationUrl(decoration: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) {
	if (defaultStore.state.disableShowingAnimatedImages || defaultStore.state.dataSaver.avatar) return getStaticImageUrl(decoration.url);
	return decoration.url;
}

function getDecorationAngle(decoration: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) {
	const angle = decoration.angle ?? 0;
	return angle === 0 ? undefined : `${angle * 360}deg`;
}

function getDecorationScale(decoration: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) {
	const scaleX = decoration.flipH ? -1 : 1;
	return scaleX === 1 ? undefined : `${scaleX} 1`;
}

function getDecorationOffset(decoration: Omit<Misskey.entities.UserDetailed['avatarDecorations'][number], 'id'>) {
	const offsetX = decoration.offsetX ?? 0;
	const offsetY = decoration.offsetY ?? 0;
	return offsetX === 0 && offsetY === 0 ? undefined : `${offsetX * 100}% ${offsetY * 100}%`;
}

const outerCatEarColor = ref<string | undefined>();

function updateOuterCatEarColor() {
	if (props.user.overrideCatEarColor) {
		outerCatEarColor.value = props.user.outerCatEarColor;
	} else if (props.user.avatarBlurhash) {
		outerCatEarColor.value = extractAvgColorFromBlurhash(props.user.avatarBlurhash);
	} else {
		outerCatEarColor.value = "#5b6880";
	}
}

watch(() => props.user.overrideCatEarColor, updateOuterCatEarColor, {
	immediate: true,
});
watch(() => props.user.outerCatEarColor, updateOuterCatEarColor, {
	immediate: true,
});
watch(() => props.user.avatarBlurhash, updateOuterCatEarColor, {
	immediate: true,
});

const innerCatEarColor = ref<string | undefined>();

function updateInnerCatEarColor() {
	if (props.user.overrideCatEarColor) {
		innerCatEarColor.value = props.user.innerCatEarColor;
	} else {
		innerCatEarColor.value = "#df648f";
	}
}

watch(() => props.user.overrideCatEarColor, updateInnerCatEarColor, {
	immediate: true,
});
watch(() => props.user.innerCatEarColor, updateInnerCatEarColor, {
	immediate: true,
});
</script>

<style lang="scss" module>
@keyframes earwiggleleft {
	from { transform: rotate(37.6deg) skew(30deg); }
	25% { transform: rotate(10deg) skew(30deg); }
	50% { transform: rotate(20deg) skew(30deg); }
	75% { transform: rotate(0deg) skew(30deg); }
	to { transform: rotate(37.6deg) skew(30deg); }
}

@keyframes earwiggleright {
	from { transform: rotate(-37.6deg) skew(-30deg); }
	30% { transform: rotate(-10deg) skew(-30deg); }
	55% { transform: rotate(-20deg) skew(-30deg); }
	75% { transform: rotate(0deg) skew(-30deg); }
	to { transform: rotate(-37.6deg) skew(-30deg); }
}

@keyframes eartightleft {
	from { transform: rotate(37.6deg) skew(30deg); }
	50% { transform: rotate(37.4deg) skew(30deg); }
	to { transform: rotate(37.6deg) skew(30deg); }
}

@keyframes eartightright {
	from { transform: rotate(-37.6deg) skew(-30deg); }
	50% { transform: rotate(-37.4deg) skew(-30deg); }
	to { transform: rotate(-37.6deg) skew(-30deg); }
}

.root {
	position: relative;
	display: inline-block;
	vertical-align: bottom;
	flex-shrink: 0;
	border-radius: 100%;
	line-height: 16px;
}

.inner {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	top: 0;
	border-radius: 100%;
	z-index: 1;
	overflow: clip;
	object-fit: cover;
	width: 100%;
	height: 100%;
}

.indicator {
	position: absolute;
	z-index: 2;
	bottom: 0;
	left: 0;
	width: 20%;
	height: 20%;
}

.square {
	border-radius: 20%;

	> .inner {
		border-radius: 20%;
	}
}

.cat {
	> .ears {
		contain: strict;
		position: absolute;
		top: -50%;
		left: -50%;
		width: 100%;
		height: 100%;
		padding: 50%;
		pointer-events: none;

		> .earLeft,
		> .earRight {
			contain: strict;
			display: inline-block;
			height: 50%;
			width: 50%;
			background: currentColor;

			> .innerEar {
				contain: strict;
				content: '';
				display: block;
				width: 60%;
				height: 60%;
				margin: 20%;
				background: #df548f;
			}

			> .layer {
				contain: strict;
				position: absolute;
				top: 0;
				width: 280%;
				height: 280%;

				> .plot {
					contain: strict;
					position: absolute;
					width: 100%;
					height: 100%;
					clip-path: path('M0 0H1V1H0z');
					transform: scale(32767);
					transform-origin: 0 0;
					opacity: 0.5;

					&:first-child {
						opacity: 1;
					}

					&:last-child {
						opacity: calc(1 / 3);
					}
				}
			}
		}

		> .earLeft {
			transform: rotate(37.5deg) skew(30deg);

			&, > .innerEar {
				border-radius: 25% 75% 75%;
			}

			> .layer {
				left: 0;
				transform:
					skew(-30deg)
					rotate(-37.5deg)
					translate(-2.82842712475%, /* -2 * sqrt(2) */
										-38.5857864376%); /* 40 - 2 * sqrt(2) */

				> .plot {
					background-position: 20% 10%; /* ~= 37.5deg */

					&:first-child {
						background-position-x: 21%;
					}

					&:last-child {
						background-position-y: 11%;
					}
				}
			}
		}

		> .earRight {
			transform: rotate(-37.5deg) skew(-30deg);

			&, .innerEar {
				border-radius: 75% 25% 75% 75%;
			}

			> .layer {
				right: 0;
				transform:
					skew(30deg)
					rotate(37.5deg)
					translate(2.82842712475%, /* 2 * sqrt(2) */
										-38.5857864376%); /* 40 - 2 * sqrt(2) */

				> .plot {
					position: absolute;
					background-position: 80% 10%; /* ~= 37.5deg */

					&:first-child {
						background-position-x: 79%;
					}

					&:last-child {
						background-position-y: 11%;
					}
				}
			}
		}
	}

	&.animation:hover {
		> .ears {
			> .earLeft {
				animation: earwiggleleft 1s infinite;
			}

			> .earRight {
				animation: earwiggleright 1s infinite;
			}
		}
	}
}

.decoration {
	position: absolute;
	z-index: 1;
	top: -50%;
	left: -50%;
	width: 200%;
	pointer-events: none;
}
</style>
