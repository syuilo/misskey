<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-adaptive-bg :class="[$style.root, { yellow: user.isSilenced, red: user.isSuspended, gray: false }]">
	<MkAvatar class="avatar" :user="user" indicator/>
	<div class="body">
		<span class="name"><MkUserName class="name" :user="user"/></span>
		<span class="sub"><span class="acct _monospace">@{{ acct(user) }}</span></span>
	</div>
	<MkMiniChart v-if="chartValues" class="chart" :src="chartValues"/>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import * as misskey from 'misskey-js';
import { onMounted } from 'vue';
import MkMiniChart from '@/components/MkMiniChart.vue';
import * as os from '@/os';
import { acct } from '@/filters/user';

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
	withChart: boolean;
}>(), {
	withChart: true,
});

let chartValues = $ref<number[] | null>(null);

onMounted(() => {
	if (props.withChart) {
		os.apiGet('charts/user/notes', { userId: props.user.id, limit: 16 + 1, span: 'day' }).then(res => {
			// 今日のぶんの値はまだ途中の値であり、それも含めると大抵の場合前日よりも下降しているようなグラフになってしまうため今日は弾く
			res.inc.splice(0, 1);
			chartValues = res.inc;
		});
	}
});
</script>

<style lang="scss" module>
.root {
	$bodyTitleHieght: 18px;
	$bodyInfoHieght: 16px;

	display: flex;
	align-items: center;
	padding: 16px;
	background: var(--panel);
	border-radius: 8px;

	> :global(.avatar) {
		display: block;
		width: ($bodyTitleHieght + $bodyInfoHieght);
		height: ($bodyTitleHieght + $bodyInfoHieght);
		margin-right: 12px;
	}

	> :global(.body) {
		flex: 1;
		overflow: hidden;
		font-size: 0.9em;
		color: var(--fg);
		padding-right: 8px;

		> :global(.name) {
			display: block;
			width: 100%;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			line-height: $bodyTitleHieght;
		}

		> :global(.sub) {
			display: block;
			width: 100%;
			font-size: 95%;
			opacity: 0.7;
			line-height: $bodyInfoHieght;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	> :global(.chart) {
		height: 30px;
	}

	&:global(.yellow) {
		--c: rgb(255 196 0 / 15%);
		background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
		background-size: 16px 16px;
	}

	&:global(.red) {
		--c: rgb(255 0 0 / 15%);
		background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
		background-size: 16px 16px;
	}

	&:global(.gray) {
		--c: var(--bg);
		background-image: linear-gradient(45deg, var(--c) 16.67%, transparent 16.67%, transparent 50%, var(--c) 50%, var(--c) 66.67%, transparent 66.67%, transparent 100%);
		background-size: 16px 16px;
	}
}
</style>
