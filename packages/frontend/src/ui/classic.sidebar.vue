<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="npcljfve" :class="{ iconOnly }">
	<button v-click-anime class="item _button account" @click="openAccountMenu">
		<MkAvatar :user="$i" class="avatar"/><MkAcct class="text" :user="$i"/>
	</button>
	<div class="post" data-cy-open-post-form @click="os.post">
		<MkButton class="button" gradate full rounded>
			<i class="ti ti-pencil ti-fw"></i><span v-if="!iconOnly" class="text">{{ i18n.ts.note }}</span>
		</MkButton>
	</div>
	<div class="divider"></div>
	<MkA v-click-anime class="item index" activeClass="active" to="/" exact>
		<i class="ti ti-home ti-fw"></i><span class="text">{{ i18n.ts.timeline }}</span>
	</MkA>
	<template v-for="item in menu">
		<div v-if="item === '-'" class="divider"></div>
		<component :is="navbarItemDef[item].to ? 'MkA' : 'button'" v-else-if="navbarItemDef[item] && (navbarItemDef[item].show !== false)" v-click-anime class="item _button" :class="item" activeClass="active" :to="navbarItemDef[item].to" v-on="navbarItemDef[item].action ? { click: navbarItemDef[item].action } : {}">
			<i class="ti-fw" :class="navbarItemDef[item].icon"></i><span class="text">{{ navbarItemDef[item].title }}</span>
			<span v-if="navbarItemDef[item].indicated" class="indicator"><i class="_indicatorCircle"></i></span>
		</component>
	</template>
	<div class="divider"></div>
	<MkA v-if="$i.isAdmin || $i.isModerator" v-click-anime class="item" activeClass="active" to="/admin" :behavior="settingsWindowed ? 'window' : null">
		<i class="ti ti-dashboard ti-fw"></i><span class="text">{{ i18n.ts.controlPanel }}</span>
	</MkA>
	<button v-click-anime class="item _button" @click="more">
		<i class="ti ti-dots ti-fw"></i><span class="text">{{ i18n.ts.more }}</span>
		<span v-if="otherNavItemIndicated" class="indicator"><i class="_indicatorCircle"></i></span>
	</button>
	<MkA v-click-anime class="item" activeClass="active" to="/settings" :behavior="settingsWindowed ? 'window' : null">
		<i class="ti ti-settings ti-fw"></i><span class="text">{{ i18n.ts.settings }}</span>
	</MkA>
	<div class="divider"></div>
	<div class="about">
		<button v-click-anime class="item _button" @click="openInstanceMenu">
			<img :src="instance.iconUrl ?? instance.faviconUrl ?? '/favicon.ico'" class="_ghost"/>
		</button>
	</div>
	<!--<MisskeyLogo class="misskey"/>-->
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { defineAsyncComponent, onMounted, computed, watch, nextTick } from 'vue';
import { openInstanceMenu } from './_common_/common';
// import { host } from '@/config';
import * as os from '@/os';
import { navbarItemDef } from '@/navbar';
import { openAccountMenu as openAccountMenu_, $i } from '@/account';
import MkButton from '@/components/MkButton.vue';
// import { StickySidebar } from '@/scripts/sticky-sidebar';
// import { mainRouter } from '@/router';
//import MisskeyLogo from '@assets/client/misskey.svg';
import { defaultStore } from '@/store';
import { instance } from '@/instance';
import { i18n } from '@/i18n';

const WINDOW_THRESHOLD = 1400;

const menu = $ref(defaultStore.state.menu);
const menuDisplay = computed(defaultStore.makeGetterSetter('menuDisplay'));
const otherNavItemIndicated = computed<boolean>(() => {
	for (const def in navbarItemDef) {
		if (menu.includes(def)) continue;
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});
let el = $shallowRef<HTMLElement>();
// let accounts = $ref([]);
// let connection = $ref(null);
let iconOnly = $ref(false);
let settingsWindowed = $ref(false);

function calcViewState() {
	iconOnly = (window.innerWidth <= WINDOW_THRESHOLD) || (menuDisplay.value === 'sideIcon');
	settingsWindowed = (window.innerWidth > WINDOW_THRESHOLD);
}

function more(ev: MouseEvent) {
	os.popup(defineAsyncComponent(() => import('@/components/MkLaunchPad.vue')), {
		src: ev.currentTarget ?? ev.target,
	}, {}, 'closed');
}

function openAccountMenu(ev: MouseEvent) {
	openAccountMenu_({
		withExtraOperation: true,
	}, ev);
}

watch(defaultStore.reactiveState.menuDisplay, () => {
	calcViewState();
});

</script>

<style lang="scss" scoped>
.npcljfve {
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$nav-icon-only-width: 78px; // TODO: どこかに集約したい
	$avatar-size: 32px;
	$avatar-margin: 8px;

	padding: 0 16px;
	box-sizing: border-box;
	width: 260px;

	&.iconOnly {
		flex: 0 0 $nav-icon-only-width;
		width: $nav-icon-only-width !important;

		> .divider {
			margin: 8px auto;
			width: calc(100% - 32px);
		}

		> .post {
			> .button {
				width: 46px;
				height: 46px;
				padding: 0;
			}
		}

		> .item {
			padding-left: 0;
			width: 100%;
			text-align: center;
			font-size: $ui-font-size * 1.1;
			line-height: 3.7rem;

			> i,
			> .avatar {
				margin-right: 0;
			}

			> i {
				left: 10px;
			}

			> .text {
				display: none;
			}
		}
	}

	> .divider {
		margin: 10px 0;
		border-top: solid 0.5px var(--divider);
	}

	> .post {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 16px 0;
		background: var(--bg);

		> .button {
			min-width: 0;
		}
	}

	> .about {
		fill: currentColor;
		padding: 8px 0 16px 0;
		text-align: center;

		> .item {
			display: block;
			width: 32px;
			margin: 0 auto;

			img {
				display: block;
				width: 100%;
			}
		}
	}

	> .item {
		position: relative;
		display: block;
		font-size: $ui-font-size;
		line-height: 2.6rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 100%;
		text-align: left;
		box-sizing: border-box;

		> i {
			width: 32px;
		}

		> i,
		> .avatar {
			margin-right: $avatar-margin;
		}

		> .avatar {
			width: $avatar-size;
			height: $avatar-size;
			vertical-align: middle;
		}

		> .indicator {
			position: absolute;
			top: 0;
			left: 0;
			color: var(--navIndicator);
			font-size: 8px;
			animation: blink 1s infinite;
		}

		&:hover {
			text-decoration: none;
			color: var(--navHoverFg);
		}

		&.active {
			color: var(--navActive);
		}
	}
}
</style>
