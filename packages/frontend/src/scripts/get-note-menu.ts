// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, Ref } from 'vue';
import * as misskey from 'misskey-js';
import { claimAchievement } from './achievements';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import { defaultStore, noteActions } from '@/store';
import { miLocalStorage } from '@/local-storage';
import { getUserMenu } from '@/scripts/get-user-menu';
import { clipsCache } from '@/cache';
import { MenuItem } from '@/types/menu';

export async function getNoteClipMenu(props: {
	note: misskey.entities.Note;
	isDeleted: Ref<boolean>;
	currentClip?: misskey.entities.Clip;
}) {
	const isRenote = (
		props.note.renote != null &&
		props.note.text == null &&
		props.note.fileIds.length === 0 &&
		props.note.poll == null
	);

	const appearNote = isRenote ? props.note.renote as misskey.entities.Note : props.note;

	const clips = await clipsCache.fetch(() => os.api('clips/list'));
	return [...clips.map(clip => ({
		text: clip.name,
		action: () => {
			claimAchievement('noteClipped1');
			os.promiseDialog(
				os.api('clips/add-note', { clipId: clip.id, noteId: appearNote.id }),
				null,
				async (err) => {
					if (err.id === '734806c4-542c-463a-9311-15c512803965') {
						const confirm = await os.confirm({
							type: 'warning',
							text: i18n.t('confirmToUnclipAlreadyClippedNote', { name: clip.name }),
						});
						if (!confirm.canceled) {
							os.apiWithDialog('clips/remove-note', { clipId: clip.id, noteId: appearNote.id });
							if (props.currentClip?.id === clip.id) props.isDeleted.value = true;
						}
					} else {
						os.alert({
							type: 'error',
							text: err.message + '\n' + err.id,
						});
					}
				},
			);
		},
	})), null, {
		icon: 'ti ti-plus',
		text: i18n.ts.createNew,
		action: async () => {
			const { canceled, result } = await os.form(i18n.ts.createNewClip, {
				name: {
					type: 'string',
					label: i18n.ts.name,
				},
				description: {
					type: 'string',
					required: false,
					multiline: true,
					label: i18n.ts.description,
				},
				isPublic: {
					type: 'boolean',
					label: i18n.ts.public,
					default: false,
				},
			});
			if (canceled) return;

			const clip = await os.apiWithDialog('clips/create', result);

			clipsCache.delete();

			claimAchievement('noteClipped1');
			os.apiWithDialog('clips/add-note', { clipId: clip.id, noteId: appearNote.id });
		},
	}];
}

export function getNoteMenu(props: {
	note: misskey.entities.Note;
	menuButton: Ref<HTMLElement>;
	translation: Ref<any>;
	translating: Ref<boolean>;
	isDeleted: Ref<boolean>;
	currentClip?: misskey.entities.Clip;
}) {
	const isRenote = (
		props.note.renote != null &&
		props.note.text == null &&
		props.note.fileIds.length === 0 &&
		props.note.poll == null
	);

	const appearNote = isRenote ? props.note.renote as misskey.entities.Note : props.note;

	const cleanups = [] as (() => void)[];

	function del(): void {
		os.confirm({
			type: 'warning',
			text: i18n.ts.noteDeleteConfirm,
		}).then(({ canceled }) => {
			if (canceled) return;

			os.api('notes/delete', {
				noteId: appearNote.id,
			});

			if (Date.now() - new Date(appearNote.createdAt).getTime() < 1000 * 60) {
				claimAchievement('noteDeletedWithin1min');
			}
		});
	}

	function delEdit(): void {
		os.confirm({
			type: 'warning',
			text: i18n.ts.deleteAndEditConfirm,
		}).then(({ canceled }) => {
			if (canceled) return;

			os.api('notes/delete', {
				noteId: appearNote.id,
			});

			os.post({ initialNote: appearNote, renote: appearNote.renote, reply: appearNote.reply, channel: appearNote.channel });

			if (Date.now() - new Date(appearNote.createdAt).getTime() < 1000 * 60) {
				claimAchievement('noteDeletedWithin1min');
			}
		});
	}

	function toggleFavorite(favorite: boolean): void {
		claimAchievement('noteFavorited1');
		os.apiWithDialog(favorite ? 'notes/favorites/create' : 'notes/favorites/delete', {
			noteId: appearNote.id,
		});
	}

	function toggleThreadMute(mute: boolean): void {
		os.apiWithDialog(mute ? 'notes/thread-muting/create' : 'notes/thread-muting/delete', {
			noteId: appearNote.id,
		});
	}

	function copyContent(): void {
		copyToClipboard(appearNote.text);
		os.success();
	}

	function copyLink(): void {
		copyToClipboard(`${url}/notes/${appearNote.id}`);
		os.success();
	}

	function togglePin(pin: boolean): void {
		os.apiWithDialog(pin ? 'i/pin' : 'i/unpin', {
			noteId: appearNote.id,
		}, undefined, null, res => {
			if (res.id === '72dab508-c64d-498f-8740-a8eec1ba385a') {
				os.alert({
					type: 'error',
					text: i18n.ts.pinLimitExceeded,
				});
			}
		});
	}

	async function unclip(): Promise<void> {
		os.apiWithDialog('clips/remove-note', { clipId: props.currentClip.id, noteId: appearNote.id });
		props.isDeleted.value = true;
	}

	async function promote(): Promise<void> {
		const { canceled, result: days } = await os.inputNumber({
			title: i18n.ts.numberOfDays,
		});

		if (canceled) return;

		os.apiWithDialog('admin/promo/create', {
			noteId: appearNote.id,
			expiresAt: Date.now() + (86400000 * days),
		});
	}

	function share(): void {
		navigator.share({
			title: i18n.t('noteOf', { user: appearNote.user.name }),
			text: appearNote.text,
			url: `${url}/notes/${appearNote.id}`,
		});
	}

	function openDetail(): void {
		os.pageWindow(`/notes/${appearNote.id}`);
	}

	function showReactions(): void {
		os.popup(defineAsyncComponent(() => import('@/components/MkReactedUsersDialog.vue')), {
			noteId: appearNote.id,
		}, {}, 'closed');
	}

	function showRenotes(): void {
		os.popup(defineAsyncComponent(() => import('@/components/MkRenotedUsersDialog.vue')), {
			noteId: appearNote.id,
		}, {}, 'closed');
	}

	async function translate(): Promise<void> {
		if (props.translation.value != null) return;
		props.translating.value = true;
		const res = await os.api('notes/translate', {
			noteId: appearNote.id,
			targetLang: miLocalStorage.getItem('lang') ?? navigator.language,
		});
		props.translating.value = false;
		props.translation.value = res;
	}

	let menu: MenuItem[];
	if ($i) {
		const statePromise = os.api('notes/state', {
			noteId: appearNote.id,
		});

		menu = [
			...(
				props.currentClip?.userId === $i.id ? [{
					icon: 'ti ti-backspace',
					text: i18n.ts.unclip,
					danger: true,
					action: unclip,
				}, null] : []
			), {
				icon: 'ti ti-info-circle',
				text: i18n.ts.details,
				action: openDetail,
			}, {
				icon: 'ti ti-repeat',
				text: i18n.ts.renotesList,
				action: showRenotes,
			}, {
				icon: 'ti ti-icons',
				text: i18n.ts.reactionsList,
				action: showReactions,
			}, {
				icon: 'ti ti-copy',
				text: i18n.ts.copyContent,
				action: copyContent,
			}, {
				icon: 'ti ti-link',
				text: i18n.ts.copyLink,
				action: copyLink,
			}, (appearNote.url || appearNote.uri) ? {
				icon: 'ti ti-external-link',
				text: i18n.ts.showOnRemote,
				action: () => {
					window.open(appearNote.url ?? appearNote.uri, '_blank');
				},
			} : undefined,
			{
				icon: 'ti ti-share',
				text: i18n.ts.share,
				action: share,
			},
			instance.translatorAvailable ? {
				icon: 'ti ti-language-hiragana',
				text: i18n.ts.translate,
				action: translate,
			} : undefined,
			null,
			statePromise.then(state => state.isFavorited ? {
				icon: 'ti ti-star-off',
				text: i18n.ts.unfavorite,
				action: () => toggleFavorite(false),
			} : {
				icon: 'ti ti-star',
				text: i18n.ts.favorite,
				action: () => toggleFavorite(true),
			}),
			{
				type: 'parent' as const,
				icon: 'ti ti-paperclip',
				text: i18n.ts.clip,
				children: () => getNoteClipMenu(props),
			},
			statePromise.then(state => state.isMutedThread ? {
				icon: 'ti ti-message-off',
				text: i18n.ts.unmuteThread,
				action: () => toggleThreadMute(false),
			} : {
				icon: 'ti ti-message-off',
				text: i18n.ts.muteThread,
				action: () => toggleThreadMute(true),
			}),
			appearNote.userId === $i.id ? ($i.pinnedNoteIds ?? []).includes(appearNote.id) ? {
				icon: 'ti ti-pinned-off',
				text: i18n.ts.unpin,
				action: () => togglePin(false),
			} : {
				icon: 'ti ti-pin',
				text: i18n.ts.pin,
				action: () => togglePin(true),
			} : undefined,
			{
				type: 'parent' as const,
				icon: 'ti ti-user',
				text: i18n.ts.user,
				children: async () => {
					const user = appearNote.userId === $i?.id ? $i : await os.api('users/show', { userId: appearNote.userId });
					const { menu, cleanup } = getUserMenu(user);
					cleanups.push(cleanup);
					return menu;
				},
			},
			/*
		...($i.isModerator || $i.isAdmin ? [
			null,
			{
				icon: 'ti ti-speakerphone',
				text: i18n.ts.promote,
				action: promote
			}]
			: []
		),*/
			...(appearNote.userId !== $i.id ? [
				null,
				{
					icon: 'ti ti-exclamation-circle',
					text: i18n.ts.reportAbuse,
					action: () => {
						const u = appearNote.url ?? appearNote.uri ?? `${url}/notes/${appearNote.id}`;
						os.popup(defineAsyncComponent(() => import('@/components/MkAbuseReportWindow.vue')), {
							user: appearNote.user,
							initialComment: `Note: ${u}\n-----\n`,
						}, {}, 'closed');
					},
				}]
			: []
			),
			...(appearNote.userId === $i.id || $i.isModerator || $i.isAdmin ? [
				null,
				appearNote.userId === $i.id ? {
					icon: 'ti ti-edit',
					text: i18n.ts.deleteAndEdit,
					action: delEdit,
				} : undefined,
				{
					icon: 'ti ti-trash',
					text: i18n.ts.delete,
					danger: true,
					action: del,
				}]
			: []
			)]
			.filter(x => x !== undefined);
	} else {
		menu = [{
			icon: 'ti ti-external-link',
			text: i18n.ts.detailed,
			action: openDetail,
		}, {
			icon: 'ti ti-copy',
			text: i18n.ts.copyContent,
			action: copyContent,
		}, {
			icon: 'ti ti-link',
			text: i18n.ts.copyLink,
			action: copyLink,
		}, (appearNote.url || appearNote.uri) ? {
			icon: 'ti ti-external-link',
			text: i18n.ts.showOnRemote,
			action: () => {
				window.open(appearNote.url ?? appearNote.uri, '_blank');
			},
		} : undefined]
			.filter(x => x !== undefined);
	}

	if (noteActions.length > 0) {
		menu = menu.concat([null, ...noteActions.map(action => ({
			icon: 'ti ti-plug',
			text: action.title,
			action: () => {
				action.handler(appearNote);
			},
		}))]);
	}

	if (defaultStore.state.devMode) {
		menu = menu.concat([null, {
			icon: 'ti ti-id',
			text: i18n.ts.copyNoteId,
			action: () => {
				copyToClipboard(appearNote.id);
			},
		}]);
	}

	const cleanup = () => {
		if (_DEV_) console.log('note menu cleanup', cleanups);
		cleanups.forEach(cleanup => cleanup());
	};

	return {
		menu,
		cleanup,
	};
}
