<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div data-cy-mkw-jobQueue class="mkw-jobQueue _monospace" :class="{ _panel: !widgetProps.transparent }">
	<div class="inbox">
		<div class="label">Inbox queue<i v-if="current.inbox.waiting > 0" class="ti ti-alert-triangle icon"></i></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div :class="{ inc: current.inbox.activeSincePrevTick > prev.inbox.activeSincePrevTick, dec: current.inbox.activeSincePrevTick < prev.inbox.activeSincePrevTick }" :title="`${current.inbox.activeSincePrevTick}`">{{ kmg(current.inbox.activeSincePrevTick, 2) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div :class="{ inc: current.inbox.active > prev.inbox.active, dec: current.inbox.active < prev.inbox.active }" :title="`${current.inbox.active}`">{{ kmg(current.inbox.active, 2) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div :class="{ inc: current.inbox.delayed > prev.inbox.delayed, dec: current.inbox.delayed < prev.inbox.delayed }" :title="`${current.inbox.delayed}`">{{ kmg(current.inbox.delayed, 2) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div :class="{ inc: current.inbox.waiting > prev.inbox.waiting, dec: current.inbox.waiting < prev.inbox.waiting }" :title="`${current.inbox.waiting}`">{{ kmg(current.inbox.waiting, 2) }}</div>
			</div>
		</div>
	</div>
	<div class="deliver">
		<div class="label">Deliver queue<i v-if="current.deliver.waiting > 0" class="ti ti-alert-triangle icon"></i></div>
		<div class="values">
			<div>
				<div>Process</div>
				<div :class="{ inc: current.deliver.activeSincePrevTick > prev.deliver.activeSincePrevTick, dec: current.deliver.activeSincePrevTick < prev.deliver.activeSincePrevTick }" :title="`${current.deliver.activeSincePrevTick}`">{{ kmg(current.deliver.activeSincePrevTick, 2) }}</div>
			</div>
			<div>
				<div>Active</div>
				<div :class="{ inc: current.deliver.active > prev.deliver.active, dec: current.deliver.active < prev.deliver.active }" :title="`${current.deliver.active}`">{{ kmg(current.deliver.active, 2) }}</div>
			</div>
			<div>
				<div>Delayed</div>
				<div :class="{ inc: current.deliver.delayed > prev.deliver.delayed, dec: current.deliver.delayed < prev.deliver.delayed }" :title="`${current.deliver.delayed}`">{{ kmg(current.deliver.delayed, 2) }}</div>
			</div>
			<div>
				<div>Waiting</div>
				<div :class="{ inc: current.deliver.waiting > prev.deliver.waiting, dec: current.deliver.waiting < prev.deliver.waiting }" :title="`${current.deliver.waiting}`">{{ kmg(current.deliver.waiting, 2) }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, reactive, ref } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { GetFormResultType } from '@/scripts/form.js';
import { useStream } from '@/stream.js';
import kmg from '@/filters/kmg.js';
import * as sound from '@/scripts/sound.js';
import { deepClone } from '@/scripts/clone.js';
import { defaultStore } from '@/store.js';

const name = 'jobQueue';

const widgetPropsDef = {
	transparent: {
		type: 'boolean' as const,
		default: false,
	},
	sound: {
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

const connection = useStream().useChannel('queueStats');
const current = reactive({
	inbox: {
		activeSincePrevTick: 0,
		active: 0,
		waiting: 0,
		delayed: 0,
	},
	deliver: {
		activeSincePrevTick: 0,
		active: 0,
		waiting: 0,
		delayed: 0,
	},
});
const prev = reactive({} as typeof current);
const jammedAudioBuffer = ref<AudioBuffer | null>(null);
const jammedSoundNodePlaying = ref<boolean>(false);

if (defaultStore.state.sound_masterVolume) {
	sound.loadAudio('/client-assets/sounds/syuilo/queue-jammed.mp3').then(buf => {
		if (!buf) throw new Error('[WidgetJobQueue] Failed to initialize AudioBuffer');
		jammedAudioBuffer.value = buf;
	});
}

for (const domain of ['inbox', 'deliver']) {
	prev[domain] = deepClone(current[domain]);
}

const onStats = (stats) => {
	for (const domain of ['inbox', 'deliver']) {
		prev[domain] = deepClone(current[domain]);
		current[domain].activeSincePrevTick = stats[domain].activeSincePrevTick;
		current[domain].active = stats[domain].active;
		current[domain].waiting = stats[domain].waiting;
		current[domain].delayed = stats[domain].delayed;

		if (current[domain].waiting > 0 && widgetProps.sound && jammedAudioBuffer.value && !jammedSoundNodePlaying.value) {
			const soundNode = sound.createSourceNode(jammedAudioBuffer.value, {}).soundSource;
			if (soundNode) {
				jammedSoundNodePlaying.value = true;
				soundNode.onended = () => jammedSoundNodePlaying.value = false;
				soundNode.start();
			}
		}
	}
};

const onStatsLog = (statsLog) => {
	for (const stats of [...statsLog].reverse()) {
		onStats(stats);
	}
};

connection.on('stats', onStats);
connection.on('statsLog', onStatsLog);

connection.send('requestLog', {
	id: Math.random().toString().substring(2, 10),
	length: 1,
});

onUnmounted(() => {
	connection.off('stats', onStats);
	connection.off('statsLog', onStatsLog);
	connection.dispose();
});

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" scoped>
@keyframes warnBlink {
	0% { opacity: 1; }
	50% { opacity: 0; }
}

.mkw-jobQueue {
	font-size: 0.9em;

	> div {
		padding: 16px;

		&:not(:first-child) {
			border-top: solid 0.5px var(--MI_THEME-divider);
		}

		> .label {
			display: flex;

			> .icon {
				color: var(--MI_THEME-warn);
				margin-left: auto;
				animation: warnBlink 1s infinite;
			}
		}

		> .values {
			display: flex;

			> div {
				flex: 1;

				> div:first-child {
					opacity: 0.7;
				}

				> div:last-child {
					&.inc {
						color: var(--MI_THEME-warn);
					}

					&.dec {
						color: var(--MI_THEME-success);
					}
				}
			}
		}
	}
}
</style>
