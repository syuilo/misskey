/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, reactive, watch } from 'vue';
import type { Reactive } from 'vue';

function copy<T>(v: T): T {
	return JSON.parse(JSON.stringify(v));
}

function unwrapReactive<T>(v: Reactive<T>): T {
	return JSON.parse(JSON.stringify(v));
}

export function useForm<T extends Record<string, any>>(initialState: T, save: (newState: T) => Promise<void>) {
	const currentState = reactive<T>(copy(initialState));
	const previousState = reactive<T>(copy(initialState));

	const modifiedStates = reactive<Record<keyof T, boolean>>({} as any);
	for (const key in currentState) {
		modifiedStates[key] = false;
	}
	const modified = computed(() => Object.values(modifiedStates).some(v => v));
	const modifiedCount = computed(() => Object.values(modifiedStates).filter(v => v).length);

	watch([currentState, previousState], () => {
		for (const key in modifiedStates) {
			modifiedStates[key] = currentState[key] !== previousState[key];
		}
	}, { deep: true });

	async function _save() {
		await save(unwrapReactive(currentState));
		for (const key in currentState) {
			previousState[key] = copy(currentState[key]);
		}
	}

	function discard() {
		for (const key in currentState) {
			currentState[key] = copy(previousState[key]);
		}
	}

	return {
		state: currentState,
		savedState: previousState,
		modifiedStates,
		modified,
		modifiedCount,
		save: _save,
		discard,
	};
}
