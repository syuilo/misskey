<template>
<div class="">
	<section class="_section">
		<div class="_content">
			<XPostForm
				v-if="state === 'writing'"
				fixed
				:share="true"
				:initial-text="initialText"
				:initial-visibility="visibility"
				:initial-files="files"
				:initial-local-only="localOnly"
				:reply="reply"
				:renote="renote"
				:visible-users="visibleUsers"
				@posted="state = 'posted'"
				class="_panel"
			/>
			<MkButton v-else-if="state === 'posted'" primary @click="close()" class="close">{{ $ts.close }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
// SPECIFICATION: /src/docs/ja-JP/advanced/share-page.md

import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import XPostForm from '@client/components/post-form.vue';
import * as os from '@client/os';
import { noteVisibilities } from '@/types';
import { parseAcct } from '@/misc/acct';
import * as symbols from '@client/symbols';
import * as Misskey from 'misskey-js';

export default defineComponent({
	components: {
		XPostForm,
		MkButton,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.share,
				icon: 'fas fa-share-alt'
			},
			state: 'fetching' as 'fetching' | 'writing' | 'posted',

			title: null as string | null,
			initialText: null as string | null,
			reply: null as Misskey.entities.Note | null,
			renote: null as Misskey.entities.Note | null,
			visibility: null as string | null,
			localOnly: null as boolean | null,
			files: [] as Misskey.entities.DriveFile[],
			visibleUsers: [] as Misskey.entities.User[],
		}
	},

	async created() {
		const urlParams = new URLSearchParams(window.location.search);

		this.title = urlParams.get('title');
		const text = urlParams.get('text');
		const url = urlParams.get('url');

		let noteText = '';
		if (this.title) noteText += `[ ${this.title} ]\n`;
		// Googleニュース対策
		if (text?.startsWith(`${this.title}.\n`)) noteText += text.replace(`${this.title}.\n`, '');
		else if (text && this.title !== text) noteText += `${text}\n`;
		if (url) noteText += `${url}`;
		this.initialText = noteText.trim();

		const visibility = urlParams.get('visibility');
		if (noteVisibilities.includes(visibility)) {
			this.visibility = visibility;
		}

		if (this.visibility === 'specified') {
			const visibleUserIds = urlParams.get('visibleUserIds');
			const visibleAccts = urlParams.get('visibleAccts');
			await Promise.all(
				[
					...(visibleUserIds ? visibleUserIds.split(',').map(userId => ({ userId })) : []),
					...(visibleAccts ? visibleAccts.split(',').map(parseAcct) : [])
				]
				// TypeScriptの指示通りに変換する
				.map(q => 'username' in q ? { username: q.username, host: q.host === null ? undefined : q.host } : q)
				.map(q => os.api('users/show', q)
					.then(user => {
						this.visibleUsers.push(user);
					}, () => {
						console.error(`Invalid user query: ${JSON.stringify(q)}`);
					})
				)
			);
		}

		const localOnly = urlParams.get('localOnly');
		if (localOnly === '0') this.localOnly = false;
		else if (localOnly === '1') this.localOnly = true;

		try {
			//#region Reply
			const replyId = urlParams.get('replyId');
			const replyUri = urlParams.get('replyUri');
			if (replyId) {
				this.reply = await os.api('notes/show', {
					noteId: replyId
				});
			} else if (replyUri) {
				const obj = await os.api('ap/show', {
					uri: replyUri
				});
				if (obj.type === 'Note') {
					this.reply = obj.object;
				}
			}
			//#endregion

			//#region Renote
			const renoteId = urlParams.get('renoteId');
			const renoteUri = urlParams.get('renoteUri');
			if (renoteId) {
				this.renote = await os.api('notes/show', {
					noteId: renoteId
				});
			} else if (renoteUri) {
				const obj = await os.api('ap/show', {
					uri: renoteUri
				});
				if (obj.type === 'Note') {
					this.renote = obj.object;
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
							this.files.push(file);
						}, () => {
							console.error(`Failed to fetch a file ${fileId}`);
						})
					)
				);
			}
			//#endregion
		} catch (e) {
			os.dialog({
				type: 'error',
				title: e.message,
				text: e.name
			});
		}

		this.state = 'writing';
	},

	methods: {
		close() {
			window.close();

			// 閉じなければ100ms後タイムラインに
			setTimeout(() => {
				this.$router.push('/');
			}, 100);
		}
	}
});
</script>

<style lang="scss" scoped>
.close {
	margin: 16px auto;
}
</style>
