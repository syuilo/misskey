<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<!-- このコンポーネントの要素のclassは親から利用されるのでむやみに弄らないこと -->
<!-- フォルダの中にはカスタム絵文字だけ（Unicode絵文字もこっち） -->
<section v-if="!hasChildSection" v-panel style="border-radius: 6px; border-bottom: 0.5px solid var(--MI_THEME-divider);">
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i> <slot></slot> (<i class="ti ti-icons"></i>:{{ emojis.length }})
	</header>
	<div v-if="shown" class="body">
		<button
			v-for="emoji in emojis"
			:key="emoji"
			:data-emoji="emoji"
			class="_button item"
			:disabled="disabledEmojis?.value.includes(emoji)"
			@pointerenter="computeButtonTitle"
			@click="emit('chosen', emoji, $event)"
		>
			<MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true" :fallbackToImage="true"/>
			<MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
<!-- フォルダの中にはカスタム絵文字やフォルダがある -->
<section v-else v-panel style="border-radius: 6px; border-bottom: 0.5px solid var(--MI_THEME-divider);">
	<header class="_acrylic" @click="shown = !shown">
		<i class="toggle ti-fw" :class="shown ? 'ti ti-chevron-down' : 'ti ti-chevron-up'"></i> <slot></slot> (<i class="ti ti-folder ti-fw"></i>:{{ customEmojiTree?.length }} <i class="ti ti-icons ti-fw"></i>:{{ emojis.length }})
	</header>
	<div v-if="shown" style="padding-left: 9px;">
		<MkEmojiPickerSection
			v-for="child in customEmojiTree"
			:key="`custom:${child.value}`"
			:initialShown="initialShown"
			:emojis="computed(() => customEmojis.filter(e => e.category === child.category).map(e => `:${e.name}:`))"
			:hasChildSection="child.children.length !== 0"
			:customEmojiTree="child.children"
			@chosen="nestedChosen"
		>
			{{ child.value || i18n.ts.other }}
		</MkEmojiPickerSection>
	</div>
	<div v-if="shown" class="body">
		<button
			v-for="emoji in emojis"
			:key="emoji"
			:data-emoji="emoji"
			class="_button item"
			:disabled="disabledEmojis?.value.includes(emoji)"
			@pointerenter="computeButtonTitle"
			@click="emit('chosen', emoji, $event)"
		>
			<MkCustomEmoji v-if="emoji[0] === ':'" class="emoji" :name="emoji" :normal="true"/>
			<MkEmoji v-else class="emoji" :emoji="emoji" :normal="true"/>
		</button>
	</div>
</section>
</template>

<script lang="ts" setup>
import { ref, computed, Ref } from 'vue';
import { CustomEmojiFolderTree, getEmojiName } from '@@/js/emojilist.js';
import { i18n } from '@/i18n.js';
import { customEmojis } from '@/custom-emojis.js';
import MkEmojiPickerSection from '@/components/MkEmojiPicker.section.vue';

const props = defineProps<{
	emojis: string[] | Ref<string[]>;
	disabledEmojis?: Ref<string[]>;
	initialShown?: boolean;
	hasChildSection?: boolean;
	customEmojiTree?: CustomEmojiFolderTree[];
}>();

const emit = defineEmits<{
	(ev: 'chosen', v: string, event: MouseEvent): void;
}>();

const emojis = computed(() => Array.isArray(props.emojis) ? props.emojis : props.emojis.value);

const shown = ref(!!props.initialShown);

/** @see MkEmojiPicker.vue */
function computeButtonTitle(ev: MouseEvent): void {
	const elm = ev.target as HTMLElement;
	const emoji = elm.dataset.emoji as string;
	elm.title = getEmojiName(emoji);
}

function nestedChosen(emoji: string, ev: MouseEvent) {
	emit('chosen', emoji, ev);
}
</script>
