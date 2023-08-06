<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<MkPostForm
			v-if="state === 'writing'"
			fixed
			:instant="true"
			:initialText="initialText"
			:initialVisibility="visibility"
			:initialFiles="files"
			:initialLocalOnly="localOnly"
			:reply="reply"
			:renote="renote"
			:initialVisibleUsers="visibleUsers"
			class="_panel"
			@posted="state = 'posted'"
		/>
		<div v-else-if="state === 'posted'" class="_buttonsCenter">
			<MkButton primary @click="close">{{ i18n.ts.close }}</MkButton>
			<MkButton @click="goToMisskey">{{ i18n.ts.goToMisskey }}</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
// @ts-nocheck
// SPECIFICATION: https://misskey-hub.net/docs/features/share-form.html

import { } from 'vue';
import { noteVisibilities } from 'misskey-js';
import * as Acct from 'misskey-js/built/acct';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkPostForm from '@/components/MkPostForm.vue';
import * as os from '@/os';
import { mainRouter } from '@/router';
import { definePageMetadata } from '@/scripts/page-metadata';
import { i18n } from '@/i18n';

const urlParams = new URLSearchParams(window.location.search);
const localOnlyQuery = urlParams.get('localOnly');
const visibilityQuery = urlParams.get('visibility') as typeof noteVisibilities[number];

let state = $ref('fetching' as 'fetching' | 'writing' | 'posted');
let title = $ref(urlParams.get('title'));
const text = urlParams.get('text');
const url = urlParams.get('url');
let initialText = $ref<string | undefined>();
let reply = $ref<Misskey.entities.Note | undefined>();
let renote = $ref<Misskey.entities.Note | undefined>();
let visibility = $ref(noteVisibilities.includes(visibilityQuery) ? visibilityQuery : undefined);
let localOnly = $ref(localOnlyQuery === '0' ? false : localOnlyQuery === '1' ? true : undefined);
let files = $ref([] as Misskey.entities.DriveFile[]);
let visibleUsers = $ref([] as Misskey.entities.User[]);

async function init() {
	let noteText = '';
	if (title) noteText += `[ ${title} ]\n`;
	// Googleニュース対策
	if (text?.startsWith(`${title}.\n`)) noteText += text.replace(`${title}.\n`, '');
	else if (text && title !== text) noteText += `${text}\n`;
	if (url) noteText += `${url}`;
	initialText = noteText.trim();

	if (visibility === 'specified') {
		const visibleUserIds = urlParams.get('visibleUserIds');
		const visibleAccts = urlParams.get('visibleAccts');
		await Promise.all(
			[
				...(visibleUserIds ? visibleUserIds.split(',').map(userId => ({ userId })) : []),
				...(visibleAccts ? visibleAccts.split(',').map(Acct.parse) : []),
			]
			// TypeScriptの指示通りに変換する
				.map(q => 'username' in q ? { username: q.username, host: q.host === null ? undefined : q.host } : q)
				.map(q => os.api('users/show', q)
					.then(user => {
						visibleUsers.push(user);
					}, () => {
						console.error(`Invalid user query: ${JSON.stringify(q)}`);
					}),
				),
		);
	}

	try {
		//#region Reply
		const replyId = urlParams.get('replyId');
		const replyUri = urlParams.get('replyUri');
		if (replyId) {
			reply = await os.api('notes/show', {
				noteId: replyId,
			});
		} else if (replyUri) {
			const obj = await os.api('ap/show', {
				uri: replyUri,
			});
			if (obj.type === 'Note') {
				reply = obj.object;
			}
		}
		//#endregion

		//#region Renote
		const renoteId = urlParams.get('renoteId');
		const renoteUri = urlParams.get('renoteUri');
		if (renoteId) {
			renote = await os.api('notes/show', {
				noteId: renoteId,
			});
		} else if (renoteUri) {
			const obj = await os.api('ap/show', {
				uri: renoteUri,
			});
			if (obj.type === 'Note') {
				renote = obj.object;
			}
		}
		//#endregion

		//#region Drive files
		const fileIds = urlParams.get('fileIds');
		if (fileIds) {
			await Promise.all(
				fileIds.split(',')
					.map(fileId => os.api('drive/files/show', { fileId })
						.then(file => {
							files.push(file);
						}, () => {
							console.error(`Failed to fetch a file ${fileId}`);
						}),
					),
			);
		}
		//#endregion
	} catch (err: any) {
		os.alert({
			type: 'error',
			title: err.message,
			text: err.name,
		});
	}

	state = 'writing';
}

init();

function close(): void {
	window.close();

	// 閉じなければ100ms後タイムラインに
	window.setTimeout(() => {
		location.href = '/';
	}, 100);
}

function goToMisskey(): void {
	location.href = '/';
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.share,
	icon: 'ti ti-share',
});
</script>
