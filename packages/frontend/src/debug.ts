/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getCurrentInstance } from 'vue';
import type { ComponentInternalInstance } from 'vue';

export function isDebuggerEnabled(id: number): boolean {
	try {
		return localStorage.getItem(`DEBUG_${id}`) !== null;
	} catch {
		return false;
	}
}

export function switchDebuggerEnabled(id: number, enabled: boolean): void {
	if (enabled) {
		localStorage.setItem(`DEBUG_${id}`, '');
	} else {
		localStorage.removeItem(`DEBUG_${id}`);
	}
}

export function stackTraceInstances(): ComponentInternalInstance[] {
	let instance = getCurrentInstance();
	const stack: ComponentInternalInstance[] = [];
	while (instance) {
		stack.push(instance);
		instance = instance.parent;
	}
	return stack;
}
