/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getProxiedImageUrl } from '@/scripts/media-proxy.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { defaultStore } from '@/store.js';

export const watermarkAnchor = [
	'top-left',
	'top',
	'top-right',
	'left',
	'center',
	'right',
	'bottom-left',
	'bottom',
	'bottom-right',
] as const;

export type WatermarkAnchor = typeof watermarkAnchor[number];

/**
 * Storeへの保存やエディタで使用するための、条件別のプロパティを排除したバージョンの型。
 * `canApplyWatermark`で`WatermarkConfig`に変換可能かどうかを判定できる。
 *
 * どちらかの型を変更したら、もう一方も変更すること。
 */
export type WatermarkUserConfig = {
	/** ドライブファイルのID */
	fileId?: string;
	/** 画像URL */
	fileUrl?: string;
	/** 親画像に対するウォーターマークの幅比率。ない場合は1。親画像が縦長の場合は幅の比率として、横長の場合は高さ比率として使用される */
	sizeRatio?: number;
	/** 不透明度 */
	opacity?: number;
	/** 回転角度（度数） */
	rotate?: number;
	/** パディング */
	padding?: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};

	/** 繰り返し */
	repeat?: boolean;
	/** 画像の始祖点。repeatがtrueの場合は使用されないが、それ以外の場合は必須 */
	anchor?: WatermarkAnchor;
	/** 回転の際に領域を自動で拡張するかどうか。repeatがtrueの場合は使用されない */
	noBoundingBoxExpansion?: boolean;

	/** @internal */
	__bypassMediaProxy?: boolean;
};

/**
 * Canvasへの描画などで使用できる、動作に必要な値を網羅した型。
 * `WatermarkUserConfig`を`canApplyWatermark`でアサートすることで型を変換できる。
 *
 * どちらかの型を変更したら、もう一方も変更すること。
 */
export type WatermarkConfig = {
	/** ドライブファイルのID */
	fileId?: string;
	/** 画像URL */
	fileUrl?: string;
	/** 親画像に対するウォーターマークの幅比率。ない場合は1。親画像が縦長の場合は幅の比率として、横長の場合は高さ比率として使用される */
	sizeRatio?: number;
	/** 不透明度 */
	opacity?: number;
	/** 回転角度（度数） */
	rotate?: number;
	/** パディング */
	padding?: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};

	/** @internal */
	__bypassMediaProxy?: boolean;
} & ({
	/** 繰り返し */
	repeat?: false;
	/** 画像の始祖点 */
	anchor: WatermarkAnchor;
	/** 回転の際に領域を自動で拡張するかどうか */
	noBoundingBoxExpansion?: boolean;
} | {
	/** 繰り返し */
	repeat: true;
});

/** 基準とするアスペクト比（変えたら今後付加されるウォーターマークの大きさが全部変わるので変えるべきではない。プレビュー画像を変えたいなら画像の縦横比をこれに合わせること） */
const DEFAULT_ASPECT_RATIO = 4 / 3;

/**
 * プレビューに必要な値が全部揃っているかどうかを判定する
 */
export function canApplyWatermark(config: Partial<WatermarkConfig | WatermarkUserConfig> | null): config is WatermarkConfig {
	return (
		config != null &&
		(config.fileUrl != null || config.fileId != null) &&
		((config.repeat !== true && 'anchor' in config && config.anchor != null) || (config.repeat === true))
	);
}

/**
 * ウォーターマークを適用してキャンバスに描画する
 *
 * @param img ウォーターマークを適用する画像（stringは画像URL）
 * @param el ウォーターマークを適用するキャンバス
 * @param config ウォーターマークの設定
 */
export function applyWatermark(img: string | Blob, el: HTMLCanvasElement | OffscreenCanvas, config: WatermarkConfig | null) {
	return new Promise<void>(async (resolve) => {
		const canvas = el;
		const ctx = canvas.getContext('2d')!;
		const imgEl = new Image();
		imgEl.onload = async () => {
			canvas.width = imgEl.width;
			canvas.height = imgEl.height;
			ctx.drawImage(imgEl, 0, 0);

			if (config != null) {
				if (config.fileUrl != null || config.fileId != null) {
					const watermark = new Image();
					watermark.onload = () => {
						const watermarkAspectRatio = watermark.width / watermark.height; // 横長は1より大きい
						const { width, height } = (() => {
							// 1. 画像を覆うサイズのプレビュー画像相当の領域を計算
							let canvasPreviewWidth: number;
							let canvasPreviewHeight: number;
							if (canvas.width > canvas.height) {
								canvasPreviewWidth = canvas.width;
								canvasPreviewHeight = canvas.width / DEFAULT_ASPECT_RATIO;
							} else {
								canvasPreviewWidth = canvas.height * DEFAULT_ASPECT_RATIO;
								canvasPreviewHeight = canvas.height;
							}

							// 2. プレビュー画像相当の領域から、幅・高さそれぞれをベースにリサイズした場合の
							// ウォーターマークのサイズを計算
							let width = canvasPreviewWidth * (config.sizeRatio ?? 1);
							let height = canvasPreviewHeight * (config.sizeRatio ?? 1);

							// 3. ウォーターマークのアスペクト比に合わせてリサイズ
							if (watermarkAspectRatio > 1) {
								// ウォーターマークが横長（横幅を基準に縮小）
								height = width / watermarkAspectRatio;
							} else {
								// ウォーターマークが縦長（縦幅を基準に縮小）
								width = height * watermarkAspectRatio;
							}

							return { width, height };
						})();
						const rotateRad = (config.rotate ?? 0) * Math.PI / 180;

						ctx.globalAlpha = config.opacity ?? 1;

						if (config.repeat) {
							// 余白をもたせた状態のウォーターマークを作成しておく（それをパターン繰り返しする）
							const resizedWatermark = document.createElement('canvas');
							resizedWatermark.width = width + (config.padding ? (config.padding.left ?? 0) + (config.padding.right ?? 0) : 0);
							resizedWatermark.height = height + (config.padding ? (config.padding.top ?? 0) + (config.padding.bottom ?? 0) : 0);
							const resizedCtx = resizedWatermark.getContext('2d')!;
							resizedCtx.drawImage(
								watermark,
								(config.padding ? config.padding.left ?? 0 : 0),
								(config.padding ? config.padding.top ?? 0 : 0),
								width,
								height
							);

							const pattern = ctx.createPattern(resizedWatermark, 'repeat');
							if (pattern) {
								ctx.fillStyle = pattern;
								if (config.rotate != null && config.rotate !== 0) {
									ctx.translate(canvas.width / 2, canvas.height / 2);
									ctx.rotate(rotateRad);
									ctx.translate(-canvas.width / 2, -canvas.height / 2);
									const rotatedWidth = Math.abs(canvas.width * Math.cos(rotateRad)) + Math.abs(canvas.height * Math.sin(rotateRad));
									const rotatedHeight = Math.abs(canvas.width * Math.sin(rotateRad)) + Math.abs(canvas.height * Math.cos(rotateRad));
									const x = Math.abs(rotatedWidth - canvas.width) / -2;
									const y = Math.abs(rotatedHeight - canvas.height) / -2;
									ctx.fillRect(x, y, rotatedWidth, rotatedHeight);
								} else {
									ctx.fillRect(0, 0, canvas.width, canvas.height);
								}
							}
						} else {
							const x = (() => {
								let rotateX = 0; // 回転によるX座標の補正

								if (config.rotate != null && config.rotate !== 0 && !config.noBoundingBoxExpansion) {
									rotateX = Math.abs(Math.abs(width * Math.cos(rotateRad)) + Math.abs(height * Math.sin(rotateRad)) - width) / 2;
								}

								switch (config.anchor) {
									case 'center':
									case 'top':
									case 'bottom':
										return (canvas.width - width) / 2;
									case 'left':
									case 'top-left':
									case 'bottom-left':
										return rotateX + (config.padding ? config.padding.left ?? 0 : 0);
									case 'right':
									case 'top-right':
									case 'bottom-right':
										return canvas.width - width - (config.padding ? config.padding.right ?? 0 : 0) - rotateX;
								}
							})();

							const y = (() => {
								let rotateY = 0; // 回転によるY座標の補正

								if (config.rotate != null && config.rotate !== 0 && !config.noBoundingBoxExpansion) {
									rotateY = Math.abs(Math.abs(width * Math.sin(rotateRad)) + Math.abs(height * Math.cos(rotateRad)) - height) / 2;
								}

								switch (config.anchor) {
									case 'center':
									case 'left':
									case 'right':
										return (canvas.height - height) / 2;
									case 'top':
									case 'top-left':
									case 'top-right':
										return rotateY + (config.padding ? config.padding.top ?? 0 : 0);
									case 'bottom':
									case 'bottom-left':
									case 'bottom-right':
										return canvas.height - height - (config.padding ? config.padding.bottom ?? 0 : 0) - rotateY;
								}
							})();
							if (config.rotate) {
								const rotateRad = config.rotate * Math.PI / 180;
								ctx.translate(x + width / 2, y + height / 2);
								ctx.rotate(rotateRad);
								ctx.translate(-x - width / 2, -y - height / 2);
							}
							ctx.drawImage(watermark, x, y, width, height);
						}

						resolve();
					};

					watermark.onerror = () => {
						resolve();
					};

					let watermarkUrl: string;
					if (config.fileUrl == null && config.fileId != null) {
						const res = await misskeyApi('drive/files/show', { fileId: config.fileId });
						watermarkUrl = res.url;
						// 抜けてたら保存
						defaultStore.set('watermarkConfig', { ...config, fileUrl: watermarkUrl });
					} else {
						watermarkUrl = config.fileUrl!;
					}

					watermark.src = config.__bypassMediaProxy ? watermarkUrl : getProxiedImageUrl(watermarkUrl, undefined, true);
				} else {
					resolve();
				}
			} else {
				resolve();
			}
		};

		imgEl.onerror = () => {
			resolve();
		};

		if (typeof img === 'string') {
			imgEl.src = img;
		} else {
			imgEl.src = URL.createObjectURL(img);
		}
	});
}

/**
 * ウォーターマークを適用した画像をBlobとして取得する
 *
 * @param img ウォーターマークを適用する画像
 * @param config ウォーターマークの設定
 * @returns ウォーターマークを適用した画像のBlob
 */
export async function getWatermarkAppliedImage(img: Blob, config: WatermarkConfig): Promise<Blob> {
	const canvas = document.createElement('canvas');
	await applyWatermark(img, canvas, config);
	return new Promise(resolve => canvas.toBlob(blob => resolve(blob!)));
}
