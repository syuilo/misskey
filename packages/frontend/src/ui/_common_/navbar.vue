<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.iconOnly]: iconOnly }]">
	<div :class="$style.body">
		<div :class="$style.top">
			<div :class="$style.banner" :style="{ backgroundImage: `url(${ instance.bannerUrl })` }"></div>
			<button v-tooltip.noDelay.right="instance.name ?? i18n.ts.instance" class="_button" :class="$style.instance" @click="openInstanceMenu">
				<img :src="instance.iconUrl || instance.faviconUrl || '/favicon.ico'" alt="" :class="$style.instanceIcon"/>
			</button>
		</div>
		<div :class="$style.middle">
			<MkA v-tooltip.noDelay.right="i18n.ts.timeline" :class="$style.item" :activeClass="$style.active" to="/" exact>
				<i :class="$style.itemIcon" class="ti ti-home ti-fw"></i><span :class="$style.itemText">{{ i18n.ts.timeline }}</span>
			</MkA>
			<template v-for="item in menu">
				<div v-if="item === '-'" :class="$style.divider"></div>
				<component
					:is="navbarItemDef[item].to ? 'MkA' : 'button'"
					v-else-if="navbarItemDef[item] && (navbarItemDef[item].show !== false)"
					v-tooltip.noDelay.right="navbarItemDef[item].title"
					class="_button"
					:class="[$style.item, { [$style.active]: navbarItemDef[item].active }]"
					:activeClass="$style.active"
					:to="navbarItemDef[item].to"
					v-on="navbarItemDef[item].action ? { click: navbarItemDef[item].action } : {}"
				>
					<i class="ti-fw" :class="[$style.itemIcon, navbarItemDef[item].icon]"></i><span :class="$style.itemText">{{ navbarItemDef[item].title }}</span>
					<span v-if="navbarItemDef[item].indicated" :class="$style.itemIndicator"><i class="_indicatorCircle"></i></span>
				</component>
			</template>
			<div :class="$style.divider"></div>
			<MkA v-if="$i.isAdmin || $i.isModerator" v-tooltip.noDelay.right="i18n.ts.controlPanel" :class="$style.item" :activeClass="$style.active" to="/admin">
				<i :class="$style.itemIcon" class="ti ti-dashboard ti-fw"></i><span :class="$style.itemText">{{ i18n.ts.controlPanel }}</span>
			</MkA>
			<button class="_button" :class="$style.item" @click="more">
				<i :class="$style.itemIcon" class="ti ti-grid-dots ti-fw"></i><span :class="$style.itemText">{{ i18n.ts.more }}</span>
				<span v-if="otherMenuItemIndicated" :class="$style.itemIndicator"><i class="_indicatorCircle"></i></span>
			</button>
			<MkA v-tooltip.noDelay.right="i18n.ts.settings" :class="$style.item" :activeClass="$style.active" to="/settings">
				<i :class="$style.itemIcon" class="ti ti-settings ti-fw"></i><span :class="$style.itemText">{{ i18n.ts.settings }}</span>
			</MkA>
		</div>
		<div :class="$style.bottom">
			<button v-tooltip.noDelay.right="i18n.ts.note" class="_button" :class="[$style.post]" data-cy-open-post-form @click="os.post">
				<i class="ti ti-pencil ti-fw" :class="$style.postIcon"></i><span :class="$style.postText">{{ i18n.ts.note }}</span>
			</button>
			<button v-tooltip.noDelay.right="`${i18n.ts.account}: @${$i.username}`" class="_button" :class="[$style.account]" @click="openAccountMenu">
				<MkAvatar :user="$i" :class="$style.avatar"/><MkAcct class="_nowrap" :class="$style.acct" :user="$i"/>
			</button>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { openInstanceMenu } from './common';
import * as os from '@/os';
import { navbarItemDef } from '@/navbar';
import { $i, openAccountMenu as openAccountMenu_ } from '@/account';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

const iconOnly = ref(false);

const menu = computed(() => defaultStore.state.menu);
const otherMenuItemIndicated = computed(() => {
	for (const def in navbarItemDef) {
		if (menu.value.includes(def)) continue;
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

const calcViewState = () => {
	iconOnly.value = (window.innerWidth <= 1279) || (defaultStore.state.menuDisplay === 'sideIcon');
};

calcViewState();

window.addEventListener('resize', calcViewState);

watch(defaultStore.reactiveState.menuDisplay, () => {
	calcViewState();
});

function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_({
		withExtraOperation: true,
	}, ev);
}

function more(ev: MouseEvent) {
	os.popup(defineAsyncComponent(() => import('@/components/MkLaunchPad.vue')), {
		src: ev.currentTarget ?? ev.target,
	}, {
	}, 'closed');
}
</script>

<style lang="scss" module>
.root {
	--nav-width: 250px;
	--nav-icon-only-width: 72px;

	flex: 0 0 var(--nav-width);
	width: var(--nav-width);
	box-sizing: border-box;
}

.body {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 1001;
	width: var(--nav-icon-only-width);
	height: 100dvh;
	box-sizing: border-box;
	overflow: auto;
	overflow-x: clip;
	overscroll-behavior: contain;
	background: var(--navBg);
	contain: strict;
	display: flex;
	flex-direction: column;
}

.root:not(.iconOnly) {
	.body {
		width: var(--nav-width);
	}

	.top {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 20px 0;
		background: var(--X14);
		-webkit-backdrop-filter: var(--blur, blur(8px));
		backdrop-filter: var(--blur, blur(8px));
	}

	.banner {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center center;
		-webkit-mask-image: linear-gradient(0deg, rgba(0,0,0,0) 15%, rgba(0,0,0,0.75) 100%);
		mask-image: linear-gradient(0deg, rgba(0,0,0,0) 15%, rgba(0,0,0,0.75) 100%);
	}

	.instance {
		position: relative;
		display: block;
		text-align: center;
		width: 100%;
	}

	.instanceIcon {
		display: inline-block;
		width: 38px;
		aspect-ratio: 1;
	}

	.bottom {
		position: sticky;
		bottom: 0;
		padding: 20px 0;
		background: var(--X14);
		-webkit-backdrop-filter: var(--blur, blur(8px));
		backdrop-filter: var(--blur, blur(8px));
	}

	.post {
		position: relative;
		display: block;
		width: 100%;
		height: 40px;
		color: var(--fgOnAccent);
		font-weight: bold;
		text-align: left;

		&:before {
			content: "";
			display: block;
			width: calc(100% - 38px);
			height: 100%;
			margin: auto;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			border-radius: 999px;
			background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
		}

		&:hover, &.active {
			&:before {
				background: var(--accentLighten);
			}
		}
	}

	.postIcon {
		position: relative;
		margin-left: 30px;
		margin-right: 8px;
		width: 32px;
	}

	.postText {
		position: relative;
	}

	.account {
		position: relative;
		display: flex;
		align-items: center;
		padding-left: 30px;
		width: 100%;
		text-align: left;
		box-sizing: border-box;
		margin-top: 16px;
	}

	.avatar {
		display: block;
		flex-shrink: 0;
		position: relative;
		width: 32px;
		aspect-ratio: 1;
		margin-right: 8px;
	}

	.acct {
		display: block;
		flex-shrink: 1;
		padding-right: 8px;
	}

	.middle {
		flex: 1;
	}

	.divider {
		margin: 16px 16px;
		border-top: solid 0.5px var(--divider);
	}

	.item {
		position: relative;
		display: block;
		padding-left: 30px;
		line-height: 2.85rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 100%;
		text-align: left;
		box-sizing: border-box;
		color: var(--navFg);

		&:hover {
			text-decoration: none;
			color: var(--navHoverFg);
		}

		&.active {
			color: var(--navActive);
		}

		&:hover, &.active {
			color: var(--accent);

			&:before {
				content: "";
				display: block;
				width: calc(100% - 34px);
				height: 100%;
				margin: auto;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				border-radius: 999px;
				background: var(--accentedBg);
			}
		}
	}

	.itemIcon {
		position: relative;
		width: 32px;
		margin-right: 8px;
	}

	.itemIndicator {
		position: absolute;
		top: 0;
		left: 20px;
		color: var(--navIndicator);
		font-size: 8px;
		animation: blink 1s infinite;
	}

	.itemText {
		position: relative;
		font-size: 0.9em;
	}
}

.root.iconOnly {
	flex: 0 0 var(--nav-icon-only-width);
	width: var(--nav-icon-only-width);

	.body {
		width: var(--nav-icon-only-width);
	}

	.top {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 20px 0;
		background: var(--X14);
		-webkit-backdrop-filter: var(--blur, blur(8px));
		backdrop-filter: var(--blur, blur(8px));
	}

	.instance {
		display: block;
		text-align: center;
		width: 100%;
	}

	.instanceIcon {
		display: inline-block;
		width: 30px;
		aspect-ratio: 1;
	}

	.bottom {
		position: sticky;
		bottom: 0;
		padding: 20px 0;
		background: var(--X14);
		-webkit-backdrop-filter: var(--blur, blur(8px));
		backdrop-filter: var(--blur, blur(8px));
	}

	.post {
		display: block;
		position: relative;
		width: 100%;
		height: 52px;
		margin-bottom: 16px;
		text-align: center;

		&:before {
			content: "";
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: 52px;
			aspect-ratio: 1/1;
			border-radius: 100%;
			background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
		}

		&:hover, &.active {
			&:before {
				background: var(--accentLighten);
			}
		}
	}

	.postIcon {
		position: relative;
		color: var(--fgOnAccent);
	}

	.postText {
		display: none;
	}

	.account {
		display: block;
		text-align: center;
		width: 100%;
	}

	.avatar {
		display: inline-block;
		width: 38px;
		aspect-ratio: 1;
	}

	.acct {
		display: none;
	}

	.middle {
		flex: 1;
	}

	.divider {
		margin: 8px auto;
		width: calc(100% - 32px);
		border-top: solid 0.5px var(--divider);
	}

	.item {
		display: block;
		position: relative;
		padding: 18px 0;
		width: 100%;
		text-align: center;

		&:hover, &.active {
			text-decoration: none;
			color: var(--accent);

			&:before {
				content: "";
				display: block;
				height: 100%;
				aspect-ratio: 1;
				margin: auto;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				border-radius: 999px;
				background: var(--accentedBg);
			}

			> .icon,
			> .text {
				opacity: 1;
			}
		}
	}

	.itemIcon {
		display: block;
		margin: 0 auto;
		opacity: 0.7;
	}

	.itemText {
		display: none;
	}

	.itemIndicator {
		position: absolute;
		top: 6px;
		left: 24px;
		color: var(--navIndicator);
		font-size: 8px;
		animation: blink 1s infinite;
	}
}
</style>
