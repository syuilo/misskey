<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="700" :marginMin="16" :marginMax="32">
			<div class="_gaps_m">
				<div>{{ i18n.ts._serverRules.description }}</div>
				<Sortable
					v-model="serverRules"
					class="_gaps_m"
					:itemKey="(_, i) => i"
					:animation="150"
					:handle="'.' + $style.itemHandle"
					@start="e => e.item.classList.add('active')"
					@end="e => e.item.classList.remove('active')"
				>
					<template #item="{element,index}">
						<div :class="$style.item">
							<div :class="$style.itemHeader">
								<div :class="$style.itemNumber" v-text="String(index + 1)"/>
								<span :class="$style.itemHandle"><i class="ti ti-menu"/></span>
								<button class="_button" :class="$style.itemRemove" @click="remove(index)"><i class="ti ti-x"></i></button>
							</div>
							<MkInput v-model="serverRules[index]"/>
						</div>
					</template>
				</Sortable>
				<div :class="$style.commands">
					<MkButton rounded @click="serverRules.push('')"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
					<MkButton primary rounded @click="save"><i class="ti ti-check"></i> {{ i18n.ts.save }}</MkButton>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, computed } from 'vue';
import XHeader from './_header_.vue';
import * as os from '@/os.js';
import { fetchInstance, instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const serverRules = ref<string[]>(instance.serverRules);

const save = async () => {
	await os.apiWithDialog('admin/update-meta', {
		serverRules: serverRules.value,
	});
	fetchInstance(true);
};

const remove = (index: number): void => {
	serverRules.value.splice(index, 1);
};

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.serverRules,
	icon: 'ti ti-checkbox',
}));
</script>

<style lang="scss" module>
.item {
	display: block;
	color: var(--MI_THEME-navFg);
}

.itemHeader {
	display: flex;
	margin-bottom: 8px;
	align-items: center;
}

.itemHandle {
	display: flex;
	width: 40px;
	height: 40px;
	align-items: center;
	justify-content: center;
	cursor: move;
}

.itemNumber {
	display: flex;
	background-color: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 14px;
	font-weight: bold;
	width: 28px;
	height: 28px;
	align-items: center;
	justify-content: center;
	border-radius: 999px;
	margin-right: 8px;
}

.itemEdit {
	width: 100%;
	max-width: 100%;
	min-width: 100%;
}

.itemRemove {
	width: 40px;
	height: 40px;
	color: var(--MI_THEME-error);
	margin-left: auto;
	border-radius: 6px;

	&:hover {
		background: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	}
}

.commands {
	display: flex;
	gap: 16px;
}
</style>
