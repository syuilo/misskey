/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getProxiedImageUrl } from "@/scripts/media-proxy.js";

export type WatermarkConfig = {
	fileId: string | null;
	fileUrl: string | null;
	width: number | null;
	height: number | null;
	enlargement: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
	gravity: 'auto' | 'left' | 'right' | 'top' | 'bottom';
	opacity: number;
	repeat: true | false | 'x' | 'y';
	anchor: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	offsetTop: number | null;
	offsetLeft: number | null;
	offsetBottom: number | null;
	offsetRight: number | null;
	backgroundColor: string | null;
	rotate: number | null;
};

/**
 * ウォーターマークを適用してキャンバスに描画する
 *
 * @param img ウォーターマークを適用する画像（stringは画像URL。**プレビュー用途専用**）
 * @param el ウォーターマークを適用するキャンバス
 * @param config ウォーターマークの設定
 */
export function applyWatermark(img: string | Blob, el: HTMLCanvasElement, config: WatermarkConfig) {
	const canvas = el;
	const ctx = canvas.getContext('2d')!;
	const imgEl = new Image();
	imgEl.onload = () => {
		canvas.width = imgEl.width;
		canvas.height = imgEl.height;
		ctx.drawImage(imgEl, 0, 0);
		if (config.fileUrl) {
			const watermark = new Image();
			watermark.onload = () => {
				const width = config.width || watermark.width;
				const height = config.height || watermark.height;
				const x = (() => {
					switch (config.anchor) {
						case 'center':
						case 'top':
						case 'bottom':
							return (canvas.width - width) / 2;
						case 'left':
						case 'top-left':
						case 'bottom-left':
							return 0;
						case 'right':
						case 'top-right':
						case 'bottom-right':
							return canvas.width - width;
					}
				})();
				const y = (() => {
					switch (config.anchor) {
						case 'center':
						case 'left':
						case 'right':
							return (canvas.height - height) / 2;
						case 'top':
						case 'top-left':
						case 'top-right':
							return 0;
						case 'bottom':
						case 'bottom-left':
						case 'bottom-right':
							return canvas.height - height;
					}
				})();
				ctx.globalAlpha = config.opacity;
				ctx.drawImage(watermark, x, y, width, height);
			};
			watermark.src = config.fileUrl;
		}
	};
	if (typeof img === 'string') {
		imgEl.src = getProxiedImageUrl(img, undefined, true);
	} else {
		const reader = new FileReader();
		reader.onload = () => {
			imgEl.src = reader.result as string;
		};
		reader.readAsDataURL(img);
	}
}

/**
 * ウォーターマークを適用した画像をBlobとして取得する
 *
 * @param img ウォーターマークを適用する画像
 * @param config ウォーターマークの設定
 * @returns ウォーターマークを適用した画像のBlob
 */
export function getWatermarkAppliedImage(img: Blob, config: WatermarkConfig): Promise<Blob> {
	const canvas = document.createElement('canvas');
	applyWatermark(img, canvas, config);
	return new Promise<Blob>(resolve => {
		canvas.toBlob(blob => {
			resolve(blob!);
		});
	});
}
