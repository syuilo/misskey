<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-cy-mkw-slideshow class="kvausudm _panel mkw-slideshow" :style="{ height: widgetProps.height + 'px' }">
	<div @click="choose">
		<p v-if="widgetProps.folderId == null">
			{{ i18n.ts.folder }}
		</p>
		<p v-if="widgetProps.folderId != null && images.length === 0 && !fetching">{{ i18n.t('no-image') }}</p>
		<div ref="slideA" class="slide a"></div>
		<div ref="slideB" class="slide b"></div>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, ref, shallowRef } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { i18n } from '@/i18n';

const name = 'slideshow';

const widgetPropsDef = {
	height: {
		type: 'number' as const,
		default: 300,
	},
	folderId: {
		type: 'string' as const,
		default: null,
		hidden: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const images = ref([]);
const fetching = ref(true);
const slideA = shallowRef<HTMLElement>();
const slideB = shallowRef<HTMLElement>();

const change = () => {
	if (images.value.length === 0) return;

	const index = Math.floor(Math.random() * images.value.length);
	const img = `url(${ images.value[index].url })`;

	slideB.value.style.backgroundImage = img;

	slideB.value.classList.add('anime');
	window.setTimeout(() => {
		// 既にこのウィジェットがunmountされていたら要素がない
		if (slideA.value == null) return;

		slideA.value.style.backgroundImage = img;

		slideB.value.classList.remove('anime');
	}, 1000);
};

const fetch = () => {
	fetching.value = true;

	os.api('drive/files', {
		folderId: widgetProps.folderId,
		type: 'image/*',
		limit: 100,
	}).then(res => {
		images.value = res;
		fetching.value = false;
		slideA.value.style.backgroundImage = '';
		slideB.value.style.backgroundImage = '';
		change();
	});
};

const choose = () => {
	os.selectDriveFolder(false).then(folder => {
		if (folder == null) {
			return;
		}
		widgetProps.folderId = folder.id;
		save();
		fetch();
	});
};

useInterval(change, 10000, {
	immediate: false,
	afterMounted: true,
});

onMounted(() => {
	if (widgetProps.folderId != null) {
		fetch();
	}
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
.kvausudm {
	position: relative;

	> div {
		width: 100%;
		height: 100%;
		cursor: pointer;

		> p {
			display: block;
			margin: 1em;
			text-align: center;
			color: #888;
		}

		> * {
			pointer-events: none;
		}

		> .slide {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-size: cover;
			background-position: center;

			&.b {
				opacity: 0;
			}

			&.anime {
				transition: opacity 1s;
				opacity: 1;
			}
		}
	}
}
</style>
