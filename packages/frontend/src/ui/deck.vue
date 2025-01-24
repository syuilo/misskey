<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.rootIsMobile]: isMobile }]">
	<XSidebar v-if="!isMobile"/>

	<div :class="$style.main">
		<XAnnouncements v-if="$i"/>
		<XStatusBars/>
		<div ref="columnsEl" :class="[$style.sections, { [$style.center]: deckStore.reactiveState.columnAlign.value === 'center', [$style.snapScroll]: snapScroll }]" @contextmenu.self.prevent="onContextmenu" @wheel.self="onWheel">
			<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
			<section
				v-for="ids in layout"
				:class="$style.section"
				:style="columns.filter(c => ids.includes(c.id)).some(c => c.flexible) ? { flex: 1, minWidth: '350px' } : { width: Math.max(...columns.filter(c => ids.includes(c.id)).map(c => c.width)) + 'px' }"
				@wheel.self="onWheel"
			>
				<component
					:is="columnComponents[columns.find(c => c.id === id)!.type] ?? XTlColumn"
					v-for="id in ids"
					:ref="id"
					:key="id"
					:class="$style.column"
					:column="columns.find(c => c.id === id)!"
					:isStacked="ids.length > 1"
					@headerWheel="onWheel"
				/>
			</section>
			<div v-if="layout.length === 0" class="_panel" :class="$style.onboarding">
				<div>{{ i18n.ts._deck.introduction }}</div>
				<MkButton primary style="margin: 1em auto;" @click="addColumn">{{ i18n.ts._deck.addColumn }}</MkButton>
				<div>{{ i18n.ts._deck.introduction2 }}</div>
			</div>
			<div :class="$style.sideMenu">
				<div :class="$style.sideMenuTop">
					<button v-tooltip.noDelay.left="`${i18n.ts._deck.profile}: ${deckStore.state.profile}`" :class="$style.sideMenuButton" class="_button" @click="changeProfile"><i class="ti ti-caret-down"></i></button>
					<button v-tooltip.noDelay.left="i18n.ts._deck.deleteProfile" :class="$style.sideMenuButton" class="_button" @click="deleteProfile"><i class="ti ti-trash"></i></button>
				</div>
				<div :class="$style.sideMenuMiddle">
					<button v-tooltip.noDelay.left="i18n.ts._deck.addColumn" :class="$style.sideMenuButton" class="_button" @click="addColumn"><i class="ti ti-plus"></i></button>
				</div>
				<div :class="$style.sideMenuBottom">
					<button v-tooltip.noDelay.left="i18n.ts.settings" :class="$style.sideMenuButton" class="_button" @click="showSettings"><i class="ti ti-settings"></i></button>
				</div>
			</div>
		</div>
	</div>

	<div v-if="isMobile" :class="$style.nav">
		<button :class="$style.navButton" class="_button" @click="drawerMenuShowing = true"><i :class="$style.navButtonIcon" class="ti ti-menu-2"></i><span v-if="menuIndicated" :class="$style.navButtonIndicator" class="_blink"><i class="_indicatorCircle"></i></span></button>
		<button :class="$style.navButton" class="_button" @click="mainRouter.push('/')"><i :class="$style.navButtonIcon" class="ti ti-home"></i></button>
		<button :class="$style.navButton" class="_button" @click="mainRouter.push('/my/notifications')">
			<i :class="$style.navButtonIcon" class="ti ti-bell"></i>
			<span v-if="$i?.hasUnreadNotification" :class="$style.navButtonIndicator" class="_blink">
				<span class="_indicateCounter" :class="$style.itemIndicateValueIcon">{{ $i.unreadNotificationsCount > 99 ? '99+' : $i.unreadNotificationsCount }}</span>
			</span>
		</button>
		<button :class="$style.postButton" class="_button" @click="os.post()"><i :class="$style.navButtonIcon" class="ti ti-pencil"></i></button>
	</div>

	<Transition
		:enterActiveClass="defaultStore.state.animation ? $style.transition_menuDrawerBg_enterActive : ''"
		:leaveActiveClass="defaultStore.state.animation ? $style.transition_menuDrawerBg_leaveActive : ''"
		:enterFromClass="defaultStore.state.animation ? $style.transition_menuDrawerBg_enterFrom : ''"
		:leaveToClass="defaultStore.state.animation ? $style.transition_menuDrawerBg_leaveTo : ''"
	>
		<div
			v-if="drawerMenuShowing"
			:class="$style.menuBg"
			class="_modalBg"
			@click="drawerMenuShowing = false"
			@touchstart.passive="drawerMenuShowing = false"
		></div>
	</Transition>

	<Transition
		:enterActiveClass="defaultStore.state.animation ? $style.transition_menuDrawer_enterActive : ''"
		:leaveActiveClass="defaultStore.state.animation ? $style.transition_menuDrawer_leaveActive : ''"
		:enterFromClass="defaultStore.state.animation ? $style.transition_menuDrawer_enterFrom : ''"
		:leaveToClass="defaultStore.state.animation ? $style.transition_menuDrawer_leaveTo : ''"
	>
		<div v-if="drawerMenuShowing" :class="$style.menu">
			<XDrawerMenu/>
		</div>
	</Transition>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch, shallowRef } from 'vue';
import { v4 as uuid } from 'uuid';
import XCommon from './_common_/common.vue';
import { deckStore, columnTypes, addColumn as addColumnToStore, loadDeck, getProfiles, deleteProfile as deleteProfile_ } from './deck/deck-store.js';
import type { ColumnType } from './deck/deck-store.js';
import type { MenuItem } from '@/types/menu.js';
import XSidebar from '@/ui/_common_/navbar.vue';
import XDrawerMenu from '@/ui/_common_/navbar-for-mobile.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { navbarItemDef } from '@/navbar.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { unisonReload } from '@/scripts/unison-reload.js';
import { deviceKind } from '@/scripts/device-kind.js';
import { defaultStore } from '@/store.js';
import XMainColumn from '@/ui/deck/main-column.vue';
import XTlColumn from '@/ui/deck/tl-column.vue';
import XAntennaColumn from '@/ui/deck/antenna-column.vue';
import XListColumn from '@/ui/deck/list-column.vue';
import XChannelColumn from '@/ui/deck/channel-column.vue';
import XNotificationsColumn from '@/ui/deck/notifications-column.vue';
import XWidgetsColumn from '@/ui/deck/widgets-column.vue';
import XMentionsColumn from '@/ui/deck/mentions-column.vue';
import XDirectColumn from '@/ui/deck/direct-column.vue';
import XRoleTimelineColumn from '@/ui/deck/role-timeline-column.vue';
import { mainRouter } from '@/router/main.js';
const XStatusBars = defineAsyncComponent(() => import('@/ui/_common_/statusbars.vue'));
const XAnnouncements = defineAsyncComponent(() => import('@/ui/_common_/announcements.vue'));

const columnComponents = {
	main: XMainColumn,
	widgets: XWidgetsColumn,
	notifications: XNotificationsColumn,
	tl: XTlColumn,
	list: XListColumn,
	channel: XChannelColumn,
	antenna: XAntennaColumn,
	mentions: XMentionsColumn,
	direct: XDirectColumn,
	roleTimeline: XRoleTimelineColumn,
};

// ダブルクリック時には2回クリックされた扱いになるので、2回目抑止するためのタイマー
// これによりウィンドウが2枚開かれることを防ぐ
let routerNavTimer: number | null = null;

mainRouter.navHook = (path, flag): boolean => {
	if (flag === 'forcePage') return false;
	if (routerNavTimer != null) return true;
	const noMainColumn = !deckStore.state.columns.some(x => x.type === 'main');
	if (deckStore.state.navWindow || noMainColumn) {
		os.pageWindow(path);
		routerNavTimer = setTimeout(() => {
			routerNavTimer = null;
		}, 300);
		return true;
	}
	return false;
};

const isMobile = ref(window.innerWidth <= 500);
window.addEventListener('resize', () => {
	isMobile.value = window.innerWidth <= 500;
});

const snapScroll = deviceKind === 'smartphone' || deviceKind === 'tablet';
const drawerMenuShowing = ref(false);

/*
const route = 'TODO';
watch(route, () => {
	drawerMenuShowing.value = false;
});
*/

const columns = deckStore.reactiveState.columns;
const layout = deckStore.reactiveState.layout;
const menuIndicated = computed(() => {
	if ($i == null) return false;
	for (const def in navbarItemDef) {
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

function showSettings() {
	os.pageWindow('/settings/deck');
}

const columnsEl = shallowRef<HTMLElement>();

const addColumn = async (ev) => {
	const { canceled, result: column } = await os.select({
		title: i18n.ts._deck.addColumn,
		items: columnTypes.map(column => ({
			value: column, text: i18n.ts._deck._columns[column],
		})),
	});
	if (canceled || column == null) return;

	addColumnToStore({
		type: column,
		id: uuid(),
		name: i18n.ts._deck._columns[column],
		width: 330,
		soundSetting: { type: null, volume: 1 },
	});
};

const onContextmenu = (ev) => {
	os.contextMenu([{
		text: i18n.ts._deck.addColumn,
		action: addColumn,
	}], ev);
};

function onWheel(ev: WheelEvent) {
	if (ev.deltaX === 0 && columnsEl.value != null) {
		columnsEl.value.scrollLeft += ev.deltaY;
	}
}

document.documentElement.style.overflowY = 'hidden';
document.documentElement.style.scrollBehavior = 'auto';

loadDeck();

function changeProfile(ev: MouseEvent) {
	let items: MenuItem[] = [{
		text: deckStore.state.profile,
		active: true,
		action: () => {},
	}];
	getProfiles().then(profiles => {
		items.push(...(profiles.filter(k => k !== deckStore.state.profile).map(k => ({
			text: k,
			action: () => {
				deckStore.set('profile', k);
				unisonReload();
			},
		}))), { type: 'divider' as const }, {
			text: i18n.ts._deck.newProfile,
			icon: 'ti ti-plus',
			action: async () => {
				const { canceled, result: name } = await os.inputText({
					title: i18n.ts._deck.profile,
					minLength: 1,
				});
				if (canceled || name == null) return;

				deckStore.set('profile', name);
				unisonReload();
			},
		});
	}).then(() => {
		os.popupMenu(items, ev.currentTarget ?? ev.target);
	});
}

async function deleteProfile() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.deleteAreYouSure({ x: deckStore.state.profile }),
	});
	if (canceled) return;

	deleteProfile_(deckStore.state.profile);
	deckStore.set('profile', 'default');
	unisonReload();
}
</script>

<style>
html,
body {
	width: 100%;
	height: 100%;
	overflow: clip;
	position: fixed;
	top: 0;
	left: 0;
	overscroll-behavior: none;
}

#misskey_app {
	width: 100%;
	height: 100%;
	overflow: clip;
	position: absolute;
	top: 0;
	left: 0;
}
</style>

<style lang="scss" module>
.transition_menuDrawerBg_enterActive,
.transition_menuDrawerBg_leaveActive {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_menuDrawerBg_enterFrom,
.transition_menuDrawerBg_leaveTo {
	opacity: 0;
}

.transition_menuDrawer_enterActive,
.transition_menuDrawer_leaveActive {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_menuDrawer_enterFrom,
.transition_menuDrawer_leaveTo {
	opacity: 0;
	transform: translateX(-240px);
}

.root {
	$nav-hide-threshold: 650px; // TODO: どこかに集約したい

	--MI-margin: var(--MI-marginHalf);

	--columnGap: 6px;

	display: flex;
	height: 100dvh;
	box-sizing: border-box;
	flex: 1;
}

.rootIsMobile {
	padding-bottom: 100px;
}

.main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
}

.sections {
	flex: 1;
	display: flex;
	overflow-x: auto;
	overflow-y: clip;
	overscroll-behavior: contain;
	background: var(--MI_THEME-deckBg);

	&.center {
		> .section:first-of-type {
			margin-left: auto !important;
		}

		> .section:last-of-type {
			margin-right: auto !important;
		}
	}

	&.snapScroll {
		scroll-snap-type: x mandatory;
	}
}

.section {
	display: flex;
	flex-direction: column;
	scroll-snap-align: start;
	flex-shrink: 0;
	padding-top: var(--columnGap);
	padding-bottom: var(--columnGap);
	padding-left: var(--columnGap);

	> .column:not(:last-of-type) {
		margin-bottom: var(--columnGap);
	}
}

.onboarding {
	padding: 32px;
	height: min-content;
	text-align: center;
	margin: auto;
}

.sideMenu {
	flex-shrink: 0;
	margin-right: 0;
	margin-left: auto;
	display: flex;
	flex-direction: column;
	justify-content: center;
	width: 32px;
}

.sideMenuButton {
	display: block;
	width: 100%;
	aspect-ratio: 1;
}

.sideMenuTop {
	margin-bottom: auto;
}

.sideMenuMiddle {
	margin-top: auto;
	margin-bottom: auto;
}

.sideMenuBottom {
	margin-top: auto;
}

.menuBg {
	z-index: 1001;
}

.menu {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 1001;
	height: 100dvh;
	width: 240px;
	box-sizing: border-box;
	contain: strict;
	overflow: auto;
	overscroll-behavior: contain;
	background: var(--MI_THEME-navBg);
}

.nav {
	position: fixed;
	z-index: 1000;
	bottom: 0;
	left: 0;
	padding: 12px 12px max(12px, env(safe-area-inset-bottom, 0px)) 12px;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	grid-gap: 8px;
	width: 100%;
	box-sizing: border-box;
	-webkit-backdrop-filter: var(--MI-blur, blur(32px));
	backdrop-filter: var(--MI-blur, blur(32px));
	background-color: var(--MI_THEME-header);
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.navButton {
	position: relative;
	padding: 0;
	aspect-ratio: 1;
	width: 100%;
	max-width: 60px;
	margin: auto;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);

	&:hover {
		background: var(--MI_THEME-panelHighlight);
	}

	&:active {
		background: hsl(from var(--MI_THEME-panel) h s calc(l - 2));
	}
}

.postButton {
	composes: navButton;
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
	color: var(--MI_THEME-fgOnAccent);

	&:hover {
		background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
	}

	&:active {
		background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
	}
}

.navButtonIcon {
	font-size: 18px;
	vertical-align: middle;
}

.navButtonIndicator {
	position: absolute;
	top: 0;
	left: 0;
	color: var(--MI_THEME-indicator);
	font-size: 16px;

	&:has(.itemIndicateValueIcon) {
		animation: none;
		font-size: 12px;
	}
}
</style>
