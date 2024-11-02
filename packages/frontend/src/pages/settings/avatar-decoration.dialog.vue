<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	@close="cancel"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.avatarDecorations }}</template>

	<div>
		<MkSpacer :marginMin="20" :marginMax="28">
			<div style="text-align: center;">
				<div :class="$style.name">{{ decoration.name }}</div>
				<MkAvatar style="width: 64px; height: 64px; margin-bottom: 20px;" :user="$i" :decorations="decorationsForPreview" forceShowDecoration/>
			</div>
			<div class="_gaps_s">
				<MkRange v-model="angle" continuousUpdate :min="-0.5" :max="0.5" :step="0.025" :textConverter="(v) => `${Math.floor(v * 360)}°`">
					<template #label>{{ i18n.ts.angle }}</template>
				</MkRange>
				<MkRange v-model="offsetX" continuousUpdate :min="-0.25" :max="0.25" :step="0.025" :textConverter="(v) => `${Math.floor(v * 100)}%`">
					<template #label>X {{ i18n.ts.position }}</template>
				</MkRange>
				<MkRange v-model="offsetY" continuousUpdate :min="-0.25" :max="0.25" :step="0.025" :textConverter="(v) => `${Math.floor(v * 100)}%`">
					<template #label>Y {{ i18n.ts.position }}</template>
				</MkRange>
				<MkSwitch v-model="flipH">
					<template #label>{{ i18n.ts.flip }}</template>
				</MkSwitch>
			</div>
		</MkSpacer>

		<div :class="$style.footer" class="_buttonsCenter">
			<MkButton v-if="usingIndex != null" primary rounded @click="update"><i class="ti ti-check"></i> {{ i18n.ts.update }}</MkButton>
			<MkButton v-if="usingIndex != null" rounded @click="detach"><i class="ti ti-x"></i> {{ i18n.ts.detach }}</MkButton>
			<MkButton v-else :disabled="exceeded || locked" primary rounded @click="attach"><i class="ti ti-check"></i> {{ i18n.ts.attach }}</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { shallowRef, ref, computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { i18n } from '@/i18n.js';
import MkRange from '@/components/MkRange.vue';
import { signinRequired } from '@/account.js';

const $i = signinRequired();

const props = defineProps<{
	usingIndex: number | null;
	decoration: {
		id: string;
		url: string;
		name: string;
		roleIdsThatCanBeUsedThisDecoration: string[];
	};
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'attach', payload: {
		angle: number;
		flipH: boolean;
		offsetX: number;
		offsetY: number;
	}): void;
	(ev: 'update', payload: {
		angle: number;
		flipH: boolean;
		offsetX: number;
		offsetY: number;
	}): void;
	(ev: 'detach'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();
const exceeded = computed(() => ($i.policies.avatarDecorationLimit - $i.avatarDecorations.length) <= 0);
const locked = computed(() => props.decoration.roleIdsThatCanBeUsedThisDecoration.length > 0 && !$i.roles.some(r => props.decoration.roleIdsThatCanBeUsedThisDecoration.includes(r.id)));
const angle = ref((props.usingIndex != null ? $i.avatarDecorations[props.usingIndex].angle : null) ?? 0);
const flipH = ref((props.usingIndex != null ? $i.avatarDecorations[props.usingIndex].flipH : null) ?? false);
const offsetX = ref((props.usingIndex != null ? $i.avatarDecorations[props.usingIndex].offsetX : null) ?? 0);
const offsetY = ref((props.usingIndex != null ? $i.avatarDecorations[props.usingIndex].offsetY : null) ?? 0);

const decorationsForPreview = computed(() => {
	const decoration = {
		id: props.decoration.id,
		url: props.decoration.url,
		angle: angle.value,
		flipH: flipH.value,
		offsetX: offsetX.value,
		offsetY: offsetY.value,
		blink: true,
	};
	const decorations = [...$i.avatarDecorations];
	if (props.usingIndex != null) {
		decorations[props.usingIndex] = decoration;
	} else {
		decorations.push(decoration);
	}
	return decorations;
});

function cancel() {
	dialog.value?.close();
}

async function update() {
	emit('update', {
		angle: angle.value,
		flipH: flipH.value,
		offsetX: offsetX.value,
		offsetY: offsetY.value,
	});
	dialog.value?.close();
}

async function attach() {
	emit('attach', {
		angle: angle.value,
		flipH: flipH.value,
		offsetX: offsetX.value,
		offsetY: offsetY.value,
	});
	dialog.value?.close();
}

async function detach() {
	emit('detach');
	dialog.value?.close();
}
</script>

<style lang="scss" module>
.name {
	position: relative;
	z-index: 10;
	font-weight: bold;
	margin-bottom: 28px;
}

.footer {
	position: sticky;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--MI_THEME-divider);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
}
</style>
