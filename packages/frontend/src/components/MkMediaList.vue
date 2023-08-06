<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root">
	<XBanner v-for="media in mediaList.filter(media => !previewable(media))" :key="media.id" :media="media"/>
	<div v-if="mediaList.filter(media => previewable(media)).length > 0" :class="$style.container">
		<div
			ref="gallery"
			:class="[
				$style.medias,
				count === 1 ? [$style.n1, {
					[$style.n116_9]: defaultStore.reactiveState.mediaListWithOneImageAppearance.value === '16_9',
					[$style.n11_1]: defaultStore.reactiveState.mediaListWithOneImageAppearance.value === '1_1',
					[$style.n12_3]: defaultStore.reactiveState.mediaListWithOneImageAppearance.value === '2_3',
				}] : count === 2 ? $style.n2 : count === 3 ? $style.n3 : count === 4 ? $style.n4 : $style.nMany,
			]"
		>
			<template v-for="media in mediaList.filter(media => previewable(media))">
				<XVideo v-if="media.type.startsWith('video')" :key="`video:${media.id}`" :class="$style.media" :video="media"/>
				<XImage v-else-if="media.type.startsWith('image')" :key="`image:${media.id}`" :class="$style.media" class="image" :data-id="media.id" :image="media" :raw="raw"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
/**
 * アスペクト比算出のためにHTMLElement.clientWidthを使うが、
 * 大変重たいのでコンテナ要素とメディアリスト幅のペアをキャッシュする
 * （タイムラインごとにスクロールコンテナが存在する前提だが……）
 */
const widthCache = new Map<Element, number>();

/**
 * コンテナ要素がリサイズされたらキャッシュを削除する
 */
const ro = new ResizeObserver(entries => {
	for (const entry of entries) {
		widthCache.delete(entry.target);
	}
});

async function getClientWidthWithCache(targetEl: HTMLElement, containerEl: HTMLElement, count = 0) {
	if (_DEV_) console.log('getClientWidthWithCache', { targetEl, containerEl, count, cache: widthCache.get(containerEl) });
	if (widthCache.has(containerEl)) return widthCache.get(containerEl)!;

	const width = targetEl.clientWidth;

	if (count <= 10 && width < 64) {
		// widthが64未満はおかしいのでリトライする
		await new Promise(resolve => setTimeout(resolve, 50));
		return getClientWidthWithCache(targetEl, containerEl, count + 1);
	}

	widthCache.set(containerEl, width);
	ro.observe(containerEl);
	return width;
}
</script>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, onUnmounted, shallowRef } from 'vue';
import * as misskey from 'misskey-js';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import XBanner from '@/components/MkMediaBanner.vue';
import XImage from '@/components/MkMediaImage.vue';
import XVideo from '@/components/MkMediaVideo.vue';
import * as os from '@/os';
import { FILE_TYPE_BROWSERSAFE } from '@/const';
import { defaultStore } from '@/store';
import { getScrollContainer, getBodyScrollHeight } from '@/scripts/scroll';

const props = defineProps<{
	mediaList: misskey.entities.DriveFile[];
	raw?: boolean;
}>();

const root = shallowRef<HTMLDivElement>();
const container = shallowRef<HTMLElement | null | undefined>(undefined);
const gallery = shallowRef<HTMLDivElement>();
const pswpZIndex = os.claimZIndex('middle');
document.documentElement.style.setProperty('--mk-pswp-root-z-index', pswpZIndex.toString());
const count = $computed(() => props.mediaList.filter(media => previewable(media)).length);
let lightbox: PhotoSwipeLightbox | null;

const popstateHandler = (): void => {
	if (lightbox.pswp && lightbox.pswp.isOpen === true) {
		lightbox.pswp.close();
	}
};

/**
 * アスペクト比をmediaListWithOneImageAppearanceに基づいていい感じに調整する
 * aspect-ratioではなくheightを使う
 */
async function calcAspectRatio() {
	if (!gallery.value || !root.value) return;

	let img = props.mediaList[0];

	if (props.mediaList.length !== 1 || !(img.properties.width && img.properties.height)) {
		gallery.value.style.aspectRatio = '';
		return;
	}

	if (!container.value) container.value = getScrollContainer(root.value);
	const width = container.value ? await getClientWidthWithCache(root.value, container.value) : root.value.clientWidth;

	const heightMin = (ratio: number) => {
		const imgResizeRatio = width / img.properties.width;
		const imgDrawHeight = img.properties.height * imgResizeRatio;
		const maxHeight = width * ratio;
		const height = Math.min(imgDrawHeight, maxHeight);
		if (_DEV_) console.log('Image height calculated:', { width, properties: img.properties, imgResizeRatio, imgDrawHeight, maxHeight, height });
		return `${height}px`;
	};

	switch (defaultStore.state.mediaListWithOneImageAppearance) {
		case '16_9':
			gallery.value.style.height = heightMin(9 / 16);
			break;
		case '1_1':
			gallery.value.style.height = heightMin(1);
			break;
		case '2_3':
			gallery.value.style.height = heightMin(3 / 2);
			break;
		default: {
			const maxHeight = Math.max(64, (container.value ? container.value.clientHeight : getBodyScrollHeight()) * 0.5 || 360);
			if (width === 0 || !maxHeight) return;
			const imgResizeRatio = width / img.properties.width;
			const imgDrawHeight = img.properties.height * imgResizeRatio;
			gallery.value.style.height = `${Math.max(64, Math.min(imgDrawHeight, maxHeight))}px`;
			gallery.value.style.minHeight = 'initial';
			gallery.value.style.maxHeight = 'initial';
			break;
		}
	}

	gallery.value.style.aspectRatio = 'initial';
}

onMounted(() => {
	calcAspectRatio();

	lightbox = new PhotoSwipeLightbox({
		dataSource: props.mediaList
			.filter(media => {
				if (media.type === 'image/svg+xml') return true; // svgのwebpublicはpngなのでtrue
				return media.type.startsWith('image') && FILE_TYPE_BROWSERSAFE.includes(media.type);
			})
			.map(media => {
				const item = {
					src: media.url,
					w: media.properties.width,
					h: media.properties.height,
					alt: media.comment ?? media.name,
					comment: media.comment ?? media.name,
				};
				if (media.properties.orientation != null && media.properties.orientation >= 5) {
					[item.w, item.h] = [item.h, item.w];
				}
				return item;
			}),
		gallery: gallery.value,
		mainClass: 'pswp',
		children: '.image',
		thumbSelector: '.image',
		loop: false,
		padding: window.innerWidth > 500 ? {
			top: 32,
			bottom: 90,
			left: 32,
			right: 32,
		} : {
			top: 0,
			bottom: 78,
			left: 0,
			right: 0,
		},
		imageClickAction: 'close',
		tapAction: 'close',
		bgOpacity: 1,
		showAnimationDuration: 100,
		hideAnimationDuration: 100,
		pswpModule: PhotoSwipe,
	});

	lightbox.on('itemData', (ev) => {
		const { itemData } = ev;

		// element is children
		const { element } = itemData;

		const id = element.dataset.id;
		const file = props.mediaList.find(media => media.id === id);
		if (!file) return;

		itemData.src = file.url;
		itemData.w = Number(file.properties.width);
		itemData.h = Number(file.properties.height);
		if (file.properties.orientation != null && file.properties.orientation >= 5) {
			[itemData.w, itemData.h] = [itemData.h, itemData.w];
		}
		itemData.msrc = file.thumbnailUrl;
		itemData.alt = file.comment ?? file.name;
		itemData.comment = file.comment ?? file.name;
		itemData.thumbCropped = true;
	});

	lightbox.on('uiRegister', () => {
		lightbox.pswp.ui.registerElement({
			name: 'altText',
			className: 'pwsp__alt-text-container',
			appendTo: 'wrapper',
			onInit: (el, pwsp) => {
				let textBox = document.createElement('p');
				textBox.className = 'pwsp__alt-text _acrylic';
				el.appendChild(textBox);

				pwsp.on('change', (a) => {
					textBox.textContent = pwsp.currSlide.data.comment;
				});
			},
		});
	});

	lightbox.init();

	window.addEventListener('popstate', popstateHandler);

	lightbox.on('beforeOpen', () => {
		history.pushState(null, '', '#pswp');
	});

	lightbox.on('close', () => {
		if (window.location.hash === '#pswp') {
			history.back();
		}
	});
});

onUnmounted(() => {
	window.removeEventListener('popstate', popstateHandler);
	lightbox?.destroy();
	lightbox = null;
});

const previewable = (file: misskey.entities.DriveFile): boolean => {
	if (file.type === 'image/svg+xml') return true; // svgのwebpublic/thumbnailはpngなのでtrue
	// FILE_TYPE_BROWSERSAFEに適合しないものはブラウザで表示するのに不適切
	return (file.type.startsWith('video') || file.type.startsWith('image')) && FILE_TYPE_BROWSERSAFE.includes(file.type);
};
</script>

<style lang="scss" module>
.container {
	position: relative;
	width: 100%;
	margin-top: 4px;
}

.medias {
	display: grid;
	grid-gap: 8px;

	height: 100%;
	width: 100%;

	&.n1 {
		grid-template-rows: 1fr;

		// default but fallback (expand)
		min-height: 64px;
		max-height: clamp(
			64px,
			50cqh,
			min(360px, 50vh)
		);

		&.n116_9 {
			min-height: initial;
			max-height: initial;
			aspect-ratio: 16 / 9; // fallback
		}

		&.n11_1{
			min-height: initial;
			max-height: initial;
			aspect-ratio: 1 / 1; // fallback
		}

		&.n12_3 {
			min-height: initial;
			max-height: initial;
			aspect-ratio: 2 / 3; // fallback
		}
	}

	&.n2 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr;
	}

	&.n3 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 0.5fr;
		grid-template-rows: 1fr 1fr;

		> .media:nth-child(1) {
			grid-row: 1 / 3;
		}

		> .media:nth-child(3) {
			grid-column: 2 / 3;
			grid-row: 2 / 3;
		}
	}

	&.n4 {
		aspect-ratio: 16/9;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
	}

	&.nMany {
		grid-template-columns: 1fr 1fr;

		> .media {
			aspect-ratio: 16/9;
		}
	}
}

.media {
	overflow: hidden; // clipにするとバグる
	border-radius: 8px;
}

:global(.pswp) {
	--pswp-root-z-index: var(--mk-pswp-root-z-index, 2000700) !important;
	--pswp-bg: var(--modalBg) !important;
}
</style>

<style lang="scss">
.pswp__bg {
	background: var(--modalBg);
	backdrop-filter: var(--modalBgFilter);
}

.pwsp__alt-text-container {
	display: flex;
	flex-direction: row;
	align-items: center;

	position: absolute;
	bottom: 20px;
	left: 50%;
	transform: translateX(-50%);

	width: 75%;
	max-width: 800px;
}

.pwsp__alt-text {
	color: var(--fg);
	margin: 0 auto;
	text-align: center;
	padding: var(--margin);
	border-radius: var(--radius);
	max-height: 8em;
	overflow-y: auto;
	text-shadow: var(--bg) 0 0 10px, var(--bg) 0 0 3px, var(--bg) 0 0 3px;
	white-space: pre-line;
}
</style>
