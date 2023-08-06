<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="meta" :class="$style.root">
	<div :class="[$style.main, $style.panel]">
		<img :src="instance.iconUrl || instance.faviconUrl || '/favicon.ico'" alt="" :class="$style.mainIcon"/>
		<button class="_button _acrylic" :class="$style.mainMenu" @click="showMenu"><i class="ti ti-dots"></i></button>
		<div :class="$style.mainFg">
			<h1 :class="$style.mainTitle">
				<!-- 背景色によってはロゴが見えなくなるのでとりあえず無効に -->
				<!-- <img class="logo" v-if="meta.logoImageUrl" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span> -->
				<span>{{ instanceName }}</span>
			</h1>
			<div :class="$style.mainAbout">
				<!-- eslint-disable-next-line vue/no-v-html -->
				<div v-html="meta.description || i18n.ts.headlineMisskey"></div>
			</div>
			<div v-if="instance.disableRegistration" :class="$style.mainWarn">
				<MkInfo warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
			</div>
			<div class="_gaps_s" :class="$style.mainActions">
				<MkButton :class="$style.mainAction" full rounded gradate data-cy-signup style="margin-right: 12px;" @click="signup()">{{ i18n.ts.joinThisServer }}</MkButton>
				<MkButton :class="$style.mainAction" full rounded @click="exploreOtherServers()">{{ i18n.ts.exploreOtherServers }}</MkButton>
				<MkButton :class="$style.mainAction" full rounded data-cy-signin @click="signin()">{{ i18n.ts.login }}</MkButton>
			</div>
		</div>
	</div>
	<div v-if="stats" :class="$style.stats">
		<div :class="[$style.statsItem, $style.panel]">
			<div :class="$style.statsItemLabel">{{ i18n.ts.users }}</div>
			<div :class="$style.statsItemCount"><MkNumber :value="stats.originalUsersCount"/></div>
		</div>
		<div :class="[$style.statsItem, $style.panel]">
			<div :class="$style.statsItemLabel">{{ i18n.ts.notes }}</div>
			<div :class="$style.statsItemCount"><MkNumber :value="stats.originalNotesCount"/></div>
		</div>
	</div>
	<div v-if="instance.policies.ltlAvailable" :class="[$style.tl, $style.panel]">
		<div :class="$style.tlHeader">{{ i18n.ts.letsLookAtTimeline }}</div>
		<div :class="$style.tlBody">
			<MkTimeline src="local"/>
		</div>
	</div>
	<div :class="$style.panel">
		<XActiveUsersChart/>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import { Instance } from 'misskey-js/built/entities';
import XTimeline from './welcome.timeline.vue';
import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';
import MkButton from '@/components/MkButton.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import MkInfo from '@/components/MkInfo.vue';
import { instanceName } from '@/config';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import number from '@/filters/number';
import MkNumber from '@/components/MkNumber.vue';
import XActiveUsersChart from '@/components/MkVisitorDashboard.ActiveUsersChart.vue';

let meta = $ref<Instance>();
let stats = $ref(null);

os.api('meta', { detail: true }).then(_meta => {
	meta = _meta;
});

os.api('stats', {
}).then((res) => {
	stats = res;
});

function signin() {
	os.popup(XSigninDialog, {
		autoSet: true,
	}, {}, 'closed');
}

function signup() {
	os.popup(XSignupDialog, {
		autoSet: true,
	}, {}, 'closed');
}

function showMenu(ev) {
	os.popupMenu([{
		text: i18n.ts.instanceInfo,
		icon: 'ti ti-info-circle',
		action: () => {
			os.pageWindow('/about');
		},
	}, {
		text: i18n.ts.aboutMisskey,
		icon: 'ti ti-info-circle',
		action: () => {
			os.pageWindow('/about-misskey');
		},
	}, null, {
		text: i18n.ts.help,
		icon: 'ti ti-help-circle',
		action: () => {
			window.open('https://misskey-hub.net/help.md', '_blank');
		},
	}], ev.currentTarget ?? ev.target);
}

function exploreOtherServers() {
	// TODO: 言語をよしなに
	window.open('https://join.misskey.page/ja-JP/instances', '_blank');
}
</script>

<style lang="scss" module>
.root {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 32px 0 0 0;
}

.panel {
	position: relative;
	background: var(--panel);
	border-radius: var(--radius);
	box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
}

.main {
	text-align: center;
}

.mainIcon {
	width: 85px;
	margin-top: -47px;
	vertical-align: bottom;
	filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.5));
}

.mainMenu {
	position: absolute;
	top: 16px;
	right: 16px;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	font-size: 18px;
}

.mainFg {
	position: relative;
	z-index: 1;
}

.mainTitle {
	display: block;
	margin: 0;
	padding: 16px 32px 24px 32px;
	font-size: 1.4em;
}

.mainLogo {
	vertical-align: bottom;
	max-height: 120px;
	max-width: min(100%, 300px);
}

.mainAbout {
	padding: 0 32px;
}

.mainWarn {
	padding: 32px 32px 0 32px;
}

.mainActions {
	padding: 32px;
}

.mainAction {
	line-height: 28px;
}

.stats {
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-gap: 16px;
}

.statsItem {
	overflow: clip;
	padding: 16px 20px;
}

.statsItemLabel {
	color: var(--fgTransparentWeak);
	font-size: 0.9em;
}

.statsItemCount {
	font-weight: bold;
	font-size: 1.2em;
	color: var(--accent);
}

.tl {
	overflow: clip;
}

.tlHeader {
	padding: 12px 16px;
	border-bottom: solid 1px var(--divider);
}

.tlBody {
	height: 350px;
	overflow: auto;
}
</style>
