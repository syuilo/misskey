<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<MkStickyContainer>
		<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
		<MkSpacer :contentMax="900">
			<div class="ogwlenmc">
				<div v-if="tab === 'local'" class="local">
					<MkInput v-model="query" :debounce="true" type="search" autocapitalize="off">
						<template #prefix><i class="ti ti-search"></i></template>
						<template #label>{{ i18n.ts.search }}</template>
					</MkInput>
					<MkSwitch v-model="selectMode" style="margin: 8px 0;">
						<template #label>Select mode</template>
					</MkSwitch>
					<div v-if="selectMode" class="_buttons">
						<MkButton inline @click="selectAll">Select all</MkButton>
						<MkButton inline @click="setCategoryBulk">Set category</MkButton>
						<MkButton inline @click="setTagBulk">Set tag</MkButton>
						<MkButton inline @click="addTagBulk">Add tag</MkButton>
						<MkButton inline @click="removeTagBulk">Remove tag</MkButton>
						<MkButton inline @click="setLicenseBulk">Set License</MkButton>
						<MkButton inline danger @click="delBulk">Delete</MkButton>
					</div>
					<MkPagination ref="emojisPaginationComponent" :pagination="pagination">
						<template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
						<template #default="{items}">
							<div class="ldhfsamy">
								<button v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" :class="{ selected: selectedEmojis.includes(emoji.id) }" @click="selectMode ? toggleSelect(emoji) : edit(emoji)">
									<img :src="`/emoji/${emoji.name}.webp`" class="img" :alt="emoji.name"/>
									<div class="body">
										<div class="name _monospace">{{ emoji.name }}</div>
										<div class="info">{{ emoji.category }}</div>
									</div>
								</button>
							</div>
						</template>
					</MkPagination>
				</div>

				<div v-else-if="tab === 'remote'" class="remote">
					<FormSplit>
						<MkInput v-model="queryRemote" :debounce="true" type="search" autocapitalize="off">
							<template #prefix><i class="ti ti-search"></i></template>
							<template #label>{{ i18n.ts.search }}</template>
						</MkInput>
						<MkInput v-model="host" :debounce="true">
							<template #label>{{ i18n.ts.host }}</template>
						</MkInput>
					</FormSplit>
					<MkPagination :pagination="remotePagination">
						<template #empty><span>{{ i18n.ts.noCustomEmojis }}</span></template>
						<template #default="{items}">
							<div class="ldhfsamy">
								<div v-for="emoji in items" :key="emoji.id" class="emoji _panel _button" @click="remoteMenu(emoji, $event)">
									<img :src="`/emoji/${emoji.name}@${emoji.host}.webp`" class="img" :alt="emoji.name"/>
									<div class="body">
										<div class="name _monospace">{{ emoji.name }}</div>
										<div class="info">{{ emoji.host }}</div>
									</div>
								</div>
							</div>
						</template>
					</MkPagination>
				</div>
			</div>
		</MkSpacer>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, shallowRef } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import FormSplit from '@/components/form/split.vue';
import { selectFile } from '@/scripts/select-file.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const emojisPaginationComponent = shallowRef<InstanceType<typeof MkPagination>>();

const tab = ref('local');
const query = ref<string | null>(null);
const queryRemote = ref<string | null>(null);
const host = ref<string | null>(null);
const selectMode = ref(false);
const selectedEmojis = ref<string[]>([]);

const pagination = {
	endpoint: 'admin/emoji/list' as const,
	limit: 30,
	params: computed(() => ({
		query: (query.value && query.value !== '') ? query.value : null,
	})),
};

const remotePagination = {
	endpoint: 'admin/emoji/list-remote' as const,
	limit: 30,
	params: computed(() => ({
		query: (queryRemote.value && queryRemote.value !== '') ? queryRemote.value : null,
		host: (host.value && host.value !== '') ? host.value : null,
	})),
};

const selectAll = () => {
	if (selectedEmojis.value.length > 0) {
		selectedEmojis.value = [];
	} else {
		selectedEmojis.value = Array.from(emojisPaginationComponent.value?.items.values(), item => item.id);
	}
};

const toggleSelect = (emoji) => {
	if (selectedEmojis.value.includes(emoji.id)) {
		selectedEmojis.value = selectedEmojis.value.filter(x => x !== emoji.id);
	} else {
		selectedEmojis.value.push(emoji.id);
	}
};

const add = async (ev: MouseEvent) => {
	const { dispose } = os.popup(defineAsyncComponent(() => import('./emoji-edit-dialog.vue')), {
	}, {
		done: result => {
			if (result.created) {
				emojisPaginationComponent.value?.prepend(result.created);
			}
		},
		closed: () => dispose(),
	});
};

const edit = (emoji) => {
	const { dispose } = os.popup(defineAsyncComponent(() => import('./emoji-edit-dialog.vue')), {
		emoji: emoji,
	}, {
		done: result => {
			if (result.updated) {
				emojisPaginationComponent.value?.updateItem(result.updated.id, (oldEmoji) => ({
					...oldEmoji,
					...result.updated,
				}));
			} else if (result.deleted) {
				emojisPaginationComponent.value?.removeItem(emoji.id);
			}
		},
		closed: () => dispose(),
	});
};

const importEmoji = (emoji) => {
	os.apiWithDialog('admin/emoji/copy', {
		emojiId: emoji.id,
	});
};

const remoteMenu = (emoji, ev: MouseEvent) => {
	os.popupMenu([{
		type: 'label',
		text: ':' + emoji.name + ':',
	}, {
		text: i18n.ts.import,
		icon: 'ti ti-plus',
		action: () => { importEmoji(emoji); },
	}], ev.currentTarget ?? ev.target);
};

const menu = (ev: MouseEvent) => {
	os.popupMenu([{
		icon: 'ti ti-download',
		text: i18n.ts.export,
		action: async () => {
			misskeyApi('export-custom-emojis', {
			})
				.then(() => {
					os.alert({
						type: 'info',
						text: i18n.ts.exportRequested,
					});
				}).catch((err) => {
					os.alert({
						type: 'error',
						text: err.message,
					});
				});
		},
	}, {
		icon: 'ti ti-upload',
		text: i18n.ts.import,
		action: async () => {
			const file = await selectFile(ev.currentTarget ?? ev.target);
			misskeyApi('admin/emoji/import-zip', {
				fileId: file.id,
			})
				.then(() => {
					os.alert({
						type: 'info',
						text: i18n.ts.importRequested,
					});
				}).catch((err) => {
					os.alert({
						type: 'error',
						text: err.message,
					});
				});
		},
	}], ev.currentTarget ?? ev.target);
};

const setCategoryBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Category',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/set-category-bulk', {
		ids: selectedEmojis.value,
		category: result,
	});
	emojisPaginationComponent.value?.reload();
};

const setLicenseBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'License',
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/set-license-bulk', {
		ids: selectedEmojis.value,
		license: result,
	});
	emojisPaginationComponent.value?.reload();
};

const addTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/add-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	emojisPaginationComponent.value?.reload();
};

const removeTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/remove-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	emojisPaginationComponent.value?.reload();
};

const setTagBulk = async () => {
	const { canceled, result } = await os.inputText({
		title: 'Tag',
	});
	if (canceled || result == null) return;
	await os.apiWithDialog('admin/emoji/set-aliases-bulk', {
		ids: selectedEmojis.value,
		aliases: result.split(' '),
	});
	emojisPaginationComponent.value?.reload();
};

const delBulk = async () => {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	});
	if (canceled) return;
	await os.apiWithDialog('admin/emoji/delete-bulk', {
		ids: selectedEmojis.value,
	});
	emojisPaginationComponent.value?.reload();
};

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.addEmoji,
	handler: add,
}, {
	icon: 'ti ti-dots',
	handler: menu,
}]);

const headerTabs = computed(() => [{
	key: 'local',
	title: i18n.ts.local,
}, {
	key: 'remote',
	title: i18n.ts.remote,
}]);

definePageMetadata(() => ({
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
}));
</script>

<style lang="scss" scoped>
.ogwlenmc {
	> .local {
		.empty {
			margin: var(--MI-margin);
		}

		.ldhfsamy {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: var(--MI-margin) 0;

			> .emoji {
				display: flex;
				align-items: center;
				padding: 11px;
				text-align: left;
				border: solid 1px var(--MI_THEME-panel);

				&:hover {
					border-color: var(--MI_THEME-inputBorderHover);
				}

				&.selected {
					border-color: var(--MI_THEME-accent);
				}

				> .img {
					width: 42px;
					height: 42px;
					object-fit: contain;
				}

				> .body {
					padding: 0 0 0 8px;
					white-space: nowrap;
					overflow: hidden;

					> .name {
						text-overflow: ellipsis;
						overflow: hidden;
					}

					> .info {
						opacity: 0.5;
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}

	> .remote {
		.empty {
			margin: var(--MI-margin);
		}

		.ldhfsamy {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: 12px;
			margin: var(--MI-margin) 0;

			> .emoji {
				display: flex;
				align-items: center;
				padding: 12px;
				text-align: left;

				&:hover {
					color: var(--MI_THEME-accent);
				}

				> .img {
					width: 32px;
					height: 32px;
					object-fit: contain;
				}

				> .body {
					padding: 0 0 0 8px;
					white-space: nowrap;
					overflow: hidden;

					> .name {
						text-overflow: ellipsis;
						overflow: hidden;
					}

					> .info {
						opacity: 0.5;
						font-size: 90%;
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}
}
</style>
