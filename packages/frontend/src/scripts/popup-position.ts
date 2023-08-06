// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function calcPopupPosition(el: HTMLElement, props: {
	anchorElement: HTMLElement | null;
	innerMargin: number;
	direction: 'top' | 'bottom' | 'left' | 'right';
	align: 'top' | 'bottom' | 'left' | 'right' | 'center';
	alignOffset?: number;
	x?: number;
	y?: number;
}): { top: number; left: number; transformOrigin: string; } {
	const contentWidth = el.offsetWidth;
	const contentHeight = el.offsetHeight;

	let rect: DOMRect;

	if (props.anchorElement) {
		rect = props.anchorElement.getBoundingClientRect();
	}

	const calcPosWhenTop = () => {
		let left: number;
		let top: number;

		if (props.anchorElement) {
			left = rect.left + window.pageXOffset + (props.anchorElement.offsetWidth / 2);
			top = (rect.top + window.pageYOffset - contentHeight) - props.innerMargin;
		} else {
			left = props.x;
			top = (props.y - contentHeight) - props.innerMargin;
		}

		left -= (el.offsetWidth / 2);

		if (left + contentWidth - window.pageXOffset > window.innerWidth) {
			left = window.innerWidth - contentWidth + window.pageXOffset - 1;
		}

		return [left, top];
	};

	const calcPosWhenBottom = () => {
		let left: number;
		let top: number;

		if (props.anchorElement) {
			left = rect.left + window.pageXOffset + (props.anchorElement.offsetWidth / 2);
			top = (rect.top + window.pageYOffset + props.anchorElement.offsetHeight) + props.innerMargin;
		} else {
			left = props.x;
			top = (props.y) + props.innerMargin;
		}

		left -= (el.offsetWidth / 2);

		if (left + contentWidth - window.pageXOffset > window.innerWidth) {
			left = window.innerWidth - contentWidth + window.pageXOffset - 1;
		}

		return [left, top];
	};

	const calcPosWhenLeft = () => {
		let left: number;
		let top: number;

		if (props.anchorElement) {
			left = (rect.left + window.pageXOffset - contentWidth) - props.innerMargin;
			top = rect.top + window.pageYOffset + (props.anchorElement.offsetHeight / 2);
		} else {
			left = (props.x - contentWidth) - props.innerMargin;
			top = props.y;
		}

		top -= (el.offsetHeight / 2);

		if (top + contentHeight - window.pageYOffset > window.innerHeight) {
			top = window.innerHeight - contentHeight + window.pageYOffset - 1;
		}

		return [left, top];
	};

	const calcPosWhenRight = () => {
		let left: number;
		let top: number;

		if (props.anchorElement) {
			left = (rect.left + props.anchorElement.offsetWidth + window.pageXOffset) + props.innerMargin;

			if (props.align === 'top') {
				top = rect.top + window.pageYOffset;
				if (props.alignOffset != null) top += props.alignOffset;
			} else if (props.align === 'bottom') {
				// TODO
			} else { // center
				top = rect.top + window.pageYOffset + (props.anchorElement.offsetHeight / 2);
				top -= (el.offsetHeight / 2);
			}
		} else {
			left = props.x + props.innerMargin;
			top = props.y;
			top -= (el.offsetHeight / 2);
		}

		if (top + contentHeight - window.pageYOffset > window.innerHeight) {
			top = window.innerHeight - contentHeight + window.pageYOffset - 1;
		}

		return [left, top];
	};

	const calc = (): {
		left: number;
		top: number;
		transformOrigin: string;
	} => {
		switch (props.direction) {
			case 'top': {
				const [left, top] = calcPosWhenTop();

				// ツールチップを上に向かって表示するスペースがなければ下に向かって出す
				if (top - window.pageYOffset < 0) {
					const [left, top] = calcPosWhenBottom();
					return { left, top, transformOrigin: 'center top' };
				}

				return { left, top, transformOrigin: 'center bottom' };
			}

			case 'bottom': {
				const [left, top] = calcPosWhenBottom();
				// TODO: ツールチップを下に向かって表示するスペースがなければ上に向かって出す
				return { left, top, transformOrigin: 'center top' };
			}

			case 'left': {
				const [left, top] = calcPosWhenLeft();

				// ツールチップを左に向かって表示するスペースがなければ右に向かって出す
				if (left - window.pageXOffset < 0) {
					const [left, top] = calcPosWhenRight();
					return { left, top, transformOrigin: 'left center' };
				}

				return { left, top, transformOrigin: 'right center' };
			}

			case 'right': {
				const [left, top] = calcPosWhenRight();
				// TODO: ツールチップを右に向かって表示するスペースがなければ左に向かって出す
				return { left, top, transformOrigin: 'left center' };
			}
		}
	};

	return calc();
}
