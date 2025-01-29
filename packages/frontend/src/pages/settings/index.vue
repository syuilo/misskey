<!--
SPDX-FileCopyrightText: syuilo and misskey-project
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
						<RouterView nested/>
					</div>
				</div>
			</div>
		</div>
	</MkSpacer>
	<MkFooterSpacer/>
</mkstickycontainer>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { i18n } from '@/i18n.js';
import MkInfo from '@/components/MkInfo.vue';
import MkSuperMenu from '@/components/MkSuperMenu.vue';
import { signout, $i } from '@/account.js';
import { clearCache } from '@/scripts/clear-cache.js';
import { instance } from '@/instance.js';
import { PageMetadata, definePageMetadata, provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import * as os from '@/os.js';
import { useRouter } from '@/router/supplier.js';

const indexInfo = {
	title: i18n.ts.settings,
	icon: 'ti ti-settings',
	hideHeader: true,
};
const INFO = ref<PageMetadata>(indexInfo);
const el = shallowRef<HTMLElement | null>(null);
const childInfo = ref<null | PageMetadata>(null);

const router = useRouter();

const narrow = ref(false);
const NARROW_THRESHOLD = 600;

const currentPage = computed(() => router.currentRef.value.child);

const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow.value = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = computed(() => [{
	title: i18n.ts.basicSettings,
	items: [{
		icon: 'ti ti-user',
		text: i18n.ts.profile,
		to: '/settings/profile',
		active: currentPage.value?.route.name === 'profile',
	}, {
		icon: 'ti ti-lock-open',
		text: i18n.ts.privacy,
		to: '/settings/privacy',
		active: currentPage.value?.route.name === 'privacy',
	}, {
		icon: 'ti ti-mood-happy',
		text: i18n.ts.emojiPicker,
		to: '/settings/emoji-picker',
		active: currentPage.value?.route.name === 'emojiPicker',
	}, {
		icon: 'ti ti-cloud',
		text: i18n.ts.drive,
		to: '/settings/drive',
		active: currentPage.value?.route.name === 'drive',
	}, {
		icon: 'ti ti-bell',
		text: i18n.ts.notifications,
		to: '/settings/notifications',
		active: currentPage.value?.route.name === 'notifications',
	}, {
		icon: 'ti ti-mail',
		text: i18n.ts.email,
		to: '/settings/email',
		active: currentPage.value?.route.name === 'email',
	}, {
		icon: 'ti ti-lock',
		text: i18n.ts.security,
		to: '/settings/security',
		active: currentPage.value?.route.name === 'security',
	}],
}, {
	title: i18n.ts.clientSettings,
	items: [{
		icon: 'ti ti-adjustments',
		text: i18n.ts.general,
		to: '/settings/general',
		active: currentPage.value?.route.name === 'general',
	}, {
		icon: 'ti ti-palette',
		text: i18n.ts.theme,
		to: '/settings/theme',
		active: currentPage.value?.route.name === 'theme',
	}, {
		icon: 'ti ti-menu-2',
		text: i18n.ts.navbar,
		to: '/settings/navbar',
		active: currentPage.value?.route.name === 'navbar',
	}, {
		icon: 'ti ti-equal-double',
		text: i18n.ts.statusbar,
		to: '/settings/statusbar',
		active: currentPage.value?.route.name === 'statusbar',
	}, {
		icon: 'ti ti-music',
		text: i18n.ts.sounds,
		to: '/settings/sounds',
		active: currentPage.value?.route.name === 'sounds',
	}, {
		icon: 'ti ti-plug',
		text: i18n.ts.plugins,
		to: '/settings/plugin',
		active: currentPage.value?.route.name === 'plugin',
	}],
}, {
	title: i18n.ts.otherSettings,
	items: [{
		icon: 'ti ti-badges',
		text: i18n.ts.roles,
		to: '/settings/roles',
		active: currentPage.value?.route.name === 'roles',
	}, {
		icon: 'ti ti-ban',
		text: i18n.ts.muteAndBlock,
		to: '/settings/mute-block',
		active: currentPage.value?.route.name === 'mute-block',
	}, {
		icon: 'ti ti-api',
		text: 'API',
		to: '/settings/api',
		active: currentPage.value?.route.name === 'api',
	}, {
		icon: 'ti ti-webhook',
		text: 'Webhook',
		to: '/settings/webhook',
		active: currentPage.value?.route.name === 'webhook',
	}, {
		icon: 'ti ti-package',
		text: i18n.ts.importAndExport,
		to: '/settings/import-export',
		active: currentPage.value?.route.name === 'import-export',
	}, {
		icon: 'ti ti-plane',
		text: `${i18n.ts.accountMigration}`,
		to: '/settings/migration',
		active: currentPage.value?.route.name === 'migration',
	}, {
		icon: 'ti ti-dots',
		text: i18n.ts.other,
		to: '/settings/other',
		active: currentPage.value?.route.name === 'other',
	}],
}, {
	items: [{
		icon: 'ti ti-device-floppy',
		text: i18n.ts.preferencesBackups,
		to: '/settings/preferences-backups',
		active: currentPage.value?.route.name === 'preferences-backups',
	}, {
		type: 'button',
		icon: 'ti ti-trash',
		text: i18n.ts.clearCache,
		action: async () => {
			await clearCache();
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

onMounted(() => {
	ro.observe(el.value);

	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow.value && currentPage.value?.route.name == null) {
		router.replace('/settings/profile');
	}
});

onActivated(() => {
	narrow.value = el.value.offsetWidth < NARROW_THRESHOLD;

	if (!narrow.value && currentPage.value?.route.name == null) {
		router.replace('/settings/profile');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (to.route.name === 'settings' && to.child?.route.name == null && !narrow.value) {
		router.replace('/settings/profile');
	}
});

const emailNotConfigured = computed(() => instance.enableEmail && ($i.email == null || !$i.emailVerified));

provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	if (info == null) {
		childInfo.value = null;
	} else {
		childInfo.value = info;
		INFO.value.needWideArea = info.needWideArea ?? undefined;
	}
});
provideReactiveMetadata(INFO);

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => INFO.value);
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
