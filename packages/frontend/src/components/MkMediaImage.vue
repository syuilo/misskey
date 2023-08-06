<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="hide ? $style.hidden : $style.visible" :style="darkMode ? '--c: rgb(255 255 255 / 2%);' : '--c: rgb(0 0 0 / 2%);'" @click="onclick">
	<a
		:class="$style.imageContainer"
		:href="image.url"
		:title="image.name"
	>
		<ImgWithBlurhash
			:hash="image.blurhash"
			:src="(defaultStore.state.enableDataSaverMode && hide) ? null : url"
			:forceBlurhash="hide"
			:cover="hide"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:width="image.properties.width"
			:height="image.properties.height"
			:style="hide ? 'filter: brightness(0.5);' : null"
		/>
	</a>
	<template v-if="hide">
		<div :class="$style.hiddenText">
			<div :class="$style.hiddenTextWrapper">
				<b v-if="image.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ defaultStore.state.enableDataSaverMode ? ` (${i18n.ts.image}${image.size ? ' ' + bytes(image.size) : ''})` : '' }}</b>
				<b v-else style="display: block;"><i class="ti ti-photo"></i> {{ defaultStore.state.enableDataSaverMode && image.size ? bytes(image.size) : i18n.ts.image }}</b>
				<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
			</div>
		</div>
	</template>
	<template v-else>
		<div :class="$style.indicators">
			<div v-if="['image/gif', 'image/apng'].includes(image.type)" :class="$style.indicator">GIF</div>
			<div v-if="image.comment" :class="$style.indicator">ALT</div>
			<div v-if="image.isSensitive" :class="$style.indicator" style="color: var(--warn);" :title="i18n.ts.sensitive"><i class="ti ti-eye-exclamation"></i></div>
		</div>
		<button :class="$style.menu" class="_button" @click.stop="showMenu"><i class="ti ti-dots" style="vertical-align: middle;"></i></button>
		<i class="ti ti-eye-off" :class="$style.hide" @click.stop="hide = true"></i>
	</template>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { watch } from 'vue';
import * as misskey from 'misskey-js';
import { getStaticImageUrl } from '@/scripts/media-proxy';
import bytes from '@/filters/bytes';
import ImgWithBlurhash from '@/components/MkImgWithBlurhash.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { iAmModerator } from '@/account';

const props = defineProps<{
	image: misskey.entities.DriveFile;
	raw?: boolean;
}>();

let hide = $ref(true);
let darkMode: boolean = $ref(defaultStore.state.darkMode);

const url = $computed(() => (props.raw || defaultStore.state.loadRawImages)
	? props.image.url
	: defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(props.image.url)
		: props.image.thumbnailUrl,
);

function onclick() {
	if (hide) {
		hide = false;
	}
}

// Plugin:register_note_view_interruptor を使って書き換えられる可能性があるためwatchする
watch(() => props.image, () => {
	hide = (defaultStore.state.nsfw === 'force' || defaultStore.state.enableDataSaverMode) ? true : (props.image.isSensitive && defaultStore.state.nsfw !== 'ignore');
}, {
	deep: true,
	immediate: true,
});

function showMenu(ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts.hide,
		icon: 'ti ti-eye-off',
		action: () => {
			hide = true;
		},
	}, ...(iAmModerator ? [{
		text: i18n.ts.markAsSensitive,
		icon: 'ti ti-eye-exclamation',
		danger: true,
		action: () => {
			os.apiWithDialog('drive/files/update', { fileId: props.image.id, isSensitive: true });
		},
	}] : [])], ev.currentTarget ?? ev.target);
}

</script>

<style lang="scss" module>
.hidden {
	position: relative;
}

.hiddenText {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
}

.hide {
	display: block;
	position: absolute;
	border-radius: 6px;
	background-color: var(--fg);
	color: var(--accentLighten);
	font-size: 12px;
	opacity: .5;
	padding: 5px 8px;
	text-align: center;
	cursor: pointer;
	top: 12px;
	right: 12px;
}

.hiddenTextWrapper {
	display: table-cell;
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.visible {
	position: relative;
	//box-shadow: 0 0 0 1px var(--divider) inset;
	background: var(--bg);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--bg) 16.67%, var(--bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--bg) 66.67%, var(--bg) 100%);
	background-size: 16px 16px;
}

.menu {
	display: block;
	position: absolute;
	border-radius: 999px;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	color: #fff;
	font-size: 0.8em;
	width: 28px;
	height: 28px;
	text-align: center;
	bottom: 10px;
	right: 10px;
}

.imageContainer {
	display: block;
	cursor: zoom-in;
	overflow: hidden;
	width: 100%;
	height: 100%;
	background-position: center;
	background-size: contain;
	background-repeat: no-repeat;
}

.indicators {
	display: inline-flex;
	position: absolute;
	top: 10px;
	left: 10px;
	pointer-events: none;
	opacity: .5;
	gap: 6px;
}

.indicator {
	/* Hardcode to black because either --bg or --fg makes it hard to read in dark/light mode */
	background-color: black;
	border-radius: 6px;
	color: var(--accentLighten);
	display: inline-block;
	font-weight: bold;
	font-size: 0.8em;
	padding: 2px 5px;
}
</style>
