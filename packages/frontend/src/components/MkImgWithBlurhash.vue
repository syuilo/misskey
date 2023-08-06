<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root" :class="['chromatic-ignore', $style.root, { [$style.cover]: cover }]" :title="title ?? ''">
	<TransitionGroup
		:duration="defaultStore.state.animation && props.transition?.duration || undefined"
		:enterActiveClass="defaultStore.state.animation && props.transition?.enterActiveClass || undefined"
		:leaveActiveClass="defaultStore.state.animation && (props.transition?.leaveActiveClass ?? $style.transition_leaveActive) || undefined"
		:enterFromClass="defaultStore.state.animation && props.transition?.enterFromClass || undefined"
		:leaveToClass="defaultStore.state.animation && props.transition?.leaveToClass || undefined"
		:enterToClass="defaultStore.state.animation && props.transition?.enterToClass || undefined"
		:leaveFromClass="defaultStore.state.animation && props.transition?.leaveFromClass || undefined"
	>
		<canvas v-show="hide" key="canvas" ref="canvas" :class="$style.canvas" :width="canvasWidth" :height="canvasHeight" :title="title ?? undefined"/>
		<img v-show="!hide" key="img" ref="img" :height="imgHeight" :width="imgWidth" :class="$style.img" :src="src ?? undefined" :title="title ?? undefined" :alt="alt ?? undefined" loading="eager" decoding="async"/>
	</TransitionGroup>
</div>
</template>

<script lang="ts">
import { $ref } from 'vue/macros';
import DrawBlurhash from '@/workers/draw-blurhash?worker';
import TestWebGL2 from '@/workers/test-webgl2?worker';
import { WorkerMultiDispatch } from '@/scripts/worker-multi-dispatch';
import { extractAvgColorFromBlurhash } from '@/scripts/extract-avg-color-from-blurhash';

const canvasPromise = new Promise<WorkerMultiDispatch | HTMLCanvasElement>(resolve => {
	// テスト環境で Web Worker インスタンスは作成できない
	if (import.meta.env.MODE === 'test') {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;
		resolve(canvas);
		return;
	}
	const testWorker = new TestWebGL2();
	testWorker.addEventListener('message', event => {
		if (event.data.result) {
			const workers = new WorkerMultiDispatch(
				() => new DrawBlurhash(),
				Math.min(navigator.hardwareConcurrency - 1, 4),
			);
			resolve(workers);
			if (_DEV_) console.log('WebGL2 in worker is supported!');
		} else {
			const canvas = document.createElement('canvas');
			canvas.width = 64;
			canvas.height = 64;
			resolve(canvas);
			if (_DEV_) console.log('WebGL2 in worker is not supported...');
		}
		testWorker.terminate();
	});
});
</script>

<script lang="ts" setup>
// @ts-nocheck
import { computed, nextTick, onMounted, onUnmounted, shallowRef, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import { render } from 'buraha';
import { defaultStore } from '@/store';

const props = withDefaults(defineProps<{
	transition?: {
		duration?: number | { enter: number; leave: number; };
		enterActiveClass?: string;
		leaveActiveClass?: string;
		enterFromClass?: string;
		leaveToClass?: string;
		enterToClass?: string;
		leaveFromClass?: string;
	} | null;
	src?: string | null;
	hash?: string;
	alt?: string | null;
	title?: string | null;
	height?: number;
	width?: number;
	cover?: boolean;
	forceBlurhash?: boolean;
	onlyAvgColor?: boolean; // 軽量化のためにBlurhashを使わずに平均色だけを描画
}>(), {
	transition: null,
	src: null,
	alt: '',
	title: null,
	height: 64,
	width: 64,
	cover: true,
	forceBlurhash: false,
	onlyAvgColor: false,
});

const viewId = uuid();
const canvas = shallowRef<HTMLCanvasElement>();
const root = shallowRef<HTMLDivElement>();
const img = shallowRef<HTMLImageElement>();
let loaded = $ref(false);
let canvasWidth = $ref(64);
let canvasHeight = $ref(64);
let imgWidth = $ref(props.width);
let imgHeight = $ref(props.height);
let bitmapTmp = $ref<CanvasImageSource | undefined>();
const hide = computed(() => !loaded || props.forceBlurhash);

function waitForDecode() {
	if (props.src != null && props.src !== '') {
		nextTick()
			.then(() => img.value?.decode())
			.then(() => {
				loaded = true;
			}, error => {
				console.log('Error occurred during decoding image', img.value, error);
			});
	} else {
		loaded = false;
	}
}

watch([() => props.width, () => props.height, root], () => {
	const ratio = props.width / props.height;
	if (ratio > 1) {
		canvasWidth = Math.round(64 * ratio);
		canvasHeight = 64;
	} else {
		canvasWidth = 64;
		canvasHeight = Math.round(64 / ratio);
	}

	const clientWidth = root.value?.clientWidth ?? 300;
	imgWidth = clientWidth;
	imgHeight = Math.round(clientWidth / ratio);
}, {
	immediate: true,
});

function drawImage(bitmap: CanvasImageSource) {
	// canvasがない（mountedされていない）場合はTmpに保存しておく
	if (!canvas.value) {
		bitmapTmp = bitmap;
		return;
	}

	// canvasがあれば描画する
	bitmapTmp = undefined;
	const ctx = canvas.value.getContext('2d');
	if (!ctx) return;
	ctx.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
}

function drawAvg() {
	if (!canvas.value || !props.hash) return;

	const ctx = canvas.value.getContext('2d');
	if (!ctx) return;

	// avgColorでお茶をにごす
	ctx.beginPath();
	ctx.fillStyle = extractAvgColorFromBlurhash(props.hash) ?? '#888';
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

async function draw() {
	if (props.hash == null) return;

	drawAvg();

	if (props.onlyAvgColor) return;

	const work = await canvasPromise;
	if (work instanceof WorkerMultiDispatch) {
		work.postMessage(
			{
				id: viewId,
				hash: props.hash,
			},
			undefined,
		);
	} else {
		try {
			render(props.hash, work);
			drawImage(work);
		} catch (error) {
			console.error('Error occurred during drawing blurhash', error);
		}
	}
}

function workerOnMessage(event: MessageEvent) {
	if (event.data.id !== viewId) return;
	drawImage(event.data.bitmap as ImageBitmap);
}

canvasPromise.then(work => {
	if (work instanceof WorkerMultiDispatch) {
		work.addListener(workerOnMessage);
	}

	draw();
});

watch(() => props.src, () => {
	waitForDecode();
});

watch(() => props.hash, () => {
	draw();
});

onMounted(() => {
	// drawImageがmountedより先に呼ばれている場合はここで描画する
	if (bitmapTmp) {
		drawImage(bitmapTmp);
	}
	waitForDecode();
});

onUnmounted(() => {
	canvasPromise.then(work => {
		if (work instanceof WorkerMultiDispatch) {
			work.removeListener(workerOnMessage);
		}
	});
});
</script>

<style lang="scss" module>
.transition_leaveActive {
	position: absolute;
	top: 0;
	left: 0;
}
.root {
	position: relative;
	width: 100%;
	height: 100%;

	&.cover {
		> .canvas,
		> .img {
			object-fit: cover;
		}
	}
}

.canvas,
.img {
	display: block;
	width: 100%;
	height: 100%;
}

.canvas {
	object-fit: contain;
}

.img {
	object-fit: contain;
}
</style>
