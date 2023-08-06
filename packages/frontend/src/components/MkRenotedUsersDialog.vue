<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="400"
	:height="450"
	@close="dialog.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.renotesList }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<div v-if="renotes" class="_gaps">
			<div v-if="renotes.length === 0" class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
			<template v-else>
				<MkA v-for="user in users" :key="user.id" :to="userPage(user)" @click="dialog.close()">
					<MkUserCardMini :user="user" :withChart="false"/>
				</MkA>
			</template>
		</div>
		<div v-else>
			<MkLoading/>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { onMounted } from 'vue';
import * as misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import { userPage } from '@/filters/user';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { infoImageUrl } from '@/instance';

const emit = defineEmits<{
	(ev: 'closed'): void,
}>();

const props = defineProps<{
	noteId: misskey.entities.Note['id'];
}>();

const dialog = $shallowRef<InstanceType<typeof MkModalWindow>>();

let note = $ref<misskey.entities.Note>();
let renotes = $ref();
let users = $ref();

onMounted(async () => {
	const res = await os.api('notes/renotes', {
		noteId: props.noteId,
		limit: 30,
	});

	renotes = res;
	users = res.map(x => x.user);
});
</script>

<style lang="scss" module>
</style>
