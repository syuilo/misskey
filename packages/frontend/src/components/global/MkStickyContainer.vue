<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl">
	<div ref="headerEl" :class="$style.header">
		<slot name="header"></slot>
	</div>
	<div
		:class="$style.body"
		:data-sticky-container-header-height="headerHeight"
		:data-sticky-container-footer-height="footerHeight"
	>
		<slot></slot>
	</div>
	<div ref="footerEl" :class="$style.footer">
		<slot name="footer"></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, provide, inject, ref, watch, useTemplateRef } from 'vue';
import type { Ref } from 'vue';

import { CURRENT_STICKY_BOTTOM, CURRENT_STICKY_TOP } from '@@/js/const.js';

const rootEl = useTemplateRef('rootEl');
const headerEl = useTemplateRef('headerEl');
const footerEl = useTemplateRef('footerEl');

const headerHeight = ref<string | undefined>();
const childStickyTop = ref(0);
const parentStickyTop = inject<Ref<number>>(CURRENT_STICKY_TOP, ref(0));
provide(CURRENT_STICKY_TOP, childStickyTop);

const footerHeight = ref<string | undefined>();
const childStickyBottom = ref(0);
const parentStickyBottom = inject<Ref<number>>(CURRENT_STICKY_BOTTOM, ref(0));
provide(CURRENT_STICKY_BOTTOM, childStickyBottom);

const calc = () => {
	// コンポーネントが表示されてないけどKeepAliveで残ってる場合などは null になる
	if (headerEl.value != null) {
		childStickyTop.value = parentStickyTop.value + headerEl.value.offsetHeight;
		headerHeight.value = headerEl.value.offsetHeight.toString();
	}

	// コンポーネントが表示されてないけどKeepAliveで残ってる場合などは null になる
	if (footerEl.value != null) {
		childStickyBottom.value = parentStickyBottom.value + footerEl.value.offsetHeight;
		footerHeight.value = footerEl.value.offsetHeight.toString();
	}
};

const observer = new ResizeObserver(() => {
	window.setTimeout(() => {
		calc();
	}, 100);
});

onMounted(() => {
	calc();

	watch([parentStickyTop, parentStickyBottom], calc);

	if (headerEl.value != null) {
		observer.observe(headerEl.value);
	}

	if (footerEl.value != null) {
		observer.observe(footerEl.value);
	}
});

onUnmounted(() => {
	observer.disconnect();
});

defineExpose({
	rootEl,
});
</script>

<style lang='scss' module>
.body {
	position: relative;
	z-index: 0;
	--MI-stickyTop: v-bind("childStickyTop + 'px'");
	--MI-stickyBottom: v-bind("childStickyBottom + 'px'");
}

.header {
	position: sticky;
	top: var(--MI-stickyTop, 0);
	z-index: 1;
}

.footer {
	position: sticky;
	bottom: var(--MI-stickyBottom, 0);
	z-index: 1;
}
</style>
