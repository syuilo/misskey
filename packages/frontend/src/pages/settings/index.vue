<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="900" :marginMin="20" :marginMax="32">
		<div ref="el" class="vvcocwet" :class="{ wide: !narrow }">
			<div class="body">
				<div v-if="!narrow || currentPage?.route.name == null" class="nav">
					<div class="baaadecd">
						<MkInfo v-if="emailNotConfigured" warn class="info">{{ i18n.ts.emailNotConfiguredWarning }} <MkA to="/settings/email" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
						<MkSuperMenu :def="menuDef" :grid="narrow"></MkSuperMenu>
					</div>
				</div>
				<div v-if="!(narrow && currentPage?.route.name == null)" class="main">
					<div class="bkzroven" style="container-type: inline-size;">
						<RouterView/>
					</div>
				</div>
			</div>
		</div>
	</MkSpacer>
</mkstickycontainer>
</template>

<script setup lang="ts">
// @ts-nocheck
import { computed, onActivated, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { i18n } from '@/i18n';
import MkInfo from '@/components/MkInfo.vue';
import MkSuperMenu from '@/components/MkSuperMenu.vue';
import { signout, $i } from '@/account';
import { unisonReload } from '@/scripts/unison-reload';
import { instance } from '@/instance';
import { useRouter } from '@/router';
import { definePageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';
import * as os from '@/os';
import { miLocalStorage } from '@/local-storage';
import { fetchCustomEmojis } from '@/custom-emojis';

const indexInfo = {
	title: i18n.ts.settings,
	icon: 'ti ti-settings',
	hideHeader: true,
};
const INFO = ref(indexInfo);
const el = shallowRef<HTMLElement | null>(null);
const childInfo = ref(null);

const router = useRouter();

let narrow = $ref(false);
const NARROW_THRESHOLD = 600;

let currentPage = $computed(() => router.currentRef.value.child);

const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = computed(() => [{
	title: i18n.ts.basicSettings,
	items: [{
		icon: 'ti ti-user',
		text: i18n.ts.profile,
		to: '/settings/profile',
		active: currentPage?.route.name === 'profile',
	}, {
		icon: 'ti ti-lock-open',
		text: i18n.ts.privacy,
		to: '/settings/privacy',
		active: currentPage?.route.name === 'privacy',
	}, {
		icon: 'ti ti-mood-happy',
		text: i18n.ts.reaction,
		to: '/settings/reaction',
		active: currentPage?.route.name === 'reaction',
	}, {
		icon: 'ti ti-cloud',
		text: i18n.ts.drive,
		to: '/settings/drive',
		active: currentPage?.route.name === 'drive',
	}, {
		icon: 'ti ti-bell',
		text: i18n.ts.notifications,
		to: '/settings/notifications',
		active: currentPage?.route.name === 'notifications',
	}, {
		icon: 'ti ti-mail',
		text: i18n.ts.email,
		to: '/settings/email',
		active: currentPage?.route.name === 'email',
	}, {
		icon: 'ti ti-lock',
		text: i18n.ts.security,
		to: '/settings/security',
		active: currentPage?.route.name === 'security',
	}],
}, {
	title: i18n.ts.clientSettings,
	items: [{
		icon: 'ti ti-adjustments',
		text: i18n.ts.general,
		to: '/settings/general',
		active: currentPage?.route.name === 'general',
	}, {
		icon: 'ti ti-palette',
		text: i18n.ts.theme,
		to: '/settings/theme',
		active: currentPage?.route.name === 'theme',
	}, {
		icon: 'ti ti-menu-2',
		text: i18n.ts.navbar,
		to: '/settings/navbar',
		active: currentPage?.route.name === 'navbar',
	}, {
		icon: 'ti ti-equal-double',
		text: i18n.ts.statusbar,
		to: '/settings/statusbar',
		active: currentPage?.route.name === 'statusbar',
	}, {
		icon: 'ti ti-music',
		text: i18n.ts.sounds,
		to: '/settings/sounds',
		active: currentPage?.route.name === 'sounds',
	}, {
		icon: 'ti ti-plug',
		text: i18n.ts.plugins,
		to: '/settings/plugin',
		active: currentPage?.route.name === 'plugin',
	}],
}, {
	title: i18n.ts.otherSettings,
	items: [{
		icon: 'ti ti-badges',
		text: i18n.ts.roles,
		to: '/settings/roles',
		active: currentPage?.route.name === 'roles',
	}, {
		icon: 'ti ti-planet-off',
		text: i18n.ts.instanceMute,
		to: '/settings/instance-mute',
		active: currentPage?.route.name === 'instance-mute',
	}, {
		icon: 'ti ti-ban',
		text: i18n.ts.muteAndBlock,
		to: '/settings/mute-block',
		active: currentPage?.route.name === 'mute-block',
	}, {
		icon: 'ti ti-message-off',
		text: i18n.ts.wordMute,
		to: '/settings/word-mute',
		active: currentPage?.route.name === 'word-mute',
	}, {
		icon: 'ti ti-api',
		text: 'API',
		to: '/settings/api',
		active: currentPage?.route.name === 'api',
	}, {
		icon: 'ti ti-webhook',
		text: 'Webhook',
		to: '/settings/webhook',
		active: currentPage?.route.name === 'webhook',
	}, {
		icon: 'ti ti-package',
		text: i18n.ts.importAndExport,
		to: '/settings/import-export',
		active: currentPage?.route.name === 'import-export',
	}, {
		icon: 'ti ti-plane',
		text: `${i18n.ts.accountMigration}`,
		to: '/settings/migration',
		active: currentPage?.route.name === 'migration',
	}, {
		icon: 'ti ti-dots',
		text: i18n.ts.other,
		to: '/settings/other',
		active: currentPage?.route.name === 'other',
	}],
}, {
	items: [{
		icon: 'ti ti-device-floppy',
		text: i18n.ts.preferencesBackups,
		to: '/settings/preferences-backups',
		active: currentPage?.route.name === 'preferences-backups',
	}, {
		type: 'button',
		icon: 'ti ti-trash',
		text: i18n.ts.clearCache,
		action: async () => {
			os.waiting();
			miLocalStorage.removeItem('locale');
			miLocalStorage.removeItem('theme');
			miLocalStorage.removeItem('emojis');
			miLocalStorage.removeItem('lastEmojisFetchedAt');
			await fetchCustomEmojis(true);
			unisonReload();
		},
	}, {
		type: 'button',
		icon: 'ti ti-power',
		text: i18n.ts.logout,
		action: async () => {
			const { canceled } = await os.confirm({
				type: 'warning',
				text: i18n.ts.logoutConfirm,
			});
			if (canceled) return;
			signout();
		},
		danger: true,
	}],
}]);

watch($$(narrow), () => {
});

onMounted(() => {
	ro.observe(el.value);

	narrow = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow && currentPage?.route.name == null) {
		router.replace('/settings/profile');
	}
});

onActivated(() => {
	narrow = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow && currentPage?.route.name == null) {
		router.replace('/settings/profile');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (to.route.name === 'settings' && to.child?.route.name == null && !narrow) {
		router.replace('/settings/profile');
	}
});

const emailNotConfigured = computed(() => instance.enableEmail && ($i.email == null || !$i.emailVerified));

provideMetadataReceiver((info) => {
	if (info == null) {
		childInfo.value = null;
	} else {
		childInfo.value = info;
	}
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(INFO);
// w 890
// h 700
</script>

<style lang="scss" scoped>
.vvcocwet {
	> .body {
		> .nav {
			.baaadecd {
				> .info {
					margin: 16px 0;
				}

				> .accounts {
					> .avatar {
						display: block;
						width: 50px;
						height: 50px;
						margin: 8px auto 16px auto;
					}
				}
			}
		}

		> .main {
			.bkzroven {
			}
		}
	}

	&.wide {
		> .body {
			display: flex;
			height: 100%;

			> .nav {
				width: 34%;
				padding-right: 32px;
				box-sizing: border-box;
			}

			> .main {
				flex: 1;
				min-width: 0;
			}
		}
	}
}
</style>
