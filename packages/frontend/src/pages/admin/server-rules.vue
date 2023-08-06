<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
// @ts-nocheck
import { defineAsyncComponent } from 'vue';
import XHeader from './_header_.vue';
import * as os from '@/os';
import { fetchInstance, instance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';

const Sortable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

let serverRules: string[] = $ref(instance.serverRules);

const save = async () => {
	await os.apiWithDialog('admin/update-meta', {
		serverRules,
	});
	fetchInstance();
};

const remove = (index: number): void => {
	serverRules.splice(index, 1);
};

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.serverRules,
	icon: 'ti ti-checkbox',
});
</script>

<style lang="scss" module>
.item {
	display: block;
	color: var(--navFg);
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
	background-color: var(--accentedBg);
	color: var(--accent);
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
	color: var(--error);
	margin-left: auto;
	border-radius: 6px;

	&:hover {
		background: var(--X5);
	}
}

.commands {
	display: flex;
	gap: 16px;
}
</style>
