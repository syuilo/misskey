<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="windowEl"
	:initialWidth="400"
	:initialHeight="500"
	:canResize="true"
	@close="windowEl?.close()"
	@closed="emit('closed')"
>
	<template #header>:{{ name }}:</template>

	<div style="display: flex; flex-direction: column; min-height: 100%;">
		<MkSpacer :marginMin="20" :marginMax="28" style="flex-grow: 1;">
			<div class="_gaps_m">
				<div v-if="imgUrl != null" :class="$style.imgs">
					<div style="background: #000;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img" :alt="name"/>
					</div>
					<div style="background: #222;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img" :alt="name"/>
					</div>
					<div style="background: #ddd;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img" :alt="name"/>
					</div>
					<div style="background: #fff;" :class="$style.imgContainer">
						<img :src="imgUrl" :class="$style.img" :alt="name"/>
					</div>
				</div>

				<MkKeyValue>
					<template #key>{{ i18n.ts.id }}</template>
					<template #value>{{ name }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.host }}</template>
					<template #value>{{ host }}</template>
				</MkKeyValue>
				<MkKeyValue>
					<template #key>{{ i18n.ts.license }}</template>
					<template #value>{{ license }}</template>
				</MkKeyValue>
			</div>
		</MkSpacer>
		<div :class="$style.footer">
			<MkButton primary rounded style="margin: 0 auto;" @click="done">
				<i class="ti ti-plus"></i> {{ i18n.ts.import }}
			</MkButton>
		</div>
	</div>
</MkWindow>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkWindow from '@/components/MkWindow.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

const props = defineProps<{
	emoji: {
		id: string,
		name: string,
		host: string,
		license: string | null,
		url: string
	},
}>();

const emit = defineEmits<{
	// 必要なら戻り値を増やす
	(ev: 'done'): void,
	(ev: 'closed'): void
}>();

const windowEl = ref<InstanceType<typeof MkWindow> | null>(null);

const name = computed(() => props.emoji.name);
const host = computed(() => props.emoji.host);
const license = computed(() => props.emoji.license);
const imgUrl = computed(() => props.emoji.url);

async function done() {
	await os.apiWithDialog('admin/emoji/copy', {
		emojiId: props.emoji.id,
	});

	emit('done');
	windowEl.value?.close();
}
</script>

<style lang="scss" module>
.imgs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: center;
}

.imgContainer {
	padding: 8px;
	border-radius: 6px;
}

.img {
	display: block;
	height: 64px;
	width: 64px;
	object-fit: contain;
}

.footer {
	position: sticky;
	z-index: 10000;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	background: var(--MI_THEME-acrylicBg);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>
