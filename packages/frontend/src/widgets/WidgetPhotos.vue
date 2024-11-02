<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" :naked="widgetProps.transparent" :class="$style.root" :data-transparent="widgetProps.transparent ? true : null" data-cy-mkw-photos class="mkw-photos">
	<template #icon><i class="ti ti-camera"></i></template>
	<template #header>{{ i18n.ts._widgets.photos }}</template>

	<div class="">
		<MkLoading v-if="fetching"/>
		<div v-else :class="$style.stream">
			<div
				v-for="(image, i) in images" :key="i"
				:class="$style.img"
				:style="`background-image: url(${thumbnail(image)})`"
			></div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import { GetFormResultType } from '@/scripts/form.js';
import { useStream } from '@/stream.js';
import { getStaticImageUrl } from '@/scripts/media-proxy.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import MkContainer from '@/components/MkContainer.vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';

const name = 'photos';

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const connection = useStream().useChannel('main');
const images = ref<Misskey.entities.DriveFile[]>([]);
const fetching = ref(true);

const onDriveFileCreated = (file) => {
	if (/^image\/.+$/.test(file.type)) {
		images.value.unshift(file);
		if (images.value.length > 9) images.value.pop();
	}
};

const thumbnail = (image: Misskey.entities.DriveFile): string => {
	return defaultStore.state.disableShowingAnimatedImages
		? getStaticImageUrl(image.url)
		: image.thumbnailUrl ?? image.url;
};

misskeyApi('drive/stream', {
	type: 'image/*',
	limit: 9,
}).then(res => {
	images.value = res;
	fetching.value = false;
});

connection.on('driveFileCreated', onDriveFileCreated);
onUnmounted(() => {
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.root[data-transparent] {
	.stream {
		padding: 0;
	}

	.img {
		border: solid 4px transparent;
		border-radius: 8px;
	}
}

.stream {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	padding: 8px;

	.img {
		flex: 1 1 33%;
		width: 33%;
		height: 80px;
		box-sizing: border-box;
		background-position: center center;
		background-size: cover;
		background-clip: content-box;
		border: solid 2px transparent;
		border-radius: 4px;
	}
}
</style>
