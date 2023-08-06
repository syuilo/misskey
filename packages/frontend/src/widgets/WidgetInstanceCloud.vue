<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
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
// @ts-nocheck
import { } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import MkContainer from '@/components/MkContainer.vue';
import MkTagCloud from '@/components/MkTagCloud.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { getProxiedImageUrlNullable } from '@/scripts/media-proxy';

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

let cloud = $shallowRef<InstanceType<typeof MkTagCloud> | null>();
let activeInstances = $shallowRef(null);

function onInstanceClick(i) {
	os.pageWindow(`/instance-info/${i.host}`);
}

useInterval(() => {
	os.api('federation/instances', {
		sort: '+latestRequestReceivedAt',
		limit: 25,
	}).then(res => {
		activeInstances = res;
		if (cloud) cloud.update();
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
