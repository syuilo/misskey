<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="$style.top">
		<div :class="$style.banner" :style="{ backgroundImage: `url(${ instance.bannerUrl })` }"></div>
		<button class="_button" :class="$style.instance" @click="openInstanceMenu">
			<img :src="instance.iconUrl || instance.faviconUrl || '/favicon.ico'" alt="" :class="$style.instanceIcon"/>
		</button>
	</div>
	<div :class="$style.middle">
		<MkA :class="$style.item" :activeClass="$style.active" to="/" exact>
			<i :class="$style.itemIcon" class="ti ti-home ti-fw"></i><span :class="$style.itemText">{{ i18n.ts.timeline }}</span>
		</MkA>
		<template v-for="item in menu">
			<div v-if="item === '-'" :class="$style.divider"></div>
			<component :is="navbarItemDef[item].to ? 'MkA' : 'button'" v-else-if="navbarItemDef[item] && (navbarItemDef[item].show !== false)" class="_button" :class="[$style.item, { [$style.active]: navbarItemDef[item].active }]" :activeClass="$style.active" :to="navbarItemDef[item].to" v-on="navbarItemDef[item].action ? { click: navbarItemDef[item].action } : {}">
				<i class="ti-fw" :class="[$style.itemIcon, navbarItemDef[item].icon]"></i><span :class="$style.itemText">{{ navbarItemDef[item].title }}</span>
				<span v-if="navbarItemDef[item].indicated" :class="$style.itemIndicator"><i class="_indicatorCircle"></i></span>
			</component>
		</template>
		<div :class="$style.divider"></div>
		<MkA v-if="$i.isAdmin || $i.isModerator" :class="$style.item" :activeClass="$style.active" to="/admin">
			<i :class="$style.itemIcon" class="ti ti-dashboard ti-fw"></i><span :class="$style.itemText">{{ i18n.ts.controlPanel }}</span>
		</MkA>
		<button :class="$style.item" class="_button" @click="more">
			<i :class="$style.itemIcon" class="ti ti-grid-dots ti-fw"></i><span :class="$style.itemText">{{ i18n.ts.more }}</span>
			<span v-if="otherMenuItemIndicated" :class="$style.itemIndicator"><i class="_indicatorCircle"></i></span>
		</button>
		<MkA :class="$style.item" :activeClass="$style.active" to="/settings">
			<i :class="$style.itemIcon" class="ti ti-settings ti-fw"></i><span :class="$style.itemText">{{ i18n.ts.settings }}</span>
		</MkA>
	</div>
	<div :class="$style.bottom">
		<button class="_button" :class="$style.post" data-cy-open-post-form @click="os.post">
			<i :class="$style.postIcon" class="ti ti-pencil ti-fw"></i><span style="position: relative;">{{ i18n.ts.note }}</span>
		</button>
		<button class="_button" :class="$style.account" @click="openAccountMenu">
			<MkAvatar :user="$i" :class="$style.avatar"/><MkAcct :class="$style.acct" class="_nowrap" :user="$i"/>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, defineAsyncComponent, toRef } from 'vue';
import { openInstanceMenu } from './common';
import * as os from '@/os';
import { navbarItemDef } from '@/navbar';
import { $i, openAccountMenu as openAccountMenu_ } from '@/account';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

const menu = toRef(defaultStore.state, 'menu');
const otherMenuItemIndicated = computed(() => {
	for (const def in navbarItemDef) {
		if (menu.value.includes(def)) continue;
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_({
		withExtraOperation: true,
	}, ev);
}

function more() {
	os.popup(defineAsyncComponent(() => import('@/components/MkLaunchPad.vue')), {}, {
	}, 'closed');
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
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
	padding-left: 24px;
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
		&:before {
			content: "";
			display: block;
			width: calc(100% - 24px);
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
</style>
