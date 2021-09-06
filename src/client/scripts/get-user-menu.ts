import { i18n } from '@client/i18n';
import copyToClipboard from '@client/scripts/copy-to-clipboard';
import { host } from '@client/config';
import { getAcctUi } from '@/misc/acct';
import * as os from '@client/os';
import { userActions } from '@client/store';
import { router } from '@client/router';
import { $i } from '@client/account';

export function getUserMenu(user) {
	const meId = $i ? $i.id : null;

	async function pushList() {
		const t = i18n.locale.selectList; // なぜか後で参照すると null になるので最初にメモリに確保しておく
		const lists = await os.api('users/lists/list');
		if (lists.length === 0) {
			os.dialog({
				type: 'error',
				text: i18n.locale.youHaveNoLists
			});
			return;
		}
		const { canceled, result: listId } = await os.dialog({
			type: null,
			title: t,
			select: {
				items: lists.map(list => ({
					value: list.id, text: list.name
				}))
			},
			showCancelButton: true
		});
		if (canceled) return;
		os.apiWithDialog('users/lists/push', {
			listId: listId,
			userId: user.id
		});
	}

	async function inviteGroup() {
		const groups = await os.api('users/groups/owned');
		if (groups.length === 0) {
			os.dialog({
				type: 'error',
				text: i18n.locale.youHaveNoGroups
			});
			return;
		}
		const { canceled, result: groupId } = await os.dialog({
			type: null,
			title: i18n.locale.group,
			select: {
				items: groups.map(group => ({
					value: group.id, text: group.name
				}))
			},
			showCancelButton: true
		});
		if (canceled) return;
		os.apiWithDialog('users/groups/invite', {
			groupId: groupId,
			userId: user.id
		});
	}

	async function toggleMute() {
		os.apiWithDialog(user.isMuted ? 'mute/delete' : 'mute/create', {
			userId: user.id
		}).then(() => {
			user.isMuted = !user.isMuted;
		});
	}

	async function toggleBlock() {
		if (!await getConfirmed(user.isBlocking ? i18n.locale.unblockConfirm : i18n.locale.blockConfirm)) return;

		os.apiWithDialog(user.isBlocking ? 'blocking/delete' : 'blocking/create', {
			userId: user.id
		}).then(() => {
			user.isBlocking = !user.isBlocking;
		});
	}

	async function toggleSilence() {
		if (!await getConfirmed(i18n.t(user.isSilenced ? 'unsilenceConfirm' : 'silenceConfirm'))) return;

		os.apiWithDialog(user.isSilenced ? 'admin/unsilence-user' : 'admin/silence-user', {
			userId: user.id
		}).then(() => {
			user.isSilenced = !user.isSilenced;
		});
	}

	async function toggleSuspend() {
		if (!await getConfirmed(i18n.t(user.isSuspended ? 'unsuspendConfirm' : 'suspendConfirm'))) return;

		os.apiWithDialog(user.isSuspended ? 'admin/unsuspend-user' : 'admin/suspend-user', {
			userId: user.id
		}).then(() => {
			user.isSuspended = !user.isSuspended;
		});
	}

	function reportAbuse() {
		os.popup(import('@client/components/abuse-report-window.vue'), {
			user: user,
		}, {}, 'closed');
	}

	async function getConfirmed(text: string): Promise<boolean> {
		const confirm = await os.dialog({
			type: 'warning',
			showCancelButton: true,
			title: 'confirm',
			text,
		});

		return !confirm.canceled;
	}

	let menu = [{
		icon: 'fas fa-at',
		text: i18n.locale.copyUsername,
		action: () => {
			copyToClipboard(`@${user.username}@${user.host || host}`);
		}
	}, {
		icon: 'fas fa-info-circle',
		text: i18n.locale.info,
		action: () => {
			os.pageWindow(`/user-info/${user.id}`);
		}
	}, {
		icon: 'fas fa-envelope',
		text: i18n.locale.sendMessage,
		action: () => {
			os.post({ specified: user });
		}
	}, meId != user.id ? {
		type: 'link',
		icon: 'fas fa-comments',
		text: i18n.locale.startMessaging,
		to: '/my/messaging/' + getAcctUi(user),
	} : undefined, null, {
		icon: 'fas fa-list-ul',
		text: i18n.locale.addToList,
		action: pushList
	}, meId != user.id ? {
		icon: 'fas fa-users',
		text: i18n.locale.inviteToGroup,
		action: inviteGroup
	} : undefined] as any;

	if ($i && meId != user.id) {
		menu = menu.concat([null, {
			icon: user.isMuted ? 'fas fa-eye' : 'fas fa-eye-slash',
			text: user.isMuted ? i18n.locale.unmute : i18n.locale.mute,
			action: toggleMute
		}, {
			icon: 'fas fa-ban',
			text: user.isBlocking ? i18n.locale.unblock : i18n.locale.block,
			action: toggleBlock
		}]);

		menu = menu.concat([null, {
			icon: 'fas fa-exclamation-circle',
			text: i18n.locale.reportAbuse,
			action: reportAbuse
		}]);

		if ($i && ($i.isAdmin || $i.isModerator)) {
			menu = menu.concat([null, {
				icon: 'fas fa-microphone-slash',
				text: user.isSilenced ? i18n.locale.unsilence : i18n.locale.silence,
				action: toggleSilence
			}, {
				icon: 'fas fa-snowflake',
				text: user.isSuspended ? i18n.locale.unsuspend : i18n.locale.suspend,
				action: toggleSuspend
			}]);
		}
	}

	if ($i && meId === user.id) {
		menu = menu.concat([null, {
			icon: 'fas fa-pencil-alt',
			text: i18n.locale.editProfile,
			action: () => {
				router.push('/settings/profile');
			}
		}]);
	}

	if (userActions.length > 0) {
		menu = menu.concat([null, ...userActions.map(action => ({
			icon: 'fas fa-plug',
			text: action.title,
			action: () => {
				action.handler(user);
			}
		}))]);
	}

	return menu;
}
