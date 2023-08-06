<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<XColumn :menu="menu" :column="column" :isStacked="isStacked">
	<template #header>
		<i class="ti ti-device-tv"></i><span style="margin-left: 8px;">{{ column.name }}</span>
	</template>

	<template v-if="column.channelId">
		<div style="padding: 8px; text-align: center;">
			<MkButton primary gradate rounded inline @click="post"><i class="ti ti-pencil"></i></MkButton>
		</div>
		<MkTimeline ref="timeline" src="channel" :channel="column.channelId"/>
	</template>
</XColumn>
</template>

<script lang="ts" setup>
// @ts-nocheck
import * as misskey from 'misskey-js';
import XColumn from './column.vue';
import { updateColumn, Column } from './deck-store';
import MkTimeline from '@/components/MkTimeline.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';

const props = defineProps<{
	column: Column;
	isStacked: boolean;
}>();

let timeline = $shallowRef<InstanceType<typeof MkTimeline>>();
let channel = $shallowRef<misskey.entities.Channel>();

if (props.column.channelId == null) {
	setChannel();
}

async function setChannel() {
	const channels = await os.api('channels/my-favorites', {
		limit: 100,
	});
	const { canceled, result: channel } = await os.select({
		title: i18n.ts.selectChannel,
		items: channels.map(x => ({
			value: x, text: x.name,
		})),
		default: props.column.channelId,
	});
	if (canceled) return;
	updateColumn(props.column.id, {
		channelId: channel.id,
		name: channel.name,
	});
}

async function post() {
	if (!channel || channel.id !== props.column.channelId) {
		channel = await os.api('channels/show', {
			channelId: props.column.channelId,
		});
	}

	os.post({
		channel,
	});
}

const menu = [{
	icon: 'ti ti-pencil',
	text: i18n.ts.selectChannel,
	action: setChannel,
}];
</script>
