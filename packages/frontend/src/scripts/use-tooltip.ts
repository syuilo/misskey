/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, watch, onUnmounted } from 'vue';
import type { Ref } from 'vue';

export function useTooltip(
	elRef: Ref<HTMLElement | { $el: HTMLElement } | null | undefined>,
	onShow: (showing: Ref<boolean>) => void,
	delay = 300,
): void {
	let isHovering = false;

	// iOS(Androidも？)では、要素をタップした直後に(おせっかいで)mouseoverイベントを発火させたりするため、それを無視するためのフラグ
	// 無視しないと、画面に触れてないのにツールチップが出たりし、ユーザビリティが損なわれる
	// TODO: 一度でもタップすると二度とマウスでツールチップ出せなくなるのをどうにかする 定期的にfalseに戻すとか...？
	let shouldIgnoreMouseover = false;

	let timeoutId: number;

	let changeShowingState: (() => void) | null;

	let autoHidingTimer;

	const open = () => {
		close();
		if (!isHovering) return;
		if (elRef.value == null) return;
		const el = elRef.value instanceof Element ? elRef.value : elRef.value.$el;
		if (!document.body.contains(el)) return; // openしようとしたときに既に元要素がDOMから消えている場合があるため

		const showing = ref(true);
		onShow(showing);
		changeShowingState = () => {
			showing.value = false;
		};

		autoHidingTimer = window.setInterval(() => {
			if (elRef.value == null || !document.body.contains(elRef.value instanceof Element ? elRef.value : elRef.value.$el)) {
				if (!isHovering) return;
				isHovering = false;
				window.clearTimeout(timeoutId);
				close();
				window.clearInterval(autoHidingTimer);
			}
		}, 1000);
	};

	const close = () => {
		if (changeShowingState != null) {
			changeShowingState();
			changeShowingState = null;
		}
	};

	const onMouseover = () => {
		if (isHovering) return;
		if (shouldIgnoreMouseover) return;
		isHovering = true;
		timeoutId = window.setTimeout(open, delay);
	};

	const onMouseleave = () => {
		if (!isHovering) return;
		isHovering = false;
		window.clearTimeout(timeoutId);
		window.clearInterval(autoHidingTimer);
		close();
	};

	const onTouchstart = () => {
		shouldIgnoreMouseover = true;
		if (isHovering) return;
		isHovering = true;
		timeoutId = window.setTimeout(open, delay);
	};

	const onTouchend = () => {
		if (!isHovering) return;
		isHovering = false;
		window.clearTimeout(timeoutId);
		window.clearInterval(autoHidingTimer);
		close();
	};

	const stop = watch(elRef, () => {
		if (elRef.value) {
			stop();
			const el = elRef.value instanceof Element ? elRef.value : elRef.value.$el;
			el.addEventListener('mouseover', onMouseover, { passive: true });
			el.addEventListener('mouseleave', onMouseleave, { passive: true });
			el.addEventListener('touchstart', onTouchstart, { passive: true });
			el.addEventListener('touchend', onTouchend, { passive: true });
			el.addEventListener('click', close, { passive: true });
		}
	}, {
		immediate: true,
		flush: 'post',
	});

	onUnmounted(() => {
		close();
	});
}
