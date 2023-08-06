<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="file" :contentMax="600" :marginMin="16" :marginMax="32">
		<div v-if="tab === 'overview'" class="cxqhhsmd _gaps_m">
			<a class="thumbnail" :href="file.url" target="_blank">
				<MkDriveFileThumbnail class="thumbnail" :file="file" fit="contain"/>
			</a>
			<div>
				<MkKeyValue :copy="file.type" oneline style="margin: 1em 0;">
					<template #key>MIME Type</template>
					<template #value><span class="_monospace">{{ file.type }}</span></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>Size</template>
					<template #value><span class="_monospace">{{ bytes(file.size) }}</span></template>
				</MkKeyValue>
				<MkKeyValue :copy="file.id" oneline style="margin: 1em 0;">
					<template #key>ID</template>
					<template #value><span class="_monospace">{{ file.id }}</span></template>
				</MkKeyValue>
				<MkKeyValue :copy="file.md5" oneline style="margin: 1em 0;">
					<template #key>MD5</template>
					<template #value><span class="_monospace">{{ file.md5 }}</span></template>
				</MkKeyValue>
				<MkKeyValue oneline style="margin: 1em 0;">
					<template #key>{{ i18n.ts.createdAt }}</template>
					<template #value><span class="_monospace"><MkTime :time="file.createdAt" mode="detail" style="display: block;"/></span></template>
				</MkKeyValue>
			</div>
			<MkA v-if="file.user" class="user" :to="`/user-info/${file.user.id}`">
				<MkUserCardMini :user="file.user"/>
			</MkA>
			<div>
				<MkSwitch v-model="isSensitive" @update:modelValue="toggleIsSensitive">{{ i18n.ts.sensitive }}</MkSwitch>
			</div>

			<div>
				<MkButton danger @click="del"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
			</div>
		</div>
		<div v-else-if="tab === 'ip' && info" class="_gaps_m">
			<MkInfo v-if="!iAmAdmin" warn>{{ i18n.ts.requireAdminForView }}</MkInfo>
			<MkKeyValue v-if="info.requestIp" class="_monospace" :copy="info.requestIp" oneline>
				<template #key>IP</template>
				<template #value>{{ info.requestIp }}</template>
			</MkKeyValue>
			<FormSection v-if="info.requestHeaders">
				<template #label>Headers</template>
				<MkKeyValue v-for="(v, k) in info.requestHeaders" :key="k" class="_monospace">
					<template #key>{{ k }}</template>
					<template #value>{{ v }}</template>
				</MkKeyValue>
			</FormSection>
		</div>
		<div v-else-if="tab === 'raw'" class="_gaps_m">
			<MkObjectView v-if="info" tall :value="info">
			</MkObjectView>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkObjectView from '@/components/MkObjectView.vue';
import MkDriveFileThumbnail from '@/components/MkDriveFileThumbnail.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import FormSection from '@/components/form/section.vue';
import MkUserCardMini from '@/components/MkUserCardMini.vue';
import MkInfo from '@/components/MkInfo.vue';
import bytes from '@/filters/bytes';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { iAmAdmin, iAmModerator } from '@/account';

let tab = $ref('overview');
let file: any = $ref(null);
let info: any = $ref(null);
let isSensitive: boolean = $ref(false);

const props = defineProps<{
	fileId: string,
}>();

async function fetch() {
	file = await os.api('drive/files/show', { fileId: props.fileId });
	info = await os.api('admin/drive/show-file', { fileId: props.fileId });
	isSensitive = file.isSensitive;
}

fetch();

async function del() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('removeAreYouSure', { x: file.name }),
	});
	if (canceled) return;

	os.apiWithDialog('drive/files/delete', {
		fileId: file.id,
	});
}

async function toggleIsSensitive(v) {
	await os.api('drive/files/update', { fileId: props.fileId, isSensitive: v });
	isSensitive = v;
}

const headerActions = $computed(() => [{
	text: i18n.ts.openInNewTab,
	icon: 'ti ti-external-link',
	handler: () => {
		window.open(file.url, '_blank');
	},
}]);

const headerTabs = $computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
	icon: 'ti ti-info-circle',
}, iAmModerator ? {
	key: 'ip',
	title: 'IP',
	icon: 'ti ti-password',
} : null, {
	key: 'raw',
	title: 'Raw data',
	icon: 'ti ti-code',
}]);

definePageMetadata(computed(() => ({
	title: file ? i18n.ts.file + ': ' + file.name : i18n.ts.file,
	icon: 'ti ti-file',
})));
</script>

<style lang="scss" scoped>
.cxqhhsmd {
	> .thumbnail {
		display: block;

		> .thumbnail {
			height: 300px;
			max-width: 100%;
		}
	}

	> .user {
		&:hover {
			text-decoration: none;
		}
	}
}
</style>
