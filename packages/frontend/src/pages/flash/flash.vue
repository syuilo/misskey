<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
							<MkButton v-if="flash.isLiked" v-tooltip="i18n.ts.unlike" asLike class="button" rounded primary @click="unlike()"><i class="ti ti-heart"></i><span v-if="flash.likedCount > 0" style="margin-left: 6px;">{{ flash.likedCount }}</span></MkButton>
							<MkButton v-else v-tooltip="i18n.ts.like" asLike class="button" rounded @click="like()"><i class="ti ti-heart"></i><span v-if="flash.likedCount > 0" style="margin-left: 6px;">{{ flash.likedCount }}</span></MkButton>
							<MkButton v-tooltip="i18n.ts.shareWithNote" class="button" rounded @click="shareWithNote"><i class="ti ti-repeat ti-fw"></i></MkButton>
							<MkButton v-tooltip="i18n.ts.share" class="button" rounded @click="share"><i class="ti ti-share ti-fw"></i></MkButton>
						</div>
					</div>
					<div v-else :class="$style.ready">
						<div class="_panel main">
							<div class="title">{{ flash.title }}</div>
							<div class="summary">{{ flash.summary }}</div>
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

					<MkCode :code="flash.script" :inline="false" class="_monospace"/>
				</MkFolder>
				<div :class="$style.footer">
					<Mfm :text="`By @${flash.user.username}`"/>
					<div class="date">
						<div v-if="flash.createdAt != flash.updatedAt"><i class="ti ti-clock"></i> {{ i18n.ts.updatedAt }}: <MkTime :time="flash.updatedAt" mode="detail"/></div>
						<div><i class="ti ti-clock"></i> {{ i18n.ts.createdAt }}: <MkTime :time="flash.createdAt" mode="detail"/></div>
					</div>
				</div>
				<MkA v-if="$i && $i.id === flash.userId" :to="`/play/${flash.id}/edit`" style="color: var(--accent);">{{ i18n.ts._play.editThisPage }}</MkA>
				<MkAd :prefer="['horizontal', 'horizontal-big']"/>
			</div>
			<MkError v-else-if="error" @retry="fetchPage()"/>
			<MkLoading v-else/>
		</Transition>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, onDeactivated, onUnmounted, Ref, ref, watch } from 'vue';
import { Interpreter, Parser, values } from '@syuilo/aiscript';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { url } from '@/config';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkAsUi from '@/components/MkAsUi.vue';
import { AsUiComponent, AsUiRoot, registerAsUiLib } from '@/scripts/aiscript/ui';
import { createAiScriptEnv } from '@/scripts/aiscript/api';
import MkFolder from '@/components/MkFolder.vue';
import MkCode from '@/components/MkCode.vue';
import { defaultStore } from '@/store';
import { $i } from '@/account';

const props = defineProps<{
	id: string;
}>();

let flash = $ref(null);
let error = $ref(null);

function fetchFlash() {
	flash = null;
	os.api('flash/show', {
		flashId: props.id,
	}).then(_flash => {
		flash = _flash;
	}).catch(err => {
		error = err;
	});
}

function share() {
	navigator.share({
		title: flash.title,
		text: flash.summary,
		url: `${url}/play/${flash.id}`,
	});
}

function shareWithNote() {
	os.post({
		initialText: `${flash.title} ${url}/play/${flash.id}`,
	});
}

function like() {
	os.apiWithDialog('flash/like', {
		flashId: flash.id,
	}).then(() => {
		flash.isLiked = true;
		flash.likedCount++;
	});
}

async function unlike() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('flash/unlike', {
		flashId: flash.id,
	}).then(() => {
		flash.isLiked = false;
		flash.likedCount--;
	});
}

watch(() => props.id, fetchFlash, { immediate: true });

const parser = new Parser();

let started = $ref(false);
let aiscript = $shallowRef<Interpreter | null>(null);
const root = ref<AsUiRoot>();
const components: Ref<AsUiComponent>[] = $ref([]);

function start() {
	started = true;
	run();
}

async function run() {
	if (aiscript) aiscript.abort();

	aiscript = new Interpreter({
		...createAiScriptEnv({
			storageKey: 'flash:' + flash.id,
		}),
		...registerAsUiLib(components, (_root) => {
			root.value = _root.value;
		}),
		THIS_ID: values.STR(flash.id),
		THIS_URL: values.STR(`${url}/play/${flash.id}`),
	}, {
		in: (q) => {
			return new Promise(ok => {
				os.inputText({
					title: q,
				}).then(({ canceled, result: a }) => {
					if (canceled) {
						ok('');
					} else {
						ok(a);
					}
				});
			});
		},
		out: (value) => {
			// nop
		},
		log: (type, params) => {
			// nop
		},
	});

	let ast;
	try {
		ast = parser.parse(flash.script);
	} catch (err) {
		os.alert({
			type: 'error',
			text: 'Syntax error :(',
		});
		return;
	}
	try {
		await aiscript.exec(ast);
	} catch (err) {
		os.alert({
			type: 'error',
			title: 'AiScript Error',
			text: err.message,
		});
	}
}

onDeactivated(() => {
	if (aiscript) aiscript.abort();
});

onUnmounted(() => {
	if (aiscript) aiscript.abort();
});

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => flash ? {
	title: flash.title,
	avatar: flash.user,
	path: `/play/${flash.id}`,
	share: {
		title: flash.title,
		text: flash.summary,
	},
} : null));
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
			display: flex;
			justify-content: center;
			gap: 12px;
			margin-top: 16px;
			padding: 16px;
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
