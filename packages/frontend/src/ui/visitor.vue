<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="mk-app">
	<a v-if="isRoot" href="https://github.com/misskey-dev/misskey" target="_blank" class="github-corner" aria-label="View source on GitHub"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:var(--MI_THEME-panel); color:var(--MI_THEME-fg); position: fixed; z-index: 10; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a>

	<div v-if="!narrow && !isRoot" class="side">
		<div class="banner" :style="{ backgroundImage: instance.backgroundImageUrl ? `url(${ instance.backgroundImageUrl })` : 'none' }"></div>
		<div class="dashboard">
			<MkVisitorDashboard/>
		</div>
	</div>

	<div class="main">
		<div v-if="!isRoot" class="header">
			<div v-if="narrow === false" class="wide">
				<MkA to="/" class="link" activeClass="active"><i class="ti ti-home icon"></i> {{ i18n.ts.home }}</MkA>
				<MkA v-if="isTimelineAvailable" to="/timeline" class="link" activeClass="active"><i class="ti ti-message icon"></i> {{ i18n.ts.timeline }}</MkA>
				<MkA to="/explore" class="link" activeClass="active"><i class="ti ti-hash icon"></i> {{ i18n.ts.explore }}</MkA>
				<MkA to="/channels" class="link" activeClass="active"><i class="ti ti-device-tv icon"></i> {{ i18n.ts.channel }}</MkA>
			</div>
			<div v-else-if="narrow === true" class="narrow">
				<button class="menu _button" @click="showMenu = true">
					<i class="ti ti-menu-2 icon"></i>
				</button>
			</div>
		</div>
		<div class="contents">
			<main v-if="!isRoot" style="container-type: inline-size;">
				<RouterView/>
			</main>
			<main v-else>
				<RouterView/>
			</main>
		</div>
	</div>

	<Transition :name="'tray-back'">
		<div
			v-if="showMenu"
			class="menu-back _modalBg"
			@click="showMenu = false"
			@touchstart.passive="showMenu = false"
		></div>
	</Transition>

	<Transition :name="'tray'">
		<div v-if="showMenu" class="menu">
			<MkA to="/" class="link" activeClass="active"><i class="ti ti-home icon"></i>{{ i18n.ts.home }}</MkA>
			<MkA v-if="isTimelineAvailable" to="/timeline" class="link" activeClass="active"><i class="ti ti-message icon"></i>{{ i18n.ts.timeline }}</MkA>
			<MkA to="/explore" class="link" activeClass="active"><i class="ti ti-hash icon"></i>{{ i18n.ts.explore }}</MkA>
			<MkA to="/announcements" class="link" activeClass="active"><i class="ti ti-speakerphone icon"></i>{{ i18n.ts.announcements }}</MkA>
			<MkA to="/channels" class="link" activeClass="active"><i class="ti ti-device-tv icon"></i>{{ i18n.ts.channel }}</MkA>
			<div class="divider"></div>
			<MkA to="/pages" class="link" activeClass="active"><i class="ti ti-news icon"></i>{{ i18n.ts.pages }}</MkA>
			<MkA to="/play" class="link" activeClass="active"><i class="ti ti-player-play icon"></i>Play</MkA>
			<MkA to="/gallery" class="link" activeClass="active"><i class="ti ti-icons icon"></i>{{ i18n.ts.gallery }}</MkA>
			<div class="action">
				<button class="_buttonPrimary" @click="signup()">{{ i18n.ts.signup }}</button>
				<button class="_button" @click="signin()">{{ i18n.ts.login }}</button>
			</div>
		</div>
	</Transition>
</div>
<XCommon/>
</template>

<script lang="ts" setup>
import { onMounted, provide, ref, computed } from 'vue';
import XCommon from './_common_/common.vue';
import { instanceName } from '@@/js/config.js';
import * as os from '@/os.js';
import { instance } from '@/instance.js';
import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';
import { ColdDeviceStorage, defaultStore } from '@/store.js';
import { provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import type { PageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import MkVisitorDashboard from '@/components/MkVisitorDashboard.vue';
import { mainRouter } from '@/router/main.js';

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const DESKTOP_THRESHOLD = 1100;

const pageMetadata = ref<null | PageMetadata>(null);

provide('router', mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			document.title = pageMetadata.value.title;
		} else {
			document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);

const announcements = {
	endpoint: 'announcements',
	limit: 10,
};

const isTimelineAvailable = ref(instance.policies?.ltlAvailable || instance.policies?.gtlAvailable);

const showMenu = ref(false);
const isDesktop = ref(window.innerWidth >= DESKTOP_THRESHOLD);
const narrow = ref(window.innerWidth < 1280);

const keymap = computed(() => {
	return {
		'd': () => {
			if (ColdDeviceStorage.get('syncDeviceDarkMode')) return;
			defaultStore.set('darkMode', !defaultStore.state.darkMode);
		},
		's': () => {
			mainRouter.push('/search');
		},
	};
});

function signin() {
	const { dispose } = os.popup(XSigninDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

function signup() {
	const { dispose } = os.popup(XSignupDialog, {
		autoSet: true,
	}, {
		closed: () => dispose(),
	});
}

onMounted(() => {
	if (!isDesktop.value) {
		window.addEventListener('resize', () => {
			if (window.innerWidth >= DESKTOP_THRESHOLD) isDesktop.value = true;
		}, { passive: true });
	}
});

defineExpose({
	showMenu: showMenu,
});
</script>

<style>
.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}
</style>

<style lang="scss" scoped>
.tray-enter-active,
.tray-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-enter-from,
.tray-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.tray-back-enter-active,
.tray-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-back-enter-from,
.tray-back-leave-active {
	opacity: 0;
}

.mk-app {
	display: flex;
	min-height: 100vh;

	> .side {
		position: sticky;
		top: 0;
		left: 0;
		width: 500px;
		height: 100vh;
		background: var(--MI_THEME-accent);

		> .banner {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			aspect-ratio: 1.5;
			background-position: center;
			background-size: cover;
			-webkit-mask-image: linear-gradient(rgba(0, 0, 0, 1.0), transparent);
			mask-image: linear-gradient(rgba(0, 0, 0, 1.0), transparent);
		}

		> .dashboard {
			position: relative;
			padding: 32px;
			box-sizing: border-box;
			max-height: 100%;
			overflow: auto;
		}
	}

	> .main {
		flex: 1;
		min-width: 0;

		> .header {
			background: var(--MI_THEME-panel);

			> .wide {
				line-height: 50px;
				padding: 0 16px;

				> .link {
					padding: 0 16px;
				}
			}

			> .narrow {
				> .menu {
					padding: 16px;
				}
			}
		}
	}

	> .menu-back {
		position: fixed;
		z-index: 1001;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
	}

	> .menu {
		position: fixed;
		z-index: 1001;
		top: 0;
		left: 0;
		width: 240px;
		height: 100vh;
		background: var(--MI_THEME-panel);

		> .link {
			display: block;
			padding: 16px;

			> .icon {
				margin-right: 1em;
			}
		}

		> .divider {
			margin: 8px auto;
			width: calc(100% - 32px);
			border-top: solid 0.5px var(--MI_THEME-divider);
		}

		> .action {
			padding: 16px;

			> button {
				display: block;
				width: 100%;
				padding: 10px;
				box-sizing: border-box;
				text-align: center;
				border-radius: 999px;

				&._button {
					background: var(--MI_THEME-panel);
				}

				&:first-child {
					margin-bottom: 16px;
				}
			}
		}
	}
}
</style>
