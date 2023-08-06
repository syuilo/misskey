<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="pending">
	<MkLoading/>
</div>
<div v-else-if="resolved">
	<slot :result="result"></slot>
</div>
<div v-else>
	<div :class="$style.error">
		<div><i class="ti ti-alert-triangle"></i> {{ i18n.ts.somethingHappened }}</div>
		<MkButton inline style="margin-top: 16px;" @click="retry"><i class="ti ti-reload"></i> {{ i18n.ts.retry }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

const props = defineProps<{
	p: () => Promise<any>;
}>();

const pending = ref(true);
const resolved = ref(false);
const rejected = ref(false);
const result = ref(null);

const process = () => {
	if (props.p == null) {
		return;
	}
	const promise = props.p();
	pending.value = true;
	resolved.value = false;
	rejected.value = false;
	promise.then((_result) => {
		pending.value = false;
		resolved.value = true;
		result.value = _result;
	});
	promise.catch(() => {
		pending.value = false;
		rejected.value = true;
	});
};

watch(() => props.p, () => {
	process();
}, {
	immediate: true,
});

const retry = () => {
	process();
};
</script>

<style lang="scss" module>
.error {
	padding: 16px;
	text-align: center;
}
</style>
