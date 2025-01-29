<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:name="transitionName"
	:enterActiveClass="normalizeClass({
		[$style.transition_modalDrawer_enterActive]: transitionName === 'modal-drawer',
		[$style.transition_modalPopup_enterActive]: transitionName === 'modal-popup',
		[$style.transition_modal_enterActive]: transitionName === 'modal',
		[$style.transition_send_enterActive]: transitionName === 'send',
	})"
	:leaveActiveClass="normalizeClass({
		[$style.transition_modalDrawer_leaveActive]: transitionName === 'modal-drawer',
		[$style.transition_modalPopup_leaveActive]: transitionName === 'modal-popup',
		[$style.transition_modal_leaveActive]: transitionName === 'modal',
		[$style.transition_send_leaveActive]: transitionName === 'send',
	})"
	:enterFromClass="normalizeClass({
		[$style.transition_modalDrawer_enterFrom]: transitionName === 'modal-drawer',
		[$style.transition_modalPopup_enterFrom]: transitionName === 'modal-popup',
		[$style.transition_modal_enterFrom]: transitionName === 'modal',
		[$style.transition_send_enterFrom]: transitionName === 'send',
	})"
	:leaveToClass="normalizeClass({
		[$style.transition_modalDrawer_leaveTo]: transitionName === 'modal-drawer',
		[$style.transition_modalPopup_leaveTo]: transitionName === 'modal-popup',
		[$style.transition_modal_leaveTo]: transitionName === 'modal',
		[$style.transition_send_leaveTo]: transitionName === 'send',
	})"
	:duration="transitionDuration" appear @afterLeave="onClosed" @enter="emit('opening')" @afterEnter="onOpened"
>
	<div v-show="manualShowing != null ? manualShowing : showing" ref="modalRootEl" v-hotkey.global="keymap" :class="[$style.root, { [$style.drawer]: type === 'drawer', [$style.dialog]: type === 'dialog', [$style.popup]: type === 'popup' }]" :style="{ zIndex, pointerEvents: (manualShowing != null ? manualShowing : showing) ? 'auto' : 'none', '--transformOrigin': transformOrigin }">
		<div data-cy-bg :data-cy-transparent="isEnableBgTransparent" class="_modalBg" :class="[$style.bg, { [$style.bgTransparent]: isEnableBgTransparent }]" :style="{ zIndex }" @click="onBgClick" @mousedown="onBgClick" @contextmenu.prevent.stop="() => {}"></div>
		<div ref="content" :class="[$style.content, { [$style.fixed]: fixed }]" :style="{ zIndex }" @click.self="onBgClick">
			<slot :max-height="maxHeight" :type="type"></slot>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { nextTick, normalizeClass, onMounted, onUnmounted, provide, watch, ref, shallowRef, computed } from 'vue';
import * as os from '@/os.js';
import { isTouchUsing } from '@/scripts/touch.js';
import { defaultStore } from '@/store.js';
import { deviceKind } from '@/scripts/device-kind.js';
import { type Keymap } from '@/scripts/hotkey.js';
import { focusTrap } from '@/scripts/focus-trap.js';
import { focusParent } from '@/scripts/focus.js';

function getFixedContainer(el: Element | null): Element | null {
	if (el == null || el.tagName === 'BODY') return null;
	const position = window.getComputedStyle(el).getPropertyValue('position');
	if (position === 'fixed') {
		return el;
	} else {
		return getFixedContainer(el.parentElement);
	}
}

type ModalTypes = 'popup' | 'dialog' | 'drawer';

const props = withDefaults(defineProps<{
	manualShowing?: boolean | null;
	anchor?: { x: string; y: string; };
	src?: HTMLElement | null;
	preferType?: ModalTypes | 'auto';
	zPriority?: 'low' | 'middle' | 'high';
	noOverlap?: boolean;
	transparentBg?: boolean;
	hasInteractionWithOtherFocusTrappedEls?: boolean;
	returnFocusTo?: HTMLElement | null;
}>(), {
	manualShowing: null,
	src: null,
	anchor: () => ({ x: 'center', y: 'bottom' }),
	preferType: 'auto',
	zPriority: 'low',
	noOverlap: true,
	transparentBg: false,
	hasInteractionWithOtherFocusTrappedEls: false,
	returnFocusTo: null,
});

const emit = defineEmits<{
	(ev: 'opening'): void;
	(ev: 'opened'): void;
	(ev: 'click'): void;
	(ev: 'esc'): void;
	(ev: 'close'): void;
	(ev: 'closed'): void;
}>();

provide('modal', true);

const maxHeight = ref<number>();
const fixed = ref(false);
const transformOrigin = ref('center');
const showing = ref(true);
const modalRootEl = shallowRef<HTMLElement>();
const content = shallowRef<HTMLElement>();
const zIndex = os.claimZIndex(props.zPriority);
const useSendAnime = ref(false);
const type = computed<ModalTypes>(() => {
	if (props.preferType === 'auto') {
		if ((defaultStore.state.menuStyle === 'drawer') || (defaultStore.state.menuStyle === 'auto' && isTouchUsing && deviceKind === 'smartphone')) {
			return 'drawer';
		} else {
			return props.src != null ? 'popup' : 'dialog';
		}
	} else {
		return props.preferType!;
	}
});
const isEnableBgTransparent = computed(() => props.transparentBg && (type.value === 'popup'));
const transitionName = computed((() =>
	defaultStore.state.animation
		? useSendAnime.value
			? 'send'
			: type.value === 'drawer'
				? 'modal-drawer'
				: type.value === 'popup'
					? 'modal-popup'
					: 'modal'
		: ''
));
const transitionDuration = computed((() =>
	transitionName.value === 'send'
		? 400
		: transitionName.value === 'modal-popup'
			? 100
			: transitionName.value === 'modal'
				? 200
				: transitionName.value === 'modal-drawer'
					? 200
					: 0
));

let releaseFocusTrap: (() => void) | null = null;
let contentClicking = false;

function close(opts: { useSendAnimation?: boolean } = {}) {
	if (opts.useSendAnimation) {
		useSendAnime.value = true;
	}

	// eslint-disable-next-line vue/no-mutating-props
	if (props.src) props.src.style.pointerEvents = 'auto';
	showing.value = false;
	emit('close');
}

function onBgClick() {
	if (contentClicking) return;
	emit('click');
}

if (type.value === 'drawer') {
	maxHeight.value = window.innerHeight / 1.5;
}

const keymap = {
	'esc': {
		allowRepeat: true,
		callback: () => emit('esc'),
	},
} as const satisfies Keymap;

const MARGIN = 16;
const SCROLLBAR_THICKNESS = 16;

const align = () => {
	if (props.src == null) return;
	if (type.value === 'drawer') return;
	if (type.value === 'dialog') return;

	if (content.value == null) return;

	const srcRect = props.src.getBoundingClientRect();

	const width = content.value!.offsetWidth;
	const height = content.value!.offsetHeight;

	let left;
	let top;

	const x = srcRect.left + (fixed.value ? 0 : window.scrollX);
	const y = srcRect.top + (fixed.value ? 0 : window.scrollY);

	if (props.anchor.x === 'center') {
		left = x + (props.src.offsetWidth / 2) - (width / 2);
	} else if (props.anchor.x === 'left') {
		// TODO
	} else if (props.anchor.x === 'right') {
		left = x + props.src.offsetWidth;
	}

	if (props.anchor.y === 'center') {
		top = (y - (height / 2));
	} else if (props.anchor.y === 'top') {
		// TODO
	} else if (props.anchor.y === 'bottom') {
		top = y + props.src.offsetHeight;
	}

	if (fixed.value) {
		// 画面から横にはみ出る場合
		if (left + width > (window.innerWidth - SCROLLBAR_THICKNESS)) {
			left = (window.innerWidth - SCROLLBAR_THICKNESS) - width;
		}

		const underSpace = ((window.innerHeight - SCROLLBAR_THICKNESS) - MARGIN) - top;
		const upperSpace = (srcRect.top - MARGIN);

		// 画面から縦にはみ出る場合
		if (top + height > ((window.innerHeight - SCROLLBAR_THICKNESS) - MARGIN)) {
			if (props.noOverlap && props.anchor.x === 'center') {
				if (underSpace >= (upperSpace / 3)) {
					maxHeight.value = underSpace;
				} else {
					maxHeight.value = upperSpace;
					top = (upperSpace + MARGIN) - height;
				}
			} else {
				top = ((window.innerHeight - SCROLLBAR_THICKNESS) - MARGIN) - height;
			}
		} else {
			maxHeight.value = underSpace;
		}
	} else {
		// 画面から横にはみ出る場合
		if (left + width - window.scrollX > (window.innerWidth - SCROLLBAR_THICKNESS)) {
			left = (window.innerWidth - SCROLLBAR_THICKNESS) - width + window.scrollX - 1;
		}

		const underSpace = ((window.innerHeight - SCROLLBAR_THICKNESS) - MARGIN) - (top - window.scrollY);
		const upperSpace = (srcRect.top - MARGIN);

		// 画面から縦にはみ出る場合
		if (top + height - window.scrollY > ((window.innerHeight - SCROLLBAR_THICKNESS) - MARGIN)) {
			if (props.noOverlap && props.anchor.x === 'center') {
				if (underSpace >= (upperSpace / 3)) {
					maxHeight.value = underSpace;
				} else {
					maxHeight.value = upperSpace;
					top = window.scrollY + ((upperSpace + MARGIN) - height);
				}
			} else {
				top = ((window.innerHeight - SCROLLBAR_THICKNESS) - MARGIN) - height + window.scrollY - 1;
			}
		} else {
			maxHeight.value = underSpace;
		}
	}

	if (top < 0) {
		top = MARGIN;
	}

	if (left < 0) {
		left = 0;
	}

	let transformOriginX = 'center';
	let transformOriginY = 'center';

	if (top >= srcRect.top + props.src.offsetHeight + (fixed.value ? 0 : window.scrollY)) {
		transformOriginY = 'top';
	} else if ((top + height) <= srcRect.top + (fixed.value ? 0 : window.scrollY)) {
		transformOriginY = 'bottom';
	}

	if (left >= srcRect.left + props.src.offsetWidth + (fixed.value ? 0 : window.scrollX)) {
		transformOriginX = 'left';
	} else if ((left + width) <= srcRect.left + (fixed.value ? 0 : window.scrollX)) {
		transformOriginX = 'right';
	}

	transformOrigin.value = `${transformOriginX} ${transformOriginY}`;

	content.value.style.left = left + 'px';
	content.value.style.top = top + 'px';
};

const onOpened = () => {
	emit('opened');

	// contentの子要素にアクセスするためレンダリングの完了を待つ必要がある（nextTickが必要）
	nextTick(() => {
		// NOTE: Chromatic テストの際に undefined になる場合がある
		if (content.value == null) return;

		// モーダルコンテンツにマウスボタンが押され、コンテンツ外でマウスボタンが離されたときにモーダルバックグラウンドクリックと判定させないためにマウスイベントを監視しフラグ管理する
		const el = content.value.children[0];
		el.addEventListener('mousedown', ev => {
			contentClicking = true;
			window.addEventListener('mouseup', ev => {
				// click イベントより先に mouseup イベントが発生するかもしれないのでちょっと待つ
				window.setTimeout(() => {
					contentClicking = false;
				}, 100);
			}, { passive: true, once: true });
		}, { passive: true });
	});
};

const onClosed = () => {
	emit('closed');
};

const alignObserver = new ResizeObserver((entries, observer) => {
	align();
});

onMounted(() => {
	watch(() => props.src, async () => {
		if (props.src) {
			// eslint-disable-next-line vue/no-mutating-props
			props.src.style.pointerEvents = 'none';
		}
		fixed.value = (type.value === 'drawer') || (getFixedContainer(props.src) != null);

		await nextTick();

		align();
	}, { immediate: true });

	watch([showing, () => props.manualShowing], ([showing, manualShowing]) => {
		if (manualShowing === true || (manualShowing == null && showing === true)) {
			if (modalRootEl.value != null) {
				const { release } = focusTrap(modalRootEl.value, props.hasInteractionWithOtherFocusTrappedEls);

				releaseFocusTrap = release;
				modalRootEl.value.focus();
			}
		} else {
			releaseFocusTrap?.();
			focusParent(props.returnFocusTo ?? props.src, true, false);
		}
	}, { immediate: true });

	nextTick(() => {
		alignObserver.observe(content.value!);
	});
});

onUnmounted(() => {
	alignObserver.disconnect();
});

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.transition_send_enterActive,
.transition_send_leaveActive {
	> .bg {
		transition: opacity 0.3s !important;
	}

	> .content {
    transform: translateY(0px);
		transition: opacity 0.3s ease-in, transform 0.3s cubic-bezier(.5,-0.5,1,.5) !important;
	}
}
.transition_send_enterFrom,
.transition_send_leaveTo {
	> .bg {
		opacity: 0;
	}

	> .content {
		pointer-events: none;
		opacity: 0;
		transform: translateY(-300px);
	}
}

.transition_modal_enterActive,
.transition_modal_leaveActive {
	> .bg {
		transition: opacity 0.2s !important;
	}

	> .content {
		transform-origin: var(--transformOrigin);
		transition: opacity 0.2s, transform 0.2s !important;
	}
}
.transition_modal_enterFrom,
.transition_modal_leaveTo {
	> .bg {
		opacity: 0;
	}

	> .content {
		pointer-events: none;
		opacity: 0;
		transform-origin: var(--transformOrigin);
		transform: scale(0.9);
	}
}

.transition_modalPopup_enterActive,
.transition_modalPopup_leaveActive {
	> .bg {
		transition: opacity 0.1s !important;
	}

	> .content {
		transform-origin: var(--transformOrigin);
		transition: opacity 0.1s cubic-bezier(0, 0, 0.2, 1), transform 0.1s cubic-bezier(0, 0, 0.2, 1) !important;
	}
}
.transition_modalPopup_enterFrom,
.transition_modalPopup_leaveTo {
	> .bg {
		opacity: 0;
	}

	> .content {
		pointer-events: none;
		opacity: 0;
		transform-origin: var(--transformOrigin);
		transform: scale(0.9);
	}
}

.transition_modalDrawer_enterActive {
	> .bg {
		transition: opacity 0.2s !important;
	}

	> .content {
		transition: transform 0.2s cubic-bezier(0,.5,0,1) !important;
	}
}
.transition_modalDrawer_leaveActive {
	> .bg {
		transition: opacity 0.2s !important;
	}

	> .content {
		transition: transform 0.2s cubic-bezier(0,.5,0,1) !important;
	}
}
.transition_modalDrawer_enterFrom,
.transition_modalDrawer_leaveTo {
	> .bg {
		opacity: 0;
	}

	> .content {
		pointer-events: none;
		transform: translateY(100%);
	}
}

.root {
	&.dialog {
		> .content {
			position: fixed;
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			margin: auto;
			padding: 32px;
			display: flex;
			overflow: auto;

			@media (max-width: 500px) {
				padding: 16px;
			}
		}
	}

	&.popup {
		> .content {
			position: absolute;

			&.fixed {
				position: fixed;
			}
		}
	}

	&.drawer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: clip;

		> .content {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			margin: auto;
		}
	}
}

.bg {
	&.bgTransparent {
		background: transparent;
		-webkit-backdrop-filter: none;
		backdrop-filter: none;
	}
}
</style>
