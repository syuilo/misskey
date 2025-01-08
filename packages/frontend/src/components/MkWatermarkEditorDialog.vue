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
	:withOkButton="true"
	@close="cancel()"
	@ok="save()"
	@closed="emit('closed')"
>
	<template #header><i class="ti ti-ripple"></i> {{ i18n.ts._watermarkEditor.title }}</template>

	<div :class="$style.watermarkEditorRoot">
		<div :class="$style.watermarkEditorInputRoot">
			<div :class="$style.watermarkEditorPreviewRoot">
				<canvas ref="canvasEl" :class="$style.watermarkEditorPreviewCanvas"></canvas>
				<MkLoading v-if="canvasLoading" :class="$style.watermarkEditorPreviewSpinner"/>
				<div :class="$style.watermarkEditorPreviewWrapper">
					<div class="_acrylic" :class="$style.watermarkEditorPreviewTitle">{{ i18n.ts.preview }}</div>
				</div>
			</div>
			<div :class="$style.watermarkEditorSettings" class="_gaps">
				<MkInfo warn>{{ i18n.ts._watermarkEditor.useSmallFile }}</MkInfo>

				<div>
					<div :class="$style.formLabel">{{ i18n.ts.watermark }}</div>
					<div :class="$style.fileSelectorRoot">
						<MkButton :class="$style.fileSelectorButton" inline rounded primary @click="chooseFile">{{ i18n.ts.selectFile }}</MkButton>
						<div :class="['_nowrap', !fileUrl && $style.fileNotSelected]">{{ friendlyFileName }}</div>
					</div>
				</div>

				<template v-if="fileId != null || fileUrl != null">
					<MkRange v-model="sizeRatio" :min="0" :max="1" :step="0.01" :textConverter="(v) => `${Math.floor(v * 100)}%`">
						<template #label>{{ i18n.ts.size }}</template>
					</MkRange>

					<MkRange v-model="transparency" :min="0" :max="1" :step="0.01" :textConverter="(v) => `${Math.floor(v * 100)}%`">
						<template #label>{{ i18n.ts.transparency }}</template>
					</MkRange>

					<MkRange v-model="rotate" :min="-45" :max="45" :textConverter="(v) => `${Math.floor(v)}°`">
						<template #label>{{ i18n.ts.rotate }}</template>
					</MkRange>

					<MkRadios v-model="repeat">
						<template #label>{{ i18n.ts._watermarkEditor.repeatSetting }}</template>
						<option :value="true">{{ i18n.ts._watermarkEditor.repeat }}</option>
						<option :value="false">{{ i18n.ts.normal }}</option>
					</MkRadios>

					<div v-if="watermarkConfig?.repeat !== true">
						<div :class="$style.formLabel">{{ i18n.ts.position }}</div>
						<XAnchorSelector v-model="anchor"/>
					</div>

					<div>
						<div :class="$style.formLabel">{{ i18n.ts._watermarkEditor.padding }}</div>
						<div class="_gaps">
							<XPaddingView :arrow="focusedForm"/>
							<div class="_gaps_s">
								<MkInput v-model="paddingTop" type="number" debounce @focus="focusedForm = 'top'" @blur="focusedForm = null">
									<template #prefix><i class="ti ti-border-top"></i></template>
									<template #suffix>px</template>
								</MkInput>
								<MkInput v-model="paddingLeft" type="number" debounce @focus="focusedForm = 'left'" @blur="focusedForm = null">
									<template #prefix><i class="ti ti-border-left"></i></template>
									<template #suffix>px</template>
								</MkInput>
								<MkInput v-model="paddingRight" type="number" debounce @focus="focusedForm = 'right'" @blur="focusedForm = null">
									<template #prefix><i class="ti ti-border-right"></i></template>
									<template #suffix>px</template>
								</MkInput>
								<MkInput v-model="paddingBottom" type="number" debounce @focus="focusedForm = 'bottom'" @blur="focusedForm = null">
									<template #prefix><i class="ti ti-border-bottom"></i></template>
									<template #suffix>px</template>
								</MkInput>
							</div>
						</div>
					</div>

					<MkSwitch v-if="watermarkConfig?.repeat !== true" v-model="preserveBoundingRect">
						<template #label>{{ i18n.ts._watermarkEditor.preserveBoundingRect }}</template>
						<template #caption>{{ i18n.ts._watermarkEditor.preserveBoundingRectDescription }}</template>
					</MkSwitch>
				</template>
			</div>
		</div>
	</div>
</MkModalWindow>
</template>

<script setup lang="ts">
import { shallowRef, ref, useTemplateRef, computed, watch, onMounted } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkRange from '@/components/MkRange.vue';
import MkInfo from '@/components/MkInfo.vue';
import XAnchorSelector from '@/components/MkWatermarkEditorDialog.anchor.vue';
import XPaddingView from '@/components/MkWatermarkEditorDialog.padding.vue';

import * as os from '@/os.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { selectFile } from '@/scripts/select-file.js';
import { applyWatermark, canApplyWatermark } from '@/scripts/watermark.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

import type { WatermarkUserConfig } from '@/scripts/watermark.js';

const emit = defineEmits<{
	(ev: 'ok'): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

//#region Modalの制御
const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}
//#endregion

//#region 設定
const watermarkConfig = ref<WatermarkUserConfig>(defaultStore.state.watermarkConfig ?? {
	opacity: 0.2,
	repeat: true,
	rotate: 15,
	sizeRatio: 0.2,
});
const anchor = computed({
	get: () => watermarkConfig.value != null && 'anchor' in watermarkConfig.value ? watermarkConfig.value.anchor : null,
	set: (v) => {
		if (v == null || watermarkConfig.value?.repeat === true) {
			const { anchor, ...newValue } = watermarkConfig.value;
			watermarkConfig.value = newValue;
		} else if (watermarkConfig.value?.repeat === false) {
			watermarkConfig.value = { ...watermarkConfig.value, anchor: v };
		}
	},
});
const sizeRatio = computed({
	get: () => watermarkConfig.value?.sizeRatio ?? 0.2,
	set: (v) => watermarkConfig.value = { ...watermarkConfig.value, sizeRatio: v },
});
const repeat = computed({
	get: () => watermarkConfig.value?.repeat ?? true,
	set: (v) => watermarkConfig.value = { ...watermarkConfig.value, repeat: v },
});
const transparency = computed({
	get: () => 1 - (watermarkConfig.value?.opacity ?? 0.2),
	set: (v) => watermarkConfig.value = { ...watermarkConfig.value, opacity: (1 - v) },
});
const rotate = computed({
	get: () => watermarkConfig.value?.rotate ?? 15,
	set: (v) => watermarkConfig.value = { ...watermarkConfig.value, rotate: v },
});
const preserveBoundingRect = computed({
	get: () => !(watermarkConfig.value?.noBoundingBoxExpansion ?? false),
	set: (v) => watermarkConfig.value = { ...watermarkConfig.value, noBoundingBoxExpansion: !v },
});

function setPadding(pos: 'top' | 'left' | 'right' | 'bottom', val: number) {
	const padding = {
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		...watermarkConfig.value?.padding,
		[pos]: val,
	};
	watermarkConfig.value = { ...watermarkConfig.value, padding };
}

const paddingTop = computed({
	get: () => watermarkConfig.value?.padding?.top ?? 0,
	set: (v) => setPadding('top', v),
});
const paddingLeft = computed({
	get: () => watermarkConfig.value?.padding?.left ?? 0,
	set: (v) => setPadding('left', v),
});
const paddingRight = computed({
	get: () => watermarkConfig.value?.padding?.right ?? 0,
	set: (v) => setPadding('right', v),
});
const paddingBottom = computed({
	get: () => watermarkConfig.value?.padding?.bottom ?? 0,
	set: (v) => setPadding('bottom', v),
});

function save() {
	if (canApplyWatermark(watermarkConfig.value)) {
		defaultStore.set('watermarkConfig', watermarkConfig.value);
	} else {
		os.alert({
			type: 'warning',
			title: i18n.ts._watermarkEditor.settingInvalidWarn,
			text: i18n.ts._watermarkEditor.settingInvalidWarnDescription,
		});
		return;
	}

	emit('ok');
	dialogEl.value?.close();
}
//#endregion

//#region ファイル選択
const fileId = computed({
	get: () => watermarkConfig.value?.fileId,
	set: (v) => watermarkConfig.value = { ...watermarkConfig.value, fileId: v },
});
const fileUrl = computed({
	get: () => watermarkConfig.value?.fileUrl,
	set: (v) => watermarkConfig.value = { ...watermarkConfig.value, fileUrl: v },
});
const fileName = ref<string>('');
const driveFileError = ref(false);
onMounted(async () => {
	if (watermarkConfig.value?.fileId != null) {
		await misskeyApi('drive/files/show', {
			fileId: watermarkConfig.value.fileId,
		}).then((res) => {
			fileName.value = res.name;
		}).catch((err) => {
			driveFileError.value = true;
		});
	}
});
const friendlyFileName = computed<string>(() => {
	if (fileName.value) {
		return fileName.value;
	}
	if (fileUrl.value) {
		return fileUrl.value;
	}

	return i18n.ts._soundSettings.driveFileWarn;
});

function chooseFile(ev: MouseEvent) {
	selectFile(ev.currentTarget ?? ev.target, {
		label: i18n.ts.selectFile,
		dontUseWatermark: true,
	}).then((file) => {
		if (!file.type.startsWith('image')) {
			os.alert({
				type: 'warning',
				title: i18n.ts._watermarkEditor.driveFileTypeWarn,
				text: i18n.ts._watermarkEditor.driveFileTypeWarnDescription,
			});
			return;
		}

		fileId.value = file.id;
		fileUrl.value = file.url;
		fileName.value = file.name;
		driveFileError.value = false;
	});
}
//#endregion

//#region Canvasの制御
const canvasLoading = ref(true);
const canvasEl = useTemplateRef('canvasEl');
onMounted(() => {
	watch(watermarkConfig, (watermarkConfigTo) => {
		canvasLoading.value = true;
		if (canvasEl.value) {
			// @/scripts/watermark.ts の DEFAULT_ASPECT_RATIO と同じ縦横比の画像を使用すること
			applyWatermark('/client-assets/hill.webp', canvasEl.value, canApplyWatermark(watermarkConfigTo) ? watermarkConfigTo : null).then(() => {
				canvasLoading.value = false;
			});
		}
	}, { immediate: true, deep: true });
});
//#endregion

//#region paddingViewの制御
const focusedForm = ref<'top' | 'left' | 'right' | 'bottom' | null>(null);
//#endregion
</script>

<style module>
.watermarkEditorRoot {
	container-type: inline-size;
	height: 100%;
}

.watermarkEditorInputRoot {
	height: 100%;
	display: grid;
	grid-template-columns: 1fr 400px;
}

.watermarkEditorPreviewRoot {
	position: relative;
	background-color: var(--MI_THEME-bg);
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 6px, var(--MI_THEME-panel) 6px, var(--MI_THEME-panel) 12px);
	cursor: not-allowed;
}

.watermarkEditorPreviewWrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.watermarkEditorPreviewTitle {
	position: absolute;
	z-index: 100;
	top: 8px;
	left: 8px;
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 85%;
}

.watermarkEditorPreviewSpinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	user-select: none;
	-webkit-user-drag: none;
}

.watermarkEditorPreviewCanvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	padding: 20px;
	box-sizing: border-box;
	object-fit: contain;
}

.watermarkEditorSettings {
	padding: 24px;
	overflow-y: scroll;
}

.formLabel {
	font-size: 0.85em;
	padding: 0 0 8px 0;
}

.fileSelectorRoot {
	display: flex;
	align-items: center;
	gap: 8px;
}

.fileErrorRoot {
	flex-grow: 1;
	min-width: 0;
	font-weight: 700;
	color: var(--MI_THEME-error);
}

.fileSelectorButton {
	flex-shrink: 0;
}

.fileNotSelected {
	font-weight: 700;
	color: var(--MI_THEME-infoWarnFg);
}

@container (max-width: 800px) {
	.watermarkEditorInputRoot {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
