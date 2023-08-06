<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="el" class="hiyeyicy" :class="{ wide: !narrow }">
	<div v-if="!narrow || currentPage?.route.name == null" class="nav">
		<MkSpacer :contentMax="700" :marginMin="16">
			<div class="lxpfedzu">
				<div class="banner">
					<img :src="instance.iconUrl || '/favicon.ico'" alt="" class="icon"/>
				</div>

				<MkInfo v-if="thereIsUnresolvedAbuseReport" warn class="info">{{ i18n.ts.thereIsUnresolvedAbuseReportWarning }} <MkA to="/admin/abuses" class="_link">{{ i18n.ts.check }}</MkA></MkInfo>
				<MkInfo v-if="noMaintainerInformation" warn class="info">{{ i18n.ts.noMaintainerInformationWarning }} <MkA to="/admin/settings" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noBotProtection" warn class="info">{{ i18n.ts.noBotProtectionWarning }} <MkA to="/admin/security" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>
				<MkInfo v-if="noEmailServer" warn class="info">{{ i18n.ts.noEmailServerWarning }} <MkA to="/admin/email-settings" class="_link">{{ i18n.ts.configure }}</MkA></MkInfo>

				<MkSuperMenu :def="menuDef" :grid="narrow"></MkSuperMenu>
			</div>
		</MkSpacer>
	</div>
	<div v-if="!(narrow && currentPage?.route.name == null)" class="main">
		<RouterView/>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onActivated, onMounted, onUnmounted, provide, watch } from 'vue';
import { i18n } from '@/i18n';
import MkSuperMenu from '@/components/MkSuperMenu.vue';
import MkInfo from '@/components/MkInfo.vue';
import { instance } from '@/instance';
import * as os from '@/os';
import { lookupUser } from '@/scripts/lookup-user';
import { useRouter } from '@/router';
import { definePageMetadata, provideMetadataReceiver } from '@/scripts/page-metadata';

const isEmpty = (x: string | null) => x == null || x === '';

const router = useRouter();

const indexInfo = {
	title: i18n.ts.controlPanel,
	icon: 'ti ti-settings',
	hideHeader: true,
};

provide('shouldOmitHeaderTitle', false);

let INFO = $ref(indexInfo);
let childInfo = $ref(null);
let narrow = $ref(false);
let view = $ref(null);
let el = $ref(null);
let pageProps = $ref({});
let noMaintainerInformation = isEmpty(instance.maintainerName) || isEmpty(instance.maintainerEmail);
let noBotProtection = !instance.disableRegistration && !instance.enableHcaptcha && !instance.enableRecaptcha && !instance.enableTurnstile;
let noEmailServer = !instance.enableEmail;
let thereIsUnresolvedAbuseReport = $ref(false);
let currentPage = $computed(() => router.currentRef.value.child);

os.api('admin/abuse-user-reports', {
	state: 'unresolved',
	limit: 1,
}).then(reports => {
	if (reports.length > 0) thereIsUnresolvedAbuseReport = true;
});

const NARROW_THRESHOLD = 600;
const ro = new ResizeObserver((entries, observer) => {
	if (entries.length === 0) return;
	narrow = entries[0].borderBoxSize[0].inlineSize < NARROW_THRESHOLD;
});

const menuDef = $computed(() => [{
	title: i18n.ts.quickAction,
	items: [{
		type: 'button',
		icon: 'ti ti-search',
		text: i18n.ts.lookup,
		action: lookup,
	}, ...(instance.disableRegistration ? [{
		type: 'button',
		icon: 'ti ti-user-plus',
		text: i18n.ts.createInviteCode,
		action: invite,
	}] : [])],
}, {
	title: i18n.ts.administration,
	items: [{
		icon: 'ti ti-dashboard',
		text: i18n.ts.dashboard,
		to: '/admin/overview',
		active: currentPage?.route.name === 'overview',
	}, {
		icon: 'ti ti-users',
		text: i18n.ts.users,
		to: '/admin/users',
		active: currentPage?.route.name === 'users',
	}, {
		icon: 'ti ti-user-plus',
		text: i18n.ts.invite,
		to: '/admin/invites',
		active: currentPage?.route.name === 'invites',
	}, {
		icon: 'ti ti-badges',
		text: i18n.ts.roles,
		to: '/admin/roles',
		active: currentPage?.route.name === 'roles',
	}, {
		icon: 'ti ti-icons',
		text: i18n.ts.customEmojis,
		to: '/admin/emojis',
		active: currentPage?.route.name === 'emojis',
	}, {
		icon: 'ti ti-whirl',
		text: i18n.ts.federation,
		to: '/admin/federation',
		active: currentPage?.route.name === 'federation',
	}, {
		icon: 'ti ti-clock-play',
		text: i18n.ts.jobQueue,
		to: '/admin/queue',
		active: currentPage?.route.name === 'queue',
	}, {
		icon: 'ti ti-cloud',
		text: i18n.ts.files,
		to: '/admin/files',
		active: currentPage?.route.name === 'files',
	}, {
		icon: 'ti ti-speakerphone',
		text: i18n.ts.announcements,
		to: '/admin/announcements',
		active: currentPage?.route.name === 'announcements',
	}, {
		icon: 'ti ti-ad',
		text: i18n.ts.ads,
		to: '/admin/ads',
		active: currentPage?.route.name === 'ads',
	}, {
		icon: 'ti ti-exclamation-circle',
		text: i18n.ts.abuseReports,
		to: '/admin/abuses',
		active: currentPage?.route.name === 'abuses',
	}],
}, {
	title: i18n.ts.settings,
	items: [{
		icon: 'ti ti-settings',
		text: i18n.ts.general,
		to: '/admin/settings',
		active: currentPage?.route.name === 'settings',
	}, {
		icon: 'ti ti-paint',
		text: i18n.ts.branding,
		to: '/admin/branding',
		active: currentPage?.route.name === 'branding',
	}, {
		icon: 'ti ti-shield',
		text: i18n.ts.moderation,
		to: '/admin/moderation',
		active: currentPage?.route.name === 'moderation',
	}, {
		icon: 'ti ti-mail',
		text: i18n.ts.emailServer,
		to: '/admin/email-settings',
		active: currentPage?.route.name === 'email-settings',
	}, {
		icon: 'ti ti-cloud',
		text: i18n.ts.objectStorage,
		to: '/admin/object-storage',
		active: currentPage?.route.name === 'object-storage',
	}, {
		icon: 'ti ti-lock',
		text: i18n.ts.security,
		to: '/admin/security',
		active: currentPage?.route.name === 'security',
	}, {
		icon: 'ti ti-planet',
		text: i18n.ts.relays,
		to: '/admin/relays',
		active: currentPage?.route.name === 'relays',
	}, {
		icon: 'ti ti-ban',
		text: i18n.ts.instanceBlocking,
		to: '/admin/instance-block',
		active: currentPage?.route.name === 'instance-block',
	}, {
		icon: 'ti ti-ghost',
		text: i18n.ts.proxyAccount,
		to: '/admin/proxy-account',
		active: currentPage?.route.name === 'proxy-account',
	}, {
		icon: 'ti ti-adjustments',
		text: i18n.ts.other,
		to: '/admin/other-settings',
		active: currentPage?.route.name === 'other-settings',
	}],
}, {
	title: i18n.ts.info,
	items: [{
		icon: 'ti ti-database',
		text: i18n.ts.database,
		to: '/admin/database',
		active: currentPage?.route.name === 'database',
	}],
}]);

watch(narrow, () => {
	if (currentPage?.route.name == null && !narrow) {
		router.push('/admin/overview');
	}
});

onMounted(() => {
	ro.observe(el);

	narrow = el.offsetWidth < NARROW_THRESHOLD;
	if (currentPage?.route.name == null && !narrow) {
		router.push('/admin/overview');
	}
});

onActivated(() => {
	narrow = el.offsetWidth < NARROW_THRESHOLD;
	if (currentPage?.route.name == null && !narrow) {
		router.push('/admin/overview');
	}
});

onUnmounted(() => {
	ro.disconnect();
});

watch(router.currentRef, (to) => {
	if (to.route.path === '/admin' && to.child?.route.name == null && !narrow) {
		router.replace('/admin/overview');
	}
});

provideMetadataReceiver((info) => {
	if (info == null) {
		childInfo = null;
	} else {
		childInfo = info;
	}
});

const invite = () => {
	os.api('admin/invite/create').then(x => {
		os.alert({
			type: 'info',
			text: x?.[0].code,
		});
	}).catch(err => {
		os.alert({
			type: 'error',
			text: err,
		});
	});
};

const lookup = (ev) => {
	os.popupMenu([{
		text: i18n.ts.user,
		icon: 'ti ti-user',
		action: () => {
			lookupUser();
		},
	}, {
		text: i18n.ts.note,
		icon: 'ti ti-pencil',
		action: () => {
			alert('TODO');
		},
	}, {
		text: i18n.ts.file,
		icon: 'ti ti-cloud',
		action: () => {
			alert('TODO');
		},
	}, {
		text: i18n.ts.instance,
		icon: 'ti ti-planet',
		action: () => {
			alert('TODO');
		},
	}], ev.currentTarget ?? ev.target);
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(INFO);

defineExpose({
	header: {
		title: i18n.ts.controlPanel,
	},
});
</script>

<style lang="scss" scoped>
.hiyeyicy {
	&.wide {
		display: flex;
		margin: 0 auto;
		height: 100%;

		> .nav {
			width: 32%;
			max-width: 280px;
			box-sizing: border-box;
			border-right: solid 0.5px var(--divider);
			overflow: auto;
			height: 100%;
		}

		> .main {
			flex: 1;
			min-width: 0;
		}
	}

	> .nav {
		.lxpfedzu {
			> .info {
				margin: 16px 0;
			}

			> .banner {
				margin: 16px;

				> .icon {
					display: block;
					margin: auto;
					height: 42px;
					border-radius: 8px;
				}
			}
		}
	}
}
</style>
