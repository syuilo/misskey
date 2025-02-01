<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialogEl"
	:width="600"
	:height="650"
	:withOkButton="true"
	:okButtonDisabled="selected == null"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts._drafts.select }}</template>
	<div :class="$style.drafts" class="_gaps">
		<!-- TODO: 下書きの保存可能数の残り表示 -->
		<MkPagination ref="pagingEl" :pagination="paging">
			<template #empty>
				<div class="_fullinfo">
					<img :src="infoImageUrl" class="_ghost"/>
					<div>{{ i18n.ts._drafts.noDrafts }}</div>
				</div>
			</template>

			<template #default="{ items }">
				<button
					v-for="draft in (items as Misskey.entities.NoteDraft[])"
					:key="draft.id"
					class="_button"
					:class="[$style.draft, { [$style.selected]: selected && selected.id === draft.id }]"
					type="button"
					@click="toggleSelected(draft)"
					@dblclick="ok()"
				>
					<div :class="$style.draftBody" class="_gaps_s">
						<div :class="$style.draftInfo">
							<div :class="$style.draftMeta">
								<div v-if="draft.reply" class="_nowrap">
									<i class="ti ti-arrow-back-up"></i> <I18n :src="i18n.ts._drafts.replyTo" tag="span">
										<template #user>
											<Mfm v-if="draft.reply.user.name != null" :text="draft.reply.user.name" :plain="true" :nowrap="true"/>
											<MkAcct v-else :user="draft.reply.user"/>
										</template>
									</I18n>
								</div>
								<div v-if="draft.renote && draft.text != null" class="_nowrap">
									<i class="ti ti-quote"></i> <I18n :src="i18n.ts._drafts.quoteOf" tag="span">
										<template #user>
											<Mfm v-if="draft.renote.user.name != null" :text="draft.renote.user.name" :plain="true" :nowrap="true"/>
											<MkAcct v-else :user="draft.renote.user"/>
										</template>
									</I18n>
								</div>
								<div v-if="draft.channel" class="_nowrap">
									<i class="ti ti-device-tv"></i> {{ i18n.tsx._drafts.postTo({ channel: draft.channel.name }) }}
								</div>
							</div>
							<div :class="$style.draftVisibility">
								<MkTime :time="draft.createdAt" colored/>
								<span style="margin-left: 0.5em;" :title="i18n.ts._visibility[draft.visibility]">
									<i v-if="draft.visibility === 'public'" class="ti ti-world"></i>
									<i v-else-if="draft.visibility === 'home'" class="ti ti-home"></i>
									<i v-else-if="draft.visibility === 'followers'" class="ti ti-lock"></i>
									<i v-else-if="draft.visibility === 'specified'" class="ti ti-mail"></i>
								</span>
								<span v-if="draft.localOnly" style="margin-left: 0.5em;" :title="i18n.ts._visibility['disableFederation']"><i class="ti ti-rocket-off"></i></span>
							</div>
						</div>
						<div :class="$style.draftContent">
							<Mfm :text="getNoteSummary(draft, { showRenote: false, showReply: false })" :plain="true" :author="draft.user"/>
						</div>
					</div>
					<div :class="$style.draftActions">
						<MkButton
							v-tooltip="i18n.ts._drafts.delete"
							short
							:class="$style.itemButton"
							@click.stop="deleteDraft(draft)"
						><i class="ti ti-trash"></i></MkButton>
					</div>
				</button>
			</template>
		</MkPagination>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, shallowRef, useTemplateRef } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkPagination, { type Paging } from '@/components/MkPagination.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { getNoteSummary } from '@/scripts/get-note-summary.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { infoImageUrl } from '@/instance.js';

const emit = defineEmits<{
	(ev: 'ok', selected: Misskey.entities.NoteDraft): void;
	(ev: 'cancel'): void;
	(ev: 'closed'): void;
}>();

const paging = {
	endpoint: 'notes/drafts',
	limit: 10,
} satisfies Paging;

const pagingComponent = useTemplateRef('pagingEl');

const selected = ref<Misskey.entities.NoteDraft | null>(null);
const dialogEl = shallowRef<InstanceType<typeof MkModalWindow>>();

let lockId: string | null = null;
let lockTimer: number | null = null;

function toggleSelected(draft: Misskey.entities.NoteDraft) {
	// ダブルクリックでの選択解除を防ぐ
	if (lockId === draft.id) {
		return;
	} else {
		if (lockTimer != null) {
			window.clearTimeout(lockTimer);
			lockTimer = null;
		}
		lockId = draft.id;
		lockTimer = window.setTimeout(() => {
			lockId = null;
		}, 300);
	}

	if (selected.value?.id === draft.id) {
		selected.value = null;
	} else {
		selected.value = draft;
	}
}

async function ok() {
	if (selected.value == null) return;

	emit('ok', selected.value);

	dialogEl.value?.close();
}

function cancel() {
	emit('cancel');
	dialogEl.value?.close();
}

async function deleteDraft(draft: Misskey.entities.NoteDraft) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts._drafts.deleteAreYouSure,
	});

	if (canceled) return;

	os.apiWithDialog('notes/drafts/delete', { draftId: draft.id }).then(() => {
		pagingComponent.value?.reload();
	});
}
</script>

<style lang="scss" module>
.drafts {
	overflow-x: hidden;
	overflow-x: clip;
	overflow-y: auto;
}

.draft {
	display: grid;
	grid-template-columns: 1fr auto;
	width: 100%;
	text-align: start;
	box-sizing: border-box;
	padding: 16px;
	gap: 16px;
	border-bottom: 1px solid var(--MI_THEME-divider);

	&:last-child {
		border-bottom-color: transparent;
	}

	&:hover {
		background: var(--MI_THEME-buttonBg);

		.itemButton:not(:hover) {
			background-color: var(--MI_THEME-panel);
		}
	}

	&.selected {
		background: var(--MI_THEME-accentedBg);

		.itemButton:not(:hover) {
			background-color: var(--MI_THEME-panel);
		}
	}
}

.draftBody {
	width: 100%;
	min-width: 0;
}

.draftInfo {
	display: flex;
	width: 100%;
	font-size: 0.85em;
	opacity: 0.7;
}

.draftMeta {
	flex-grow: 1;
	min-width: 0;
}

.draftVisibility {
	flex-shrink: 0;
}

.draftContent {
	display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
	line-clamp: 2;
  overflow: hidden;
	font-size: 0.9em;
}
</style>
