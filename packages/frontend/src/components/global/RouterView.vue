<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<KeepAlive
	:max="defaultStore.state.numberOfPageCache"
	:exclude="pageCacheController"
>
	<Suspense :timeout="0">
		<component :is="currentPageComponent" :key="key" v-bind="Object.fromEntries(currentPageProps)"/>

		<template #fallback>
			<MkLoading/>
		</template>
	</Suspense>
</KeepAlive>
</template>

<script lang="ts" setup>
import { inject, onBeforeUnmount, provide, ref, shallowRef, computed, nextTick } from 'vue';
import type { IRouter, Resolved, RouteDef } from '@/nirax.js';
import { defaultStore } from '@/store.js';
import { globalEvents } from '@/events.js';
import MkLoadingPage from '@/pages/_loading_.vue';

const props = defineProps<{
	router?: IRouter;
	nested?: boolean;
}>();

const router = props.router ?? inject('router');

if (router == null) {
	throw new Error('no router provided');
}

const currentDepth = inject('routerCurrentDepth', 0);
provide('routerCurrentDepth', currentDepth + 1);

function resolveNested(current: Resolved, d = 0): Resolved | null {
	if (!props.nested) return current;

	if (d === currentDepth) {
		return current;
	} else {
		if (current.child) {
			return resolveNested(current.child, d + 1);
		} else {
			return null;
		}
	}
}

const current = resolveNested(router.current)!;
const currentPageComponent = shallowRef('component' in current.route ? current.route.component : MkLoadingPage);
const currentPageProps = ref(current.props);
const key = ref(router.getCurrentKey() + JSON.stringify(Object.fromEntries(current.props)));

function onChange({ resolved, key: newKey }) {
	const current = resolveNested(resolved);
	if (current == null || 'redirect' in current.route) return;
	currentPageComponent.value = current.route.component;
	currentPageProps.value = current.props;
	key.value = newKey + JSON.stringify(Object.fromEntries(current.props));

	nextTick(() => {
		// ページ遷移完了後に再びキャッシュを有効化
		if (clearCacheRequested.value) {
			clearCacheRequested.value = false;
		}
	});
}

router.addListener('change', onChange);

// #region キャッシュ制御

/**
 * キャッシュクリアが有効になったら、全キャッシュをクリアする
 *
 * keepAlive側にwatcherがあるのですぐ消えるとはおもうけど、念のためページ遷移完了まではキャッシュを無効化しておく。
 * キャッシュ有効時向けにexcludeを使いたい場合は、pageCacheControllerに並列に突っ込むのではなく、下に追記すること
 */
const pageCacheController = computed(() => clearCacheRequested.value ? /.*/ : undefined);
const clearCacheRequested = ref(false);

globalEvents.on('requestClearPageCache', () => {
	if (_DEV_) console.log('clear page cache requested');
	if (!clearCacheRequested.value) {
		clearCacheRequested.value = true;
	}
});

// #endregion

onBeforeUnmount(() => {
	router.removeListener('change', onChange);
});
</script>
