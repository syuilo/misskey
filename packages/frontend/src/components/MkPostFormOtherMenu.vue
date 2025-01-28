<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type, maxHeight }" :zPriority="'high'" :src="src" :transparentBg="true" @click="modal?.close()" @closed="emit('closed')" @esc="modal?.close()">
	<MkMenu
		:items="items"
		:align="align"
		:width="width"
		:maxHeight="maxHeight"
		:asDrawer="type === 'drawer'"
		@close="modal?.close()"
	>
		<template #header>
			<div :class="[$style.textCountRoot, { [$style.asDrawer]: type === 'drawer' }]">
				<div :class="$style.textCountLabel">{{ i18n.ts.textCount }}</div>
				<div
					:class="[$style.textCount,
						{ [$style.danger]: textCountPercentage > 100 },
						{ [$style.warning]: textCountPercentage > 90 && textCountPercentage <= 100 },
					]"
				>
					<div :class="$style.textCountGraph"></div>
					<div><span :class="$style.textCountCurrent">{{ number(textLength) }}</span> / {{ number(maxTextLength) }}</div>
				</div>
			</div>
		</template>
	</MkMenu>
</MkModal>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkModal from '@/components/MkModal.vue';
import MkMenu from '@/components/MkMenu.vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import number from '@/filters/number.js';
import type { MenuItem } from '@/types/menu.js';

const modal = useTemplateRef('modal');

const props = defineProps<{
	items: MenuItem[];
	textLength: number;
	align?: 'center' | string;
	width?: number;
	src?: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'changeReactionAcceptance', value: Misskey.entities.Note['reactionAcceptance']): void;
	(ev: 'reset'): void;
	(ev: 'closed'): void;
}>();

const maxTextLength = computed(() => {
	return instance ? instance.maxNoteTextLength : 1000;
});

const textCountPercentage = computed(() => {
	return props.textLength / maxTextLength.value * 100;
});
</script>

<style lang="scss" module>
.textCountRoot {
	--textCountBg: color-mix(in srgb, var(--MI_THEME-panel), var(--MI_THEME-fg) 15%);
	background-color: var(--textCountBg);
	padding: 10px 14px;

	&.asDrawer {
		padding: 12px 24px;
	}
}

.textCountLabel {
	font-size: 11px;
	opacity: 0.8;
	margin-bottom: 4px;
}

.textCount {
	display: flex;
	gap: var(--MI-marginHalf);
	align-items: center;
	font-size: 12px;
	--countColor: var(--MI_THEME-accent);

	&.danger {
		--countColor: var(--MI_THEME-error);
	}

	&.warning {
		--countColor: var(--MI_THEME-warn);
	}

	.textCountGraph {
		position: relative;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background-image: conic-gradient(
			var(--countColor) 0% v-bind("Math.min(100, textCountPercentage) + '%'"),
			rgba(0, 0, 0, .2) v-bind("Math.min(100, textCountPercentage) + '%'") 100%
		);

		&::after {
			content: '';
			position: absolute;
			width: 16px;
			height: 16px;
			border-radius: 50%;
			background-color: var(--textCountBg);
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}

	.textCountCurrent {
		color: var(--countColor);
		font-weight: 700;
		font-size: 18px;
	}
}
</style>
