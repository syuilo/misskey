<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="1000"
	:height="600"
	:scroll="false"
	:withOkButton="false"
	@close="cancel()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-code"></i> {{ i18n.ts._embedCodeGen.title }}</template>

	<div :class="$style.embedCodeGenRoot">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<div v-if="phase === 'input'" key="input" :class="$style.embedCodeGenInputRoot">
				<div
					:class="$style.embedCodeGenPreviewRoot"
				>
					<MkLoading v-if="iframeLoading" :class="$style.embedCodeGenPreviewSpinner"/>
					<div :class="$style.embedCodeGenPreviewWrapper">
						<div class="_acrylic" :class="$style.embedCodeGenPreviewTitle">{{ i18n.ts.preview }}</div>
						<div ref="resizerRootEl" :class="$style.embedCodeGenPreviewResizerRoot" inert>
							<div
								:class="$style.embedCodeGenPreviewResizer"
								:style="{ transform: iframeStyle }"
							>
								<iframe
									ref="iframeEl"
									:src="embedPreviewUrl"
									:class="$style.embedCodeGenPreviewIframe"
									:style="{ height: `${iframeHeight}px` }"
									@load="iframeOnLoad"
								></iframe>
							</div>
						</div>
					</div>
				</div>
				<div :class="$style.embedCodeGenSettings" class="_gaps">
					<MkInput v-if="isEmbedWithScrollbar" v-model="maxHeight" type="number" :min="0">
						<template #label>{{ i18n.ts._embedCodeGen.maxHeight }}</template>
						<template #suffix>px</template>
						<template #caption>{{ i18n.ts._embedCodeGen.maxHeightDescription }}</template>
					</MkInput>
					<MkSelect v-model="colorMode">
						<template #label>{{ i18n.ts.theme }}</template>
						<option value="auto">{{ i18n.ts.syncDeviceDarkMode }}</option>
						<option value="light">{{ i18n.ts.light }}</option>
						<option value="dark">{{ i18n.ts.dark }}</option>
					</MkSelect>
					<MkSwitch v-if="isEmbedWithScrollbar" v-model="header">{{ i18n.ts._embedCodeGen.header }}</MkSwitch>
					<MkSwitch v-model="rounded">{{ i18n.ts._embedCodeGen.rounded }}</MkSwitch>
					<MkSwitch v-model="border">{{ i18n.ts._embedCodeGen.border }}</MkSwitch>
					<MkInfo v-if="isEmbedWithScrollbar && (!maxHeight || maxHeight <= 0)" warn>{{ i18n.ts._embedCodeGen.maxHeightWarn }}</MkInfo>
					<MkInfo v-if="typeof maxHeight === 'number' && (maxHeight <= 0 || maxHeight > 700)">{{ i18n.ts._embedCodeGen.previewIsNotActual }}</MkInfo>
					<div class="_buttons">
						<MkButton :disabled="iframeLoading" @click="applyToPreview">{{ i18n.ts._embedCodeGen.applyToPreview }}</MkButton>
						<MkButton :disabled="iframeLoading" primary @click="generate">{{ i18n.ts._embedCodeGen.generateCode }} <i class="ti ti-arrow-right"></i></MkButton>
					</div>
				</div>
			</div>
			<div v-else-if="phase === 'result'" key="result" :class="$style.embedCodeGenResultRoot">
				<div :class="$style.embedCodeGenResultWrapper" class="_gaps">
					<div class="_gaps_s">
						<div :class="$style.embedCodeGenResultHeadingIcon"><i class="ti ti-check"></i></div>
						<div :class="$style.embedCodeGenResultHeading">{{ i18n.ts._embedCodeGen.codeGenerated }}</div>
						<div :class="$style.embedCodeGenResultDescription">{{ i18n.ts._embedCodeGen.codeGeneratedDescription }}</div>
					</div>
					<div class="_gaps_s">
						<MkCode :code="result" lang="html" :forceShow="true" :copyButton="false" :class="$style.embedCodeGenResultCode"/>
						<MkButton :class="$style.embedCodeGenResultButtons" rounded primary @click="doCopy"><i class="ti ti-copy"></i> {{ i18n.ts.copy }}</MkButton>
					</div>
					<MkButton :class="$style.embedCodeGenResultButtons" rounded transparent @click="close">{{ i18n.ts.close }}</MkButton>
				</div>
			</div>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { shallowRef, ref, computed, nextTick, onMounted, onDeactivated, onUnmounted } from 'vue';
import { url } from '@@/js/config.js';
import { embedRouteWithScrollbar } from '@@/js/embed-page.js';
import type { EmbeddableEntity, EmbedParams } from '@@/js/embed-page.js';
import MkModalWindow from '@/components/MkModalWindow.vue';

import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkButton from '@/components/MkButton.vue';

import MkCode from '@/components/MkCode.vue';
import MkInfo from '@/components/MkInfo.vue';

import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { normalizeEmbedParams, getEmbedCode } from '@/scripts/get-embed-code.js';

const emit = defineEmits<{
	(ev: 'ok'): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const props = defineProps<{
	entity: EmbeddableEntity;
	id: string;
	params?: EmbedParams;
}>();

//#region Modalの制御
const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

function close() {
	dialogEl.value?.close();
}

const phase = ref<'input' | 'result'>('input');
//#endregion

//#region 埋め込みURL生成・カスタマイズ

// 本URL生成用params
const paramsForUrl = computed<EmbedParams>(() => ({
	header: header.value,
	maxHeight: typeof maxHeight.value === 'number' ? Math.max(0, maxHeight.value) : undefined,
	colorMode: colorMode.value === 'auto' ? undefined : colorMode.value,
	rounded: rounded.value,
	border: border.value,
}));

// プレビュー用params（手動で更新を掛けるのでref）
const paramsForPreview = ref<EmbedParams>(props.params ?? {});

const embedPreviewUrl = computed(() => {
	const paramClass = new URLSearchParams(normalizeEmbedParams(paramsForPreview.value));
	if (paramClass.has('maxHeight')) {
		const maxHeight = parseInt(paramClass.get('maxHeight')!);
		paramClass.set('maxHeight', maxHeight === 0 ? '500' : Math.min(maxHeight, 700).toString()); // プレビューであまりにも縮小されると見づらいため、700pxまでに制限
	}
	return `${url}/embed/${props.entity}/${props.id}${paramClass.toString() ? '?' + paramClass.toString() : ''}`;
});

const isEmbedWithScrollbar = computed(() => embedRouteWithScrollbar.includes(props.entity));
const header = ref(props.params?.header ?? true);
const maxHeight = ref(props.params?.maxHeight !== 0 ? props.params?.maxHeight ?? undefined : 500);

const colorMode = ref<'light' | 'dark' | 'auto'>(props.params?.colorMode ?? 'auto');
const rounded = ref(props.params?.rounded ?? true);
const border = ref(props.params?.border ?? true);

function applyToPreview() {
	const currentPreviewUrl = embedPreviewUrl.value;

	paramsForPreview.value = {
		header: header.value,
		maxHeight: typeof maxHeight.value === 'number' ? Math.max(0, maxHeight.value) : undefined,
		colorMode: colorMode.value === 'auto' ? undefined : colorMode.value,
		rounded: rounded.value,
		border: border.value,
	};

	nextTick(() => {
		if (currentPreviewUrl === embedPreviewUrl.value) {
			// URLが変わらなくてもリロード
			iframeEl.value?.contentWindow?.location.reload();
		}
	});
}

const result = ref('');

function generate() {
	result.value = getEmbedCode(`/embed/${props.entity}/${props.id}`, paramsForUrl.value);
	phase.value = 'result';
}

function doCopy() {
	copyToClipboard(result.value);
	os.success();
}
//#endregion

//#region プレビューのリサイズ
const resizerRootEl = shallowRef<HTMLDivElement>();
const iframeLoading = ref(true);
const iframeEl = shallowRef<HTMLIFrameElement>();
const iframeHeight = ref(0);
const iframeScale = ref(1);
const iframeStyle = computed(() => {
	return `translate(-50%, -50%) scale(${iframeScale.value})`;
});
const resizeObserver = new ResizeObserver(() => {
	calcScale();
});

function iframeOnLoad() {
	iframeEl.value?.contentWindow?.addEventListener('beforeunload', () => {
		iframeLoading.value = true;
		nextTick(() => {
			iframeHeight.value = 0;
			iframeScale.value = 1;
		});
	});
}

function windowEventHandler(event: MessageEvent) {
	if (event.source !== iframeEl.value?.contentWindow) {
		return;
	}
	if (event.data.type === 'misskey:embed:ready') {
		iframeEl.value!.contentWindow?.postMessage({
			type: 'misskey:embedParent:registerIframeId',
			payload: {
				iframeId: 'embedCodeGen', // 同じタイミングで複数のembed iframeがある際の区別用なのでここではなんでもいい
			},
		});
	}
	if (event.data.type === 'misskey:embed:changeHeight') {
		iframeHeight.value = event.data.payload.height;
		nextTick(() => {
			calcScale();
			iframeLoading.value = false; // 初回の高さ変更まで待つ
		});
	}
}

function calcScale() {
	if (!resizerRootEl.value) return;
	const previewWidth = resizerRootEl.value.clientWidth - 40; // 左右の余白 20pxずつ
	const previewHeight = resizerRootEl.value.clientHeight - 40; // 上下の余白 20pxずつ
	const iframeWidth = 500;
	const scale = Math.min(previewWidth / iframeWidth, previewHeight / iframeHeight.value, 1); // 拡大はしないので1を上限に
	iframeScale.value = scale;
}

onMounted(() => {
	window.addEventListener('message', windowEventHandler);
	if (!resizerRootEl.value) return;
	resizeObserver.observe(resizerRootEl.value);
});

function reset() {
	window.removeEventListener('message', windowEventHandler);
	resizeObserver.disconnect();

	// プレビューのリセット
	iframeHeight.value = 0;
	iframeScale.value = 1;
	iframeLoading.value = true;
	result.value = '';
	phase.value = 'input';
}

onDeactivated(() => {
	reset();
});

onUnmounted(() => {
	reset();
});
//#endregion
</script>

<style module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.embedCodeGenRoot {
	container-type: inline-size;
	height: 100%;
}

.embedCodeGenInputRoot {
	height: 100%;
	display: grid;
	grid-template-columns: 1fr 400px;
}

.embedCodeGenPreviewRoot {
	position: relative;
	background-color: var(--MI_THEME-bg);
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 6px, var(--MI_THEME-panel) 6px, var(--MI_THEME-panel) 12px);
	cursor: not-allowed;
}

.embedCodeGenPreviewWrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.embedCodeGenPreviewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.embedCodeGenPreviewSpinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.embedCodeGenPreviewResizerRoot {
	position: relative;
	flex: 1 0;
}

.embedCodeGenPreviewResizer {
	position: absolute;
	top: 50%;
	left: 50%;
}

.embedCodeGenPreviewIframe {
	display: block;
	border: none;
	width: 500px;
	color-scheme: light dark;
}

.embedCodeGenSettings {
	padding: 24px;
	overflow-y: scroll;
}

.embedCodeGenResultRoot {
	box-sizing: border-box;
	padding: 24px;
	height: 100%;
	max-width: 700px;
	margin: 0 auto;
	display: flex;
	align-items: center;
}

.embedCodeGenResultHeading {
	text-align: center;
	font-size: 1.2em;
}

.embedCodeGenResultHeadingIcon {
	margin: 0 auto;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	text-align: center;
	height: 64px;
	width: 64px;
	font-size: 24px;
	line-height: 64px;
	border-radius: 50%;
}

.embedCodeGenResultDescription {
	text-align: center;
	white-space: pre-wrap;
}

.embedCodeGenResultWrapper,
.embedCodeGenResultCode {
	width: 100%;
}

.embedCodeGenResultButtons {
	margin: 0 auto;
}

@container (max-width: 800px) {
	.embedCodeGenInputRoot {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
