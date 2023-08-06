// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toUnicode } from 'punycode';
import { defineAsyncComponent, ref, watch } from 'vue';
import * as misskey from 'misskey-js';
import { i18n } from '@/i18n';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { host, url } from '@/config';
import * as os from '@/os';
import { defaultStore, userActions } from '@/store';
import { $i, iAmModerator } from '@/account';
import { mainRouter } from '@/router';
import { Router } from '@/nirax';
import { antennasCache, rolesCache, userListsCache } from '@/cache';

export function getUserMenu(user: misskey.entities.UserDetailed, router: Router = mainRouter) {
	const meId = $i ? $i.id : null;

	const cleanups = [] as (() => void)[];

	async function toggleMute() {
		if (user.isMuted) {
			os.apiWithDialog('mute/delete', {
				userId: user.id,
			}).then(() => {
				user.isMuted = false;
			});
		} else {
			const { canceled, result: period } = await os.select({
				title: i18n.ts.mutePeriod,
				items: [{
					value: 'indefinitely', text: i18n.ts.indefinitely,
				}, {
					value: 'tenMinutes', text: i18n.ts.tenMinutes,
				}, {
					value: 'oneHour', text: i18n.ts.oneHour,
				}, {
					value: 'oneDay', text: i18n.ts.oneDay,
				}, {
					value: 'oneWeek', text: i18n.ts.oneWeek,
				}],
				default: 'indefinitely',
			});
			if (canceled) return;

			const expiresAt = period === 'indefinitely' ? null
				: period === 'tenMinutes' ? Date.now() + (1000 * 60 * 10)
				: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
				: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
				: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
				: null;

			os.apiWithDialog('mute/create', {
				userId: user.id,
				expiresAt,
			}).then(() => {
				user.isMuted = true;
			});
		}
	}

	async function toggleRenoteMute() {
		os.apiWithDialog(user.isRenoteMuted ? 'renote-mute/delete' : 'renote-mute/create', {
			userId: user.id,
		}).then(() => {
			user.isRenoteMuted = !user.isRenoteMuted;
		});
	}

	async function toggleBlock() {
		if (!await getConfirmed(user.isBlocking ? i18n.ts.unblockConfirm : i18n.ts.blockConfirm)) return;

		os.apiWithDialog(user.isBlocking ? 'blocking/delete' : 'blocking/create', {
			userId: user.id,
		}).then(() => {
			user.isBlocking = !user.isBlocking;
		});
	}

	function reportAbuse() {
		os.popup(defineAsyncComponent(() => import('@/components/MkAbuseReportWindow.vue')), {
			user: user,
		}, {}, 'closed');
	}

	async function getConfirmed(text: string): Promise<boolean> {
		const confirm = await os.confirm({
			type: 'warning',
			title: 'confirm',
			text,
		});

		return !confirm.canceled;
	}

	async function invalidateFollow() {
		if (!await getConfirmed(i18n.ts.breakFollowConfirm)) return;

		os.apiWithDialog('following/invalidate', {
			userId: user.id,
		}).then(() => {
			user.isFollowed = !user.isFollowed;
		});
	}

	async function editMemo(): Promise<void> {
		const userDetailed = await os.api('users/show', {
			userId: user.id,
		});
		const { canceled, result } = await os.form(i18n.ts.editMemo, {
			memo: {
				type: 'string',
				required: true,
				multiline: true,
				label: i18n.ts.memo,
				default: userDetailed.memo,
			},
		});
		if (canceled) return;

		os.apiWithDialog('users/update-memo', {
			memo: result.memo,
			userId: user.id,
		});
	}

	let menu = [{
		icon: 'ti ti-at',
		text: i18n.ts.copyUsername,
		action: () => {
			copyToClipboard(`@${user.username}@${user.host ?? host}`);
		},
	}, {
		icon: 'ti ti-info-circle',
		text: i18n.ts.info,
		action: () => {
			router.push(`/user-info/${user.id}`);
		},
	}, {
		icon: 'ti ti-rss',
		text: i18n.ts.copyRSS,
		action: () => {
			copyToClipboard(`${user.host ?? host}/@${user.username}.atom`);
		},
	}, {
		icon: 'ti ti-share',
		text: i18n.ts.copyProfileUrl,
		action: () => {
			const canonical = user.host === null ? `@${user.username}` : `@${user.username}@${toUnicode(user.host)}`;
			copyToClipboard(`${url}/${canonical}`);
		},
	}, {
		icon: 'ti ti-mail',
		text: i18n.ts.sendMessage,
		action: () => {
			os.post({ specified: user, initialText: `@${user.username} ` });
		},
	}, null, {
		icon: 'ti ti-pencil',
		text: i18n.ts.editMemo,
		action: () => {
			editMemo();
		},
	}, {
		type: 'parent',
		icon: 'ti ti-list',
		text: i18n.ts.addToList,
		children: async () => {
			const lists = await userListsCache.fetch(() => os.api('users/lists/list'));
			return lists.map(list => {
				const isListed = ref(list.userIds.includes(user.id));
				cleanups.push(watch(isListed, () => {
					if (isListed.value) {
						os.apiWithDialog('users/lists/push', {
							listId: list.id,
							userId: user.id,
						}).then(() => {
							list.userIds.push(user.id);
						});
					} else {
						os.apiWithDialog('users/lists/pull', {
							listId: list.id,
							userId: user.id,
						}).then(() => {
							list.userIds.splice(list.userIds.indexOf(user.id), 1);
						});
					}
				}));

				return {
					type: 'switch',
					text: list.name,
					ref: isListed,
				};
			});
		},
	}, {
		type: 'parent',
		icon: 'ti ti-antenna',
		text: i18n.ts.addToAntenna,
		children: async () => {
			const antennas = await antennasCache.fetch(() => os.api('antennas/list'));
			const canonical = user.host === null ? `@${user.username}` : `@${user.username}@${toUnicode(user.host)}`;
			return antennas.filter((a) => a.src === 'users').map(antenna => ({
				text: antenna.name,
				action: async () => {
					await os.apiWithDialog('antennas/update', {
						antennaId: antenna.id,
						name: antenna.name,
						keywords: antenna.keywords,
						excludeKeywords: antenna.excludeKeywords,
						src: antenna.src,
						userListId: antenna.userListId,
						users: [...antenna.users, canonical],
						caseSensitive: antenna.caseSensitive,
						withReplies: antenna.withReplies,
						withFile: antenna.withFile,
						notify: antenna.notify,
					});
					antennasCache.delete();
				},
			}));
		},
	}] as any;

	if ($i && meId !== user.id) {
		if (iAmModerator) {
			menu = menu.concat([{
				type: 'parent',
				icon: 'ti ti-badges',
				text: i18n.ts.roles,
				children: async () => {
					const roles = await rolesCache.fetch(() => os.api('admin/roles/list'));

					return roles.filter(r => r.target === 'manual').map(r => ({
						text: r.name,
						action: async () => {
							const { canceled, result: period } = await os.select({
								title: i18n.ts.period,
								items: [{
									value: 'indefinitely', text: i18n.ts.indefinitely,
								}, {
									value: 'oneHour', text: i18n.ts.oneHour,
								}, {
									value: 'oneDay', text: i18n.ts.oneDay,
								}, {
									value: 'oneWeek', text: i18n.ts.oneWeek,
								}, {
									value: 'oneMonth', text: i18n.ts.oneMonth,
								}],
								default: 'indefinitely',
							});
							if (canceled) return;

							const expiresAt = period === 'indefinitely' ? null
								: period === 'oneHour' ? Date.now() + (1000 * 60 * 60)
								: period === 'oneDay' ? Date.now() + (1000 * 60 * 60 * 24)
								: period === 'oneWeek' ? Date.now() + (1000 * 60 * 60 * 24 * 7)
								: period === 'oneMonth' ? Date.now() + (1000 * 60 * 60 * 24 * 30)
								: null;

							os.apiWithDialog('admin/roles/assign', { roleId: r.id, userId: user.id, expiresAt });
						},
					}));
				},
			}]);
		}

		menu = menu.concat([null, {
			icon: user.isMuted ? 'ti ti-eye' : 'ti ti-eye-off',
			text: user.isMuted ? i18n.ts.unmute : i18n.ts.mute,
			action: toggleMute,
		}, {
			icon: user.isRenoteMuted ? 'ti ti-repeat' : 'ti ti-repeat-off',
			text: user.isRenoteMuted ? i18n.ts.renoteUnmute : i18n.ts.renoteMute,
			action: toggleRenoteMute,
		}, {
			icon: 'ti ti-ban',
			text: user.isBlocking ? i18n.ts.unblock : i18n.ts.block,
			action: toggleBlock,
		}]);

		if (user.isFollowed) {
			menu = menu.concat([{
				icon: 'ti ti-link-off',
				text: i18n.ts.breakFollow,
				action: invalidateFollow,
			}]);
		}

		menu = menu.concat([null, {
			icon: 'ti ti-exclamation-circle',
			text: i18n.ts.reportAbuse,
			action: reportAbuse,
		}]);
	}

	if (defaultStore.state.devMode) {
		menu = menu.concat([null, {
			icon: 'ti ti-id',
			text: i18n.ts.copyUserId,
			action: () => {
				copyToClipboard(user.id);
			},
		}]);
	}

	if ($i && meId === user.id) {
		menu = menu.concat([null, {
			icon: 'ti ti-pencil',
			text: i18n.ts.editProfile,
			action: () => {
				router.push('/settings/profile');
			},
		}]);
	}

	if (userActions.length > 0) {
		menu = menu.concat([null, ...userActions.map(action => ({
			icon: 'ti ti-plug',
			text: action.title,
			action: () => {
				action.handler(user);
			},
		}))]);
	}

	const cleanup = () => {
		if (_DEV_) console.log('user menu cleanup', cleanups);
		cleanups.forEach(cleanup => cleanup());
	};

	return {
		menu,
		cleanup,
	};
}
