<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :showHeader="widgetProps.showHeader" class="mkw-bdayfollowings">
	<template #icon><i class="ti ti-cake"></i></template>
	<template #header>{{ i18n.ts._widgets.birthdayFollowings }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="actualFetch()"><i class="ti ti-refresh"></i></button></template>

	<div :class="$style.bdayFRoot">
		<MkLoading v-if="fetching"/>
		<div v-else-if="users.length > 0" :class="$style.bdayFGrid">
			<MkAvatar v-for="user in users" :key="user.id" :user="user.followee" link preview></MkAvatar>
		</div>
		<div v-else :class="$style.bdayFFallback">
			<img :src="infoImageUrl" class="_ghost" :class="$style.bdayFFallbackImage"/>
			<div>{{ i18n.ts.nothing }}</div>
		</div>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';
import { $i } from '@/account.js';

const name = i18n.ts._widgets.birthdayFollowings;

const widgetPropsDef = {
	showHeader: {
		type: 'boolean' as const,
		default: true,
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

const users = ref<Misskey.Endpoints['users/following']['res']>([]);
const fetching = ref(true);
let lastFetchedAt = '1970-01-01';

const fetch = () => {
	if (!$i) {
		users.value = [];
		fetching.value = false;
		return;
	}

	const lfAtD = new Date(lastFetchedAt);
	lfAtD.setHours(0, 0, 0, 0);
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	if (now > lfAtD) {
		actualFetch();

		lastFetchedAt = now.toISOString();
	}
};

function actualFetch() {
	if ($i == null) {
		users.value = [];
		fetching.value = false;
		return;
	}

	const now = new Date();
	now.setHours(0, 0, 0, 0);
	fetching.value = true;
	misskeyApi('users/following', {
		limit: 18,
		birthday: `${now.getFullYear().toString().padStart(4, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
		userId: $i.id,
	}).then(res => {
		users.value = res;
		window.setTimeout(() => {
			// 早すぎるとチカチカする
			fetching.value = false;
		}, 100);
	});
}

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.bdayFRoot {
	overflow: hidden;
	min-height: calc(calc(calc(50px * 3) - 8px) + calc(var(--MI-margin) * 2));
}
.bdayFGrid {
	display: grid;
	grid-template-columns: repeat(6, 42px);
	grid-template-rows: repeat(3, 42px);
	place-content: center;
	gap: 8px;
	margin: var(--MI-margin) auto;
}

.bdayFFallback {
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

.bdayFFallbackImage {
	height: 96px;
	width: auto;
	max-width: 90%;
	margin-bottom: 8px;
	border-radius: var(--MI-radius);
}
</style>
