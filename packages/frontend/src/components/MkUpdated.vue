<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :zPriority="'middle'" @click="$refs.modal.close()" @closed="$emit('closed')">
	<div :class="$style.root">
		<div :class="$style.title"><MkSparkle>{{ i18n.ts.misskeyUpdated }}</MkSparkle></div>
		<div :class="$style.version">✨{{ version }}🚀</div>
		<MkButton full @click="whatIsNew">{{ i18n.ts.whatIsNew }}</MkButton>
		<MkButton :class="$style.gotIt" primary full @click="$refs.modal.close()">{{ i18n.ts.gotIt }}</MkButton>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted, shallowRef } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkSparkle from '@/components/MkSparkle.vue';
import { version } from '@/config';
import { i18n } from '@/i18n';
import { confetti } from '@/scripts/confetti';

const modal = shallowRef<InstanceType<typeof MkModal>>();

const whatIsNew = () => {
	modal.value.close();
	window.open(`https://misskey-hub.net/docs/releases.html#_${version.replace(/\./g, '-')}`, '_blank');
};

onMounted(() => {
	confetti({
		duration: 1000 * 3,
	});
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 32px;
	min-width: 320px;
	max-width: 480px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
}

.title {
	font-weight: bold;
}

.version {
	margin: 1em 0;
}

.gotIt {
	margin: 8px 0 0 0;
}
</style>
