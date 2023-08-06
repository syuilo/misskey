<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a :href="to" :class="active ? activeClass : null" @click.prevent="nav" @contextmenu.prevent.stop="onContextmenu">
	<slot></slot>
</a>
</template>

<script lang="ts" setup>
// @ts-nocheck
import * as os from '@/os';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import { url } from '@/config';
import { popout as popout_ } from '@/scripts/popout';
import { i18n } from '@/i18n';
import { useRouter } from '@/router';

const props = withDefaults(defineProps<{
	to: string;
	activeClass?: null | string;
	behavior?: null | 'window' | 'browser';
}>(), {
	activeClass: null,
	behavior: null,
});

const router = useRouter();

const active = $computed(() => {
	if (props.activeClass == null) return false;
	const resolved = router.resolve(props.to);
	if (resolved == null) return false;
	if (resolved.route.path === router.currentRoute.value.path) return true;
	if (resolved.route.name == null) return false;
	if (router.currentRoute.value.name == null) return false;
	return resolved.route.name === router.currentRoute.value.name;
});

function onContextmenu(ev) {
	const selection = window.getSelection();
	if (selection && selection.toString() !== '') return;
	os.contextMenu([{
		type: 'label',
		text: props.to,
	}, {
		icon: 'ti ti-app-window',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(props.to);
		},
	}, {
		icon: 'ti ti-player-eject',
		text: i18n.ts.showInPage,
		action: () => {
			router.push(props.to, 'forcePage');
		},
	}, null, {
		icon: 'ti ti-external-link',
		text: i18n.ts.openInNewTab,
		action: () => {
			window.open(props.to, '_blank');
		},
	}, {
		icon: 'ti ti-link',
		text: i18n.ts.copyLink,
		action: () => {
			copyToClipboard(`${url}${props.to}`);
		},
	}], ev);
}

function openWindow() {
	os.pageWindow(props.to);
}

function nav(ev: MouseEvent) {
	if (props.behavior === 'browser') {
		location.href = props.to;
		return;
	}

	if (props.behavior) {
		if (props.behavior === 'window') {
			return openWindow();
		}
	}

	if (ev.shiftKey) {
		return openWindow();
	}

	router.push(props.to, ev.ctrlKey ? 'forcePage' : null);
}
</script>
