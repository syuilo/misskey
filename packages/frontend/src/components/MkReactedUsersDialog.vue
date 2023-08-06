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
	<template #header>{{ i18n.ts.reactionsList }}</template>

	<MkSpacer :marginMin="20" :marginMax="28">
		<div v-if="note" class="_gaps">
			<div v-if="reactions.length === 0" class="_fullinfo">
				<img :src="infoImageUrl" class="_ghost"/>
				<div>{{ i18n.ts.nothing }}</div>
			</div>
			<template v-else>
				<div :class="$style.tabs">
					<button v-for="reaction in reactions" :key="reaction" :class="[$style.tab, { [$style.tabActive]: tab === reaction }]" class="_button" @click="tab = reaction">
						<MkReactionIcon :reaction="reaction"/>
						<span style="margin-left: 4px;">{{ note.reactions[reaction] }}</span>
					</button>
				</div>
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
import { onMounted, watch } from 'vue';
import * as misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkReactionIcon from '@/components/MkReactionIcon.vue';
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
let tab = $ref<string>();
let reactions = $ref<string[]>();
let users = $ref();

watch($$(tab), async () => {
	const res = await os.api('notes/reactions', {
		noteId: props.noteId,
		type: tab,
		limit: 30,
	});

	users = res.map(x => x.user);
});

onMounted(() => {
	os.api('notes/show', {
		noteId: props.noteId,
	}).then((res) => {
		reactions = Object.keys(res.reactions);
		tab = reactions[0];
		note = res;
	});
});
</script>

<style lang="scss" module>
.tabs {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}

.tab {
	padding: 4px 6px;
	border: solid 1px var(--divider);
	border-radius: 6px;
}

.tabActive {
	border-color: var(--accent);
}
</style>
