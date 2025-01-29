/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, h, ref } from 'vue';
import MkLoading from '@/components/global/MkLoading.vue';

export const useLoading = (props?: {
	static?: boolean;
	inline?: boolean;
	colored?: boolean;
	mini?: boolean;
	em?: boolean;
}) => {
	const showingCnt = ref(0);

	const show = () => {
		showingCnt.value++;
	};

	const close = (force?: boolean) => {
		if (force) {
			showingCnt.value = 0;
		} else {
			showingCnt.value = Math.max(0, showingCnt.value - 1);
		}
	};

	const scope = <T>(fn: () => T) => {
		show();

		const result = fn();
		if (result instanceof Promise) {
			return result.finally(() => close());
		} else {
			close();
			return result;
		}
	};

	const showing = computed(() => showingCnt.value > 0);
	const component = computed(() => showing.value ? h(MkLoading, props) : null);

	return {
		show,
		close,
		scope,
		component,
		showing,
	};
};
