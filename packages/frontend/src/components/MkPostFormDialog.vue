<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" @click="modal.close()" @closed="onModalClosed()">
	<MkPostForm ref="form" :class="$style.form" v-bind="props" autofocus freezeAfterPosted @posted="onPosted" @cancel="modal.close()" @esc="modal.close()"/>
</MkModal>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkModal from '@/components/MkModal.vue';
import MkPostForm from '@/components/MkPostForm.vue';

const props = defineProps<{
	reply?: misskey.entities.Note;
	renote?: misskey.entities.Note;
	channel?: any; // TODO
	mention?: misskey.entities.User;
	specified?: misskey.entities.User;
	initialText?: string;
	initialVisibility?: typeof misskey.noteVisibilities;
	initialFiles?: misskey.entities.DriveFile[];
	initialLocalOnly?: boolean;
	initialVisibleUsers?: misskey.entities.User[];
	initialNote?: misskey.entities.Note;
	instant?: boolean;
	fixed?: boolean;
	autofocus?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

let modal = $shallowRef<InstanceType<typeof MkModal>>();
let form = $shallowRef<InstanceType<typeof MkPostForm>>();

function onPosted() {
	modal.close({
		useSendAnimation: true,
	});
}

function onModalClosed() {
	emit('closed');
}
</script>

<style lang="scss" module>
.form {
	max-height: 100%;
	margin: 0 auto auto auto;
}
</style>
