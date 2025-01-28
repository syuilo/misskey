/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import { url } from '@@/js/config.js';
import { claimAchievement } from './achievements.js';
import type { MenuItem } from '@/types/menu.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { defaultStore, noteActions } from '@/store.js';
import { miLocalStorage } from '@/local-storage.js';
import { getUserMenu } from '@/scripts/get-user-menu.js';
import { clipsCache, favoritedChannelsCache } from '@/cache.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { isSupportShare } from '@/scripts/navigator.js';
import { getAppearNote } from '@/scripts/get-appear-note.js';
import { genEmbedCode } from '@/scripts/get-embed-code.js';

export async function getNoteClipMenu(props: {
	note: Misskey.entities.Note;
	isDeleted: Ref<boolean>;
	currentClip?: Misskey.entities.Clip;
}) {
	function getClipName(clip: Misskey.entities.Clip) {
		if ($i && clip.userId === $i.id && clip.notesCount != null) {
			return `${clip.name} (${clip.notesCount}/${$i.policies.noteEachClipsLimit})`;
		} else {
			return clip.name;
		}
	}

	const appearNote = getAppearNote(props.note);

	const clips = await clipsCache.fetch();
	const menu: MenuItem[] = [...clips.map(clip => ({
		text: getClipName(clip),
		action: () => {
			claimAchievement('noteClipped1');
			os.promiseDialog(
				misskeyApi('clips/add-note', { clipId: clip.id, noteId: appearNote.id }),
				null,
				async (err) => {
					if (err.id === '734806c4-542c-463a-9311-15c512803965') {
						const confirm = await os.confirm({
							type: 'warning',
							text: i18n.tsx.confirmToUnclipAlreadyClippedNote({ name: clip.name }),
						});
						if (!confirm.canceled) {
							os.apiWithDialog('clips/remove-note', { clipId: clip.id, noteId: appearNote.id }).then(() => {
								clipsCache.set(clips.map(c => {
									if (c.id === clip.id) {
										return {
											...c,
											notesCount: Math.max(0, ((c.notesCount ?? 0) - 1)),
										};
									} else {
										return c;
									}
								}));
							});
							if (props.currentClip?.id === clip.id) props.isDeleted.value = true;
						}
					} else if (err.id === 'f0dba960-ff73-4615-8df4-d6ac5d9dc118') {
						os.alert({
							type: 'error',
							text: i18n.ts.clipNoteLimitExceeded,
						});
					} else {
						os.alert({
							type: 'error',
							text: err.message + '\n' + err.id,
						});
					}
				},
			).then(() => {
				clipsCache.set(clips.map(c => {
					if (c.id === clip.id) {
						return {
							...c,
							notesCount: (c.notesCount ?? 0) + 1,
						};
					} else {
						return c;
					}
				}));
			});
		},
	})), { type: 'divider' }, {
		icon: 'ti ti-plus',
		text: i18n.ts.createNew,
		action: async () => {
			const { canceled, result } = await os.form(i18n.ts.createNewClip, {
				name: {
					type: 'string',
					default: null,
					label: i18n.ts.name,
				},
				description: {
					type: 'string',
					required: false,
					default: null,
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

	return menu;
}

export function getAbuseNoteMenu(note: Misskey.entities.Note, text: string): MenuItem {
	return {
		icon: 'ti ti-exclamation-circle',
		text,
		action: (): void => {
			const localUrl = `${url}/notes/${note.id}`;
			let noteInfo = '';
			if (note.url ?? note.uri != null) noteInfo = `Note: ${note.url ?? note.uri}\n`;
			noteInfo += `Local Note: ${localUrl}\n`;
			const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkAbuseReportWindow.vue')), {
				user: note.user,
				initialComment: `${noteInfo}-----\n`,
			}, {
				closed: () => dispose(),
			});
		},
	};
}

export function getCopyNoteLinkMenu(note: Misskey.entities.Note, text: string): MenuItem {
	return {
		icon: 'ti ti-link',
		text,
		action: (): void => {
			copyToClipboard(`${url}/notes/${note.id}`);
			os.success();
		},
	};
}

function getNoteEmbedCodeMenu(note: Misskey.entities.Note, text: string): MenuItem | undefined {
	if (note.url != null || note.uri != null) return undefined;
	if (['specified', 'followers'].includes(note.visibility)) return undefined;

	return {
		icon: 'ti ti-code',
		text,
		action: (): void => {
			genEmbedCode('notes', note.id);
		},
	};
}

export function getNoteMenu(props: {
	note: Misskey.entities.Note;
	translation: Ref<Misskey.entities.NotesTranslateResponse | null>;
	translating: Ref<boolean>;
	isDeleted: Ref<boolean>;
	currentClip?: Misskey.entities.Clip;
}) {
	const appearNote = getAppearNote(props.note);

	const cleanups = [] as (() => void)[];

	function del(): void {
		os.confirm({
			type: 'warning',
			text: i18n.ts.noteDeleteConfirm,
		}).then(({ canceled }) => {
			if (canceled) return;

			misskeyApi('notes/delete', {
				noteId: appearNote.id,
			});

			if (Date.now() - new Date(appearNote.createdAt).getTime() < 1000 * 60 && appearNote.userId === $i.id) {
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

			misskeyApi('notes/delete', {
				noteId: appearNote.id,
			});

			os.post({ initialNote: appearNote, renote: appearNote.renote, reply: appearNote.reply, channel: appearNote.channel });

			if (Date.now() - new Date(appearNote.createdAt).getTime() < 1000 * 60 && appearNote.userId === $i.id) {
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

	function togglePin(pin: boolean): void {
		os.apiWithDialog(pin ? 'i/pin' : 'i/unpin', {
			noteId: appearNote.id,
		}, undefined, {
			'72dab508-c64d-498f-8740-a8eec1ba385a': {
				text: i18n.ts.pinLimitExceeded,
			},
		});
	}

	async function unclip(): Promise<void> {
		if (!props.currentClip) return;
		os.apiWithDialog('clips/remove-note', { clipId: props.currentClip.id, noteId: appearNote.id });
		props.isDeleted.value = true;
	}

	async function promote(): Promise<void> {
		const { canceled, result: days } = await os.inputNumber({
			title: i18n.ts.numberOfDays,
		});

		if (canceled || days == null) return;

		os.apiWithDialog('admin/promo/create', {
			noteId: appearNote.id,
			expiresAt: Date.now() + (86400000 * days),
		});
	}

	function share(): void {
		navigator.share({
			title: i18n.tsx.noteOf({ user: appearNote.user.name ?? appearNote.user.username }),
			text: appearNote.text ?? '',
			url: `${url}/notes/${appearNote.id}`,
		});
	}

	function openDetail(): void {
		os.pageWindow(`/notes/${appearNote.id}`);
	}

	async function translate(): Promise<void> {
		if (props.translation.value != null) return;
		props.translating.value = true;
		const res = await misskeyApi('notes/translate', {
			noteId: appearNote.id,
			targetLang: miLocalStorage.getItem('lang') ?? navigator.language,
		});
		props.translating.value = false;
		props.translation.value = res;
	}

	const menuItems: MenuItem[] = [];

	if ($i) {
		const statePromise = misskeyApi('notes/state', {
			noteId: appearNote.id,
		});

		if (props.currentClip?.userId === $i.id) {
			menuItems.push({
				icon: 'ti ti-backspace',
				text: i18n.ts.unclip,
				danger: true,
				action: unclip,
			}, { type: 'divider' });
		}

		menuItems.push({
			icon: 'ti ti-info-circle',
			text: i18n.ts.details,
			action: openDetail,
		}, {
			icon: 'ti ti-copy',
			text: i18n.ts.copyContent,
			action: copyContent,
		}, getCopyNoteLinkMenu(appearNote, i18n.ts.copyLink));

		if (appearNote.url || appearNote.uri) {
			menuItems.push({
				icon: 'ti ti-link',
				text: i18n.ts.copyRemoteLink,
				action: () => {
					copyToClipboard(appearNote.url ?? appearNote.uri);
					os.success();
				},
			}, {
				icon: 'ti ti-external-link',
				text: i18n.ts.showOnRemote,
				action: () => {
					window.open(appearNote.url ?? appearNote.uri, '_blank', 'noopener');
				},
			});
		} else {
			menuItems.push(getNoteEmbedCodeMenu(appearNote, i18n.ts.genEmbedCode));
		}

		if (isSupportShare()) {
			menuItems.push({
				icon: 'ti ti-share',
				text: i18n.ts.share,
				action: share,
			});
		}

		if ($i.policies.canUseTranslator && instance.translatorAvailable) {
			menuItems.push({
				icon: 'ti ti-language-hiragana',
				text: i18n.ts.translate,
				action: translate,
			});
		}

		menuItems.push({ type: 'divider' });

		menuItems.push(statePromise.then(state => state.isFavorited ? {
			icon: 'ti ti-star-off',
			text: i18n.ts.unfavorite,
			action: () => toggleFavorite(false),
		} : {
			icon: 'ti ti-star',
			text: i18n.ts.favorite,
			action: () => toggleFavorite(true),
		}));

		menuItems.push({
			type: 'parent',
			icon: 'ti ti-paperclip',
			text: i18n.ts.clip,
			children: () => getNoteClipMenu(props),
		});

		menuItems.push(statePromise.then(state => state.isMutedThread ? {
			icon: 'ti ti-message-off',
			text: i18n.ts.unmuteThread,
			action: () => toggleThreadMute(false),
		} : {
			icon: 'ti ti-message-off',
			text: i18n.ts.muteThread,
			action: () => toggleThreadMute(true),
		}));

		if (appearNote.userId === $i.id) {
			if (($i.pinnedNoteIds ?? []).includes(appearNote.id)) {
				menuItems.push({
					icon: 'ti ti-pinned-off',
					text: i18n.ts.unpin,
					action: () => togglePin(false),
				});
			} else {
				menuItems.push({
					icon: 'ti ti-pin',
					text: i18n.ts.pin,
					action: () => togglePin(true),
				});
			}
		}

		menuItems.push({
			type: 'parent',
			icon: 'ti ti-user',
			text: i18n.ts.user,
			children: async () => {
				const user = appearNote.userId === $i?.id ? $i : await misskeyApi('users/show', { userId: appearNote.userId });
				const { menu, cleanup } = getUserMenu(user);
				cleanups.push(cleanup);
				return menu;
			},
		});

		if (appearNote.userId !== $i.id) {
			menuItems.push({ type: 'divider' });
			menuItems.push(getAbuseNoteMenu(appearNote, i18n.ts.reportAbuse));
		}

		if (appearNote.channel && (appearNote.channel.userId === $i.id || $i.isModerator || $i.isAdmin)) {
			menuItems.push({ type: 'divider' });
			menuItems.push({
				type: 'parent',
				icon: 'ti ti-device-tv',
				text: i18n.ts.channel,
				children: async () => {
					const channelChildMenu = [] as MenuItem[];

					const channel = await misskeyApi('channels/show', { channelId: appearNote.channel!.id });

					if (channel.pinnedNoteIds.includes(appearNote.id)) {
						channelChildMenu.push({
							icon: 'ti ti-pinned-off',
							text: i18n.ts.unpin,
							action: () => os.apiWithDialog('channels/update', {
								channelId: appearNote.channel!.id,
								pinnedNoteIds: channel.pinnedNoteIds.filter(id => id !== appearNote.id),
							}),
						});
					} else {
						channelChildMenu.push({
							icon: 'ti ti-pin',
							text: i18n.ts.pin,
							action: () => os.apiWithDialog('channels/update', {
								channelId: appearNote.channel!.id,
								pinnedNoteIds: [...channel.pinnedNoteIds, appearNote.id],
							}),
						});
					}
					return channelChildMenu;
				},
			});
		}

		if (appearNote.userId === $i.id || $i.isModerator || $i.isAdmin) {
			menuItems.push({ type: 'divider' });
			if (appearNote.userId === $i.id) {
				menuItems.push({
					icon: 'ti ti-edit',
					text: i18n.ts.deleteAndEdit,
					action: delEdit,
				});
			}
			menuItems.push({
				icon: 'ti ti-trash',
				text: i18n.ts.delete,
				danger: true,
				action: del,
			});
		}
	} else {
		menuItems.push({
			icon: 'ti ti-info-circle',
			text: i18n.ts.details,
			action: openDetail,
		}, {
			icon: 'ti ti-copy',
			text: i18n.ts.copyContent,
			action: copyContent,
		}, getCopyNoteLinkMenu(appearNote, i18n.ts.copyLink));

		if (appearNote.url || appearNote.uri) {
			menuItems.push({
				icon: 'ti ti-link',
				text: i18n.ts.copyRemoteLink,
				action: () => {
					copyToClipboard(appearNote.url ?? appearNote.uri);
					os.success();
				},
			}, {
				icon: 'ti ti-external-link',
				text: i18n.ts.showOnRemote,
				action: () => {
					window.open(appearNote.url ?? appearNote.uri, '_blank', 'noopener');
				},
			});
		} else {
			menuItems.push(getNoteEmbedCodeMenu(appearNote, i18n.ts.genEmbedCode));
		}
	}

	if (noteActions.length > 0) {
		menuItems.push({ type: 'divider' });

		menuItems.push(...noteActions.map(action => ({
			icon: 'ti ti-plug',
			text: action.title,
			action: () => {
				action.handler(appearNote);
			},
		})));
	}

	if (defaultStore.state.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-id',
			text: i18n.ts.copyNoteId,
			action: () => {
				copyToClipboard(appearNote.id);
				os.success();
			},
		});
	}

	const cleanup = () => {
		if (_DEV_) console.log('note menu cleanup', cleanups);
		for (const cl of cleanups) {
			cl();
		}
	};

	return {
		menu: menuItems,
		cleanup,
	};
}

type Visibility = (typeof Misskey.noteVisibilities)[number];

function smallerVisibility(a: Visibility, b: Visibility): Visibility {
	if (a === 'specified' || b === 'specified') return 'specified';
	if (a === 'followers' || b === 'followers') return 'followers';
	if (a === 'home' || b === 'home') return 'home';
	// if (a === 'public' || b === 'public')
	return 'public';
}

export function getRenoteMenu(props: {
	note: Misskey.entities.Note;
	renoteButton: ShallowRef<HTMLElement | undefined>;
	mock?: boolean;
}) {
	const appearNote = getAppearNote(props.note);

	const channelRenoteItems: MenuItem[] = [];
	const normalRenoteItems: MenuItem[] = [];
	const normalExternalChannelRenoteItems: MenuItem[] = [];

	if (appearNote.channel) {
		channelRenoteItems.push(...[{
			text: i18n.ts.inChannelRenote,
			icon: 'ti ti-repeat',
			action: () => {
				const el = props.renoteButton.value;
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + (el.offsetWidth / 2);
					const y = rect.top + (el.offsetHeight / 2);
					const { dispose } = os.popup(MkRippleEffect, { x, y }, {
						end: () => dispose(),
					});
				}

				if (!props.mock) {
					misskeyApi('notes/create', {
						renoteId: appearNote.id,
						channelId: appearNote.channelId,
					}).then(() => {
						os.toast(i18n.ts.renoted);
					});
				}
			},
		}, {
			text: i18n.ts.inChannelQuote,
			icon: 'ti ti-quote',
			action: () => {
				if (!props.mock) {
					os.post({
						renote: appearNote,
						channel: appearNote.channel,
					});
				}
			},
		}]);
	}

	if (!appearNote.channel || appearNote.channel.allowRenoteToExternal) {
		normalRenoteItems.push(...[{
			text: i18n.ts.renote,
			icon: 'ti ti-repeat',
			action: () => {
				const el = props.renoteButton.value;
				if (el) {
					const rect = el.getBoundingClientRect();
					const x = rect.left + (el.offsetWidth / 2);
					const y = rect.top + (el.offsetHeight / 2);
					const { dispose } = os.popup(MkRippleEffect, { x, y }, {
						end: () => dispose(),
					});
				}

				const configuredVisibility = defaultStore.state.rememberNoteVisibility ? defaultStore.state.visibility : defaultStore.state.defaultNoteVisibility;
				const localOnly = defaultStore.state.rememberNoteVisibility ? defaultStore.state.localOnly : defaultStore.state.defaultNoteLocalOnly;

				let visibility = appearNote.visibility;
				visibility = smallerVisibility(visibility, configuredVisibility);
				if (appearNote.channel?.isSensitive) {
					visibility = smallerVisibility(visibility, 'home');
				}

				if (!props.mock) {
					misskeyApi('notes/create', {
						localOnly,
						visibility,
						renoteId: appearNote.id,
					}).then(() => {
						os.toast(i18n.ts.renoted);
					});
				}
			},
		}, (props.mock) ? undefined : {
			text: i18n.ts.quote,
			icon: 'ti ti-quote',
			action: () => {
				os.post({
					renote: appearNote,
				});
			},
		}]);

		normalExternalChannelRenoteItems.push({
			type: 'parent',
			icon: 'ti ti-repeat',
			text: appearNote.channel ? i18n.ts.renoteToOtherChannel : i18n.ts.renoteToChannel,
			children: async () => {
				const channels = await favoritedChannelsCache.fetch();
				return channels.filter((channel) => {
					if (!appearNote.channelId) return true;
					return channel.id !== appearNote.channelId;
				}).map((channel) => ({
					text: channel.name,
					action: () => {
						const el = props.renoteButton.value;
						if (el) {
							const rect = el.getBoundingClientRect();
							const x = rect.left + (el.offsetWidth / 2);
							const y = rect.top + (el.offsetHeight / 2);
							const { dispose } = os.popup(MkRippleEffect, { x, y }, {
								end: () => dispose(),
							});
						}

						if (!props.mock) {
							misskeyApi('notes/create', {
								renoteId: appearNote.id,
								channelId: channel.id,
							}).then(() => {
								os.toast(i18n.tsx.renotedToX({ name: channel.name }));
							});
						}
					},
				}));
			},
		});
	}

	const renoteItems = [
		...normalRenoteItems,
		...(channelRenoteItems.length > 0 && normalRenoteItems.length > 0) ? [{ type: 'divider' }] as MenuItem[] : [],
		...channelRenoteItems,
		...(normalExternalChannelRenoteItems.length > 0 && (normalRenoteItems.length > 0 || channelRenoteItems.length > 0)) ? [{ type: 'divider' }] as MenuItem[] : [],
		...normalExternalChannelRenoteItems,
	];

	return {
		menu: renoteItems,
	};
}
