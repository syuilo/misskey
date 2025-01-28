<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<Transition :name="defaultStore.state.animation ? 'fade' : ''" mode="out-in">
			<div v-if="flash" :key="flash.id">
				<Transition :name="defaultStore.state.animation ? 'zoom' : ''" mode="out-in">
					<div v-if="started" :class="$style.started">
						<div class="main _panel">
							<MkAsUi v-if="root" :component="root" :components="components"/>
						</div>
						<div class="actions _panel">
							<div class="items">
								<MkButton v-tooltip="i18n.ts.reload" class="button" rounded @click="reset"><i class="ti ti-reload"></i></MkButton>
							</div>
							<div class="items">
								<MkButton v-if="flash.isLiked" v-tooltip="i18n.ts.unlike" asLike class="button" rounded primary @click="unlike()"><i class="ti ti-heart"></i><span v-if="flash?.likedCount && flash.likedCount > 0" style="margin-left: 6px;">{{ flash.likedCount }}</span></MkButton>
								<MkButton v-else v-tooltip="i18n.ts.like" asLike class="button" rounded @click="like()"><i class="ti ti-heart"></i><span v-if="flash?.likedCount && flash.likedCount > 0" style="margin-left: 6px;">{{ flash.likedCount }}</span></MkButton>
								<MkButton v-tooltip="i18n.ts.copyLink" class="button" rounded @click="copyLink"><i class="ti ti-link ti-fw"></i></MkButton>
								<MkButton v-tooltip="i18n.ts.share" class="button" rounded @click="share"><i class="ti ti-share ti-fw"></i></MkButton>
								<MkButton v-if="$i && $i.id !== flash.user.id" class="button" rounded @mousedown="showMenu"><i class="ti ti-dots ti-fw"></i></MkButton>
							</div>
						</div>
					</div>
					<div v-else :class="$style.ready">
						<div class="_panel main">
							<div class="title">{{ flash.title }}</div>
							<div class="summary"><Mfm :text="flash.summary"/></div>
							<MkButton class="start" gradate rounded large @click="start">Play</MkButton>
							<div class="info">
								<span v-tooltip="i18n.ts.numberOfLikes"><i class="ti ti-heart"></i> {{ flash.likedCount }}</span>
							</div>
						</div>
					</div>
				</Transition>
				<MkFolder :defaultOpen="false" :max-height="280" class="_margin">
					<template #icon><i class="ti ti-code"></i></template>
					<template #label>{{ i18n.ts._play.viewSource }}</template>

					<MkCode :code="flash.script" lang="is" class="_monospace"/>
				</MkFolder>
				<div :class="$style.footer">
					<Mfm :text="`By @${flash.user.username}`"/>
					<div class="date">
						<div v-if="flash.createdAt != flash.updatedAt"><i class="ti ti-clock"></i> {{ i18n.ts.updatedAt }}: <MkTime :time="flash.updatedAt" mode="detail"/></div>
						<div><i class="ti ti-clock"></i> {{ i18n.ts.createdAt }}: <MkTime :time="flash.createdAt" mode="detail"/></div>
					</div>
				</div>
				<MkA v-if="$i && $i.id === flash.userId" :to="`/play/${flash.id}/edit`" style="color: var(--MI_THEME-accent);">{{ i18n.ts._play.editThisPage }}</MkA>
				<MkAd :prefer="['horizontal', 'horizontal-big']"/>
			</div>
			<MkError v-else-if="error" @retry="fetchFlash()"/>
			<MkLoading v-else/>
		</Transition>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onDeactivated, onUnmounted, ref, watch, shallowRef, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import { Interpreter, Parser, values } from '@syuilo/aiscript';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { url } from '@@/js/config.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkAsUi from '@/components/MkAsUi.vue';
import { registerAsUiLib } from '@/scripts/aiscript/ui.js';
import { aiScriptReadline, createAiScriptEnv } from '@/scripts/aiscript/api.js';
import MkFolder from '@/components/MkFolder.vue';
import MkCode from '@/components/MkCode.vue';
import { defaultStore } from '@/store.js';
import { $i } from '@/account.js';
import { isSupportShare } from '@/scripts/navigator.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { pleaseLogin } from '@/scripts/please-login.js';

import type { Ref } from 'vue';
import type { AsUiComponent, AsUiRoot } from '@/scripts/aiscript/ui.js';
import type { MenuItem } from '@/types/menu.js';

const props = defineProps<{
	id: string;
}>();

const flash = ref<Misskey.entities.Flash | null>(null);
const error = ref<any>(null);

function fetchFlash() {
	flash.value = null;
	misskeyApi('flash/show', {
		flashId: props.id,
	}).then(_flash => {
		flash.value = _flash;
	}).catch(err => {
		error.value = err;
	});
}

function share(ev: MouseEvent) {
	if (!flash.value) return;

	const menuItems: MenuItem[] = [];

	menuItems.push({
		text: i18n.ts.shareWithNote,
		icon: 'ti ti-pencil',
		action: shareWithNote,
	});

	if (isSupportShare()) {
		menuItems.push({
			text: i18n.ts.share,
			icon: 'ti ti-share',
			action: shareWithNavigator,
		});
	}

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

function copyLink() {
	if (!flash.value) return;

	copyToClipboard(`${url}/play/${flash.value.id}`);
	os.success();
}

function shareWithNavigator() {
	if (!flash.value) return;

	navigator.share({
		title: flash.value.title,
		text: flash.value.summary,
		url: `${url}/play/${flash.value.id}`,
	});
}

function shareWithNote() {
	if (!flash.value) return;

	os.post({
		initialText: `${flash.value.title}\n${url}/play/${flash.value.id}`,
		instant: true,
	});
}

function like() {
	if (!flash.value) return;
	pleaseLogin();

	os.apiWithDialog('flash/like', {
		flashId: flash.value.id,
	}).then(() => {
		flash.value!.isLiked = true;
		flash.value!.likedCount++;
	});
}

async function unlike() {
	if (!flash.value) return;
	pleaseLogin();

	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('flash/unlike', {
		flashId: flash.value.id,
	}).then(() => {
		flash.value!.isLiked = false;
		flash.value!.likedCount--;
	});
}

watch(() => props.id, fetchFlash, { immediate: true });

const parser = new Parser();

const started = ref(false);
const aiscript = shallowRef<Interpreter | null>(null);
const root = ref<AsUiRoot>();
const components = ref<Ref<AsUiComponent>[]>([]);

function start() {
	started.value = true;
	run();
}

async function run() {
	if (aiscript.value) aiscript.value.abort();
	if (!flash.value) return;

	aiscript.value = new Interpreter({
		...createAiScriptEnv({
			storageKey: 'flash:' + flash.value.id,
		}),
		...registerAsUiLib(components.value, (_root) => {
			root.value = _root.value;
		}),
		THIS_ID: values.STR(flash.value.id),
		THIS_URL: values.STR(`${url}/play/${flash.value.id}`),
	}, {
		in: aiScriptReadline,
		out: (value) => {
			// nop
		},
		log: (type, params) => {
			// nop
		},
	});

	let ast;
	try {
		ast = parser.parse(flash.value.script);
	} catch (err) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}
	try {
		await aiscript.value.exec(ast);
	} catch (err) {
		os.alert({
			type: 'error',
			title: 'AiScript Error',
			text: err.message,
		});
	}
}

function reportAbuse() {
	if (!flash.value) return;

	const pageUrl = `${url}/play/${flash.value.id}`;

	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkAbuseReportWindow.vue')), {
		user: flash.value.user,
		initialComment: `Play: ${pageUrl}\n-----\n`,
	}, {
		closed: () => dispose(),
	});
}

function showMenu(ev: MouseEvent) {
	if (!flash.value) return;

	const menu: MenuItem[] = [
		...($i && $i.id !== flash.value.userId ? [
			{
				icon: 'ti ti-exclamation-circle',
				text: i18n.ts.reportAbuse,
				action: reportAbuse,
			},
			...($i.isModerator || $i.isAdmin ? [
				{
					type: 'divider' as const,
				},
				{
					icon: 'ti ti-trash',
					text: i18n.ts.delete,
					danger: true,
					action: () => os.confirm({
						type: 'warning',
						text: i18n.ts.deleteConfirm,
					}).then(({ canceled }) => {
						if (canceled || !flash.value) return;

						os.apiWithDialog('flash/delete', { flashId: flash.value.id });
					}),
				},
			] : []),
		] : []),
	];

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

function reset() {
	if (aiscript.value) aiscript.value.abort();
	started.value = false;
}

onDeactivated(() => {
	reset();
});

onUnmounted(() => {
	reset();
});

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: flash.value ? flash.value.title : 'Play',
	...flash.value ? {
		avatar: flash.value.user,
		path: `/play/${flash.value.id}`,
		share: {
			title: flash.value.title,
			text: flash.value.summary,
		},
	} : {},
}));
</script>

<style lang="scss" module>
.ready {
	&:global {
		> .main {
			padding: 32px;

			> .title {
				font-size: 1.4em;
				font-weight: bold;
				margin-bottom: 1rem;
				text-align: center;
			}

			> .summary {
				font-size: 1.1em;
				text-align: center;
			}

			> .start {
				margin: 1em auto 1em auto;
			}

			> .info {
				text-align: center;
			}
		}
	}
}

.footer {
	margin-top: 16px;

	&:global {
		> .date {
			margin: 8px 0;
			opacity: 0.6;
		}
	}
}

.started {
	&:global {
		> .main {
			padding: 32px;
		}

		> .actions {
			margin-top: 16px;

			> .items {
				display: flex;
				justify-content: center;
				gap: 12px;
				padding: 16px;
				border-bottom: 1px solid var(--MI_THEME-divider);

				&:last-child {
					border-bottom: none;
				}
			}
		}
	}
}
</style>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.zoom-enter-active,
.zoom-leave-active {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.zoom-enter-from {
	opacity: 0;
	transform: scale(0.7);
}
.zoom-leave-to {
	opacity: 0;
	transform: scale(1.3);
}
</style>
