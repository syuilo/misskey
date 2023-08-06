// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class StickySidebar {
	private lastScrollTop = 0;
	private container: HTMLElement;
	private el: HTMLElement;
	private spacer: HTMLElement;
	private marginTop: number;
	private isTop = false;
	private isBottom = false;
	private offsetTop: number;
	private globalHeaderHeight = 59;

	constructor(container: StickySidebar['container'], marginTop = 0, globalHeaderHeight = 0) {
		this.container = container;
		this.el = this.container.children[0] as HTMLElement;
		this.el.style.position = 'sticky';
		this.spacer = document.createElement('div');
		this.container.prepend(this.spacer);
		this.marginTop = marginTop;
		this.offsetTop = this.container.getBoundingClientRect().top;
		this.globalHeaderHeight = globalHeaderHeight;
	}

	public calc(scrollTop: number) {
		if (scrollTop > this.lastScrollTop) { // downscroll
			const overflow = Math.max(0, this.globalHeaderHeight + (this.el.clientHeight + this.marginTop) - window.innerHeight);
			this.el.style.bottom = null;
			this.el.style.top = `${-overflow + this.marginTop + this.globalHeaderHeight}px`;

			this.isBottom = (scrollTop + window.innerHeight) >= (this.el.offsetTop + this.el.clientHeight);

			if (this.isTop) {
				this.isTop = false;
				this.spacer.style.marginTop = `${Math.max(0, this.globalHeaderHeight + this.lastScrollTop + this.marginTop - this.offsetTop)}px`;
			}
		} else { // upscroll
			const overflow = this.globalHeaderHeight + (this.el.clientHeight + this.marginTop) - window.innerHeight;
			this.el.style.top = null;
			this.el.style.bottom = `${-overflow}px`;

			this.isTop = scrollTop + this.marginTop + this.globalHeaderHeight <= this.el.offsetTop;

			if (this.isBottom) {
				this.isBottom = false;
				this.spacer.style.marginTop = `${this.globalHeaderHeight + this.lastScrollTop + this.marginTop - this.offsetTop - overflow}px`;
			}
		}

		this.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
	}
}
