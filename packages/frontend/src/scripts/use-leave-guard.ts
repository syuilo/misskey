/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Ref } from 'vue';

export function useLeaveGuard(enabled: Ref<boolean>) {
	/* TODO
	const setLeaveGuard = inject('setLeaveGuard');

	if (setLeaveGuard) {
		setLeaveGuard(async () => {
			if (!enabled.value) return false;

			const { canceled } = await os.confirm({
				type: 'warning',
				text: i18n.ts.leaveConfirm,
			});

			return canceled;
		});
	} else {
		onBeforeRouteLeave(async (to, from) => {
			if (!enabled.value) return true;

			const { canceled } = await os.confirm({
				type: 'warning',
				text: i18n.ts.leaveConfirm,
			});

			return !canceled;
		});
	}
	*/

	/*
	function onBeforeLeave(ev: BeforeUnloadEvent) {
		if (enabled.value) {
			ev.preventDefault();
			ev.returnValue = '';
		}
	}

	window.addEventListener('beforeunload', onBeforeLeave);
	onUnmounted(() => {
		window.removeEventListener('beforeunload', onBeforeLeave);
	});
	*/
}
