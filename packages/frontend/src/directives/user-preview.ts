/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, ref } from 'vue';
import type { ObjectDirective } from 'vue';
import { popup } from '@/os.js';

export const vUserPreview: ObjectDirective<HTMLElement, string | null | undefined> = {
	mounted(src, binding) {
		if (binding.value == null) return;

		// TODO: 新たにプロパティを作るのをやめMapを使う
		// ただメモリ的には↓の方が省メモリかもしれないので検討中
		const self = (src as any)._userPreviewDirective_ = {} as any;

		self.preview = new UserPreview(src, binding.value);
	},

	unmounted(src, binding) {
		if (binding.value == null) return;

		const self = src._userPreviewDirective_;
		self.preview.detach();
	},
};

class UserPreview {
	private el: HTMLElement;
	private user: string;
	private showTimer: number | null = null;
	private hideTimer: number | null = null;
	private checkTimer: number | null = null;
	private promise: { cancel: () => void } | null = null;

	constructor(el, user) {
		this.el = el;
		this.user = user;

		this.show = this.show.bind(this);
		this.close = this.close.bind(this);
		this.onMouseover = this.onMouseover.bind(this);
		this.onMouseleave = this.onMouseleave.bind(this);
		this.onClick = this.onClick.bind(this);
		this.attach = this.attach.bind(this);
		this.detach = this.detach.bind(this);

		this.attach();
	}

	private show() {
		if (!document.body.contains(this.el)) return;
		if (this.promise) return;

		const showing = ref(true);

		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkUserPopup.vue')), {
			showing,
			q: this.user,
			source: this.el,
		}, {
			mouseover: () => {
				if (this.hideTimer != null) window.clearTimeout(this.hideTimer);
			},
			mouseleave: () => {
				if (this.showTimer != null) window.clearTimeout(this.showTimer);
				this.hideTimer = window.setTimeout(this.close, 500);
			},
			closed: () => dispose(),
		});

		this.promise = {
			cancel: () => {
				showing.value = false;
			},
		};

		this.checkTimer = window.setInterval(() => {
			if (!document.body.contains(this.el)) {
				if (this.showTimer != null) window.clearTimeout(this.showTimer);
				if (this.hideTimer != null) window.clearTimeout(this.hideTimer);
				this.close();
			}
		}, 1000);
	}

	private close() {
		if (this.promise) {
			if (this.checkTimer != null) window.clearInterval(this.checkTimer);
			this.promise.cancel();
			this.promise = null;
		}
	}

	private onMouseover() {
		if (this.showTimer != null) window.clearTimeout(this.showTimer);
		if (this.hideTimer != null) window.clearTimeout(this.hideTimer);
		this.showTimer = window.setTimeout(this.show, 500);
	}

	private onMouseleave() {
		if (this.showTimer != null) window.clearTimeout(this.showTimer);
		if (this.hideTimer != null) window.clearTimeout(this.hideTimer);
		this.hideTimer = window.setTimeout(this.close, 500);
	}

	private onClick() {
		if (this.showTimer != null) window.clearTimeout(this.showTimer);
		this.close();
	}

	public attach() {
		this.el.addEventListener('mouseover', this.onMouseover);
		this.el.addEventListener('mouseleave', this.onMouseleave);
		this.el.addEventListener('click', this.onClick);
	}

	public detach() {
		this.el.removeEventListener('mouseover', this.onMouseover);
		this.el.removeEventListener('mouseleave', this.onMouseleave);
		this.el.removeEventListener('click', this.onClick);
	}
}
