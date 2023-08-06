<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><XHeader :actions="headerActions"/></template>
		<MkSpacer :contentMax="900">
			<div class="_gaps">
				<div class="inputs" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
					<MkSelect v-model="origin" style="margin: 0; flex: 1;">
						<template #label>{{ i18n.ts.instance }}</template>
						<option value="combined">{{ i18n.ts.all }}</option>
						<option value="local">{{ i18n.ts.local }}</option>
						<option value="remote">{{ i18n.ts.remote }}</option>
					</MkSelect>
					<MkInput v-model="searchHost" :debounce="true" type="search" style="margin: 0; flex: 1;" :disabled="pagination.params.origin === 'local'">
						<template #label>{{ i18n.ts.host }}</template>
					</MkInput>
				</div>
				<div class="inputs" style="display: flex; gap: var(--margin); flex-wrap: wrap;">
					<MkInput v-model="userId" :debounce="true" type="search" style="margin: 0; flex: 1;">
						<template #label>User ID</template>
					</MkInput>
					<MkInput v-model="type" :debounce="true" type="search" style="margin: 0; flex: 1;">
						<template #label>MIME type</template>
					</MkInput>
				</div>
				<MkFileListForAdmin :pagination="pagination" :viewMode="viewMode"/>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed } from 'vue';
import XHeader from './_header_.vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkFileListForAdmin from '@/components/MkFileListForAdmin.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let origin = $ref('local');
let type = $ref(null);
let searchHost = $ref('');
let userId = $ref('');
let viewMode = $ref('grid');
const pagination = {
	endpoint: 'admin/drive/files' as const,
	limit: 10,
	params: computed(() => ({
		type: (type && type !== '') ? type : null,
		userId: (userId && userId !== '') ? userId : null,
		origin: origin,
		hostname: (searchHost && searchHost !== '') ? searchHost : null,
	})),
};

function clear() {
	os.confirm({
		type: 'warning',
		text: i18n.ts.clearCachedFilesConfirm,
	}).then(({ canceled }) => {
		if (canceled) return;

		os.apiWithDialog('admin/drive/clean-remote-files', {});
	});
}

function show(file) {
	os.pageWindow(`/admin/file/${file.id}`);
}

async function find() {
	const { canceled, result: q } = await os.inputText({
		title: i18n.ts.fileIdOrUrl,
		allowEmpty: false,
	});
	if (canceled) return;

	os.api('admin/drive/show-file', q.startsWith('http://') || q.startsWith('https://') ? { url: q.trim() } : { fileId: q.trim() }).then(file => {
		show(file);
	}).catch(err => {
		if (err.code === 'NO_SUCH_FILE') {
			os.alert({
				type: 'error',
				text: i18n.ts.notFound,
			});
		}
	});
}

const headerActions = $computed(() => [{
	text: i18n.ts.lookup,
	icon: 'ti ti-search',
	handler: find,
}, {
	text: i18n.ts.clearCachedFiles,
	icon: 'ti ti-trash',
	handler: clear,
}]);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.ts.files,
	icon: 'ti ti-cloud',
})));
</script>
