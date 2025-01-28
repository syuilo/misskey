<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :naked="widgetProps.transparent" :showHeader="false" class="mkw-instance-cloud">
	<div class="">
		<MkTagCloud v-if="activeInstances">
			<li v-for="instance in activeInstances" :key="instance.id">
				<a @click.prevent="onInstanceClick(instance)">
					<img style="width: 32px;" :src="getInstanceIcon(instance)">
				</a>
			</li>
		</MkTagCloud>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkTagCloud from '@/components/MkTagCloud.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useInterval } from '@@/js/use-interval.js';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy.js';

const name = 'instanceCloud';

const widgetPropsDef = {
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

const cloud = shallowRef<InstanceType<typeof MkTagCloud> | null>();
const activeInstances = shallowRef<Misskey.entities.FederationInstance[] | null>(null);

function onInstanceClick(i) {
	os.pageWindow(`/instance-info/${i.host}`);
}

useInterval(() => {
	misskeyApi('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 25,
	}).then(res => {
		activeInstances.value = res;
		if (cloud.value) cloud.value.update();
	});
}, 1000 * 60 * 3, {
	immediate: true,
	afterMounted: true,
});

function getInstanceIcon(instance): string {
	return getProxiedImageUrlNullable(instance.iconUrl, 'preview') ?? getProxiedImageUrlNullable(instance.faviconUrl, 'preview') ?? '/client-assets/dummy.png';
}

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
