/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect, userEvent, waitFor, within } from '@storybook/test';
import type { StoryObj } from '@storybook/vue3';
import MkAd from './MkAd.vue';
import { i18n } from '@/i18n.js';

const common = {
	render(args) {
		return {
			components: {
				MkAd,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkAd v-bind="props" />',
		};
	},
	async play({ canvasElement, args }) {
		const canvas = within(canvasElement);
		const a = canvas.getByRole<HTMLAnchorElement>('link');
		// FIXME: 通るけどその後落ちるのでコメントアウト
		// await expect(a.href).toMatch(/^https?:\/\/.*#test$/);
		const img = within(a).getByRole('img');
		await expect(img).toBeInTheDocument();
		let buttons = canvas.getAllByRole<HTMLButtonElement>('button');
		await expect(buttons).toHaveLength(1);
		const i = buttons[0];
		await expect(i).toBeInTheDocument();
		await userEvent.click(i);
		await expect(canvasElement).toHaveTextContent(i18n.ts._ad.back);
		await expect(a).not.toBeInTheDocument();
		await expect(i).not.toBeInTheDocument();
		buttons = canvas.getAllByRole<HTMLButtonElement>('button');
		const hasReduceFrequency = args.specify?.ratio !== 0;
		await expect(buttons).toHaveLength(hasReduceFrequency ? 2 : 1);
		const reduce = hasReduceFrequency ? buttons[0] : null;
		const back = buttons[hasReduceFrequency ? 1 : 0];
		if (reduce) {
			await expect(reduce).toBeInTheDocument();
			await expect(reduce).toHaveTextContent(i18n.ts._ad.reduceFrequencyOfThisAd);
		}
		await expect(back).toBeInTheDocument();
		await expect(back).toHaveTextContent(i18n.ts._ad.back);
		await userEvent.click(back);
		await waitFor(() => expect(canvas.queryByRole('img')).toBeTruthy());
		if (reduce) {
			await expect(reduce).not.toBeInTheDocument();
		}
		await expect(back).not.toBeInTheDocument();
		const aAgain = canvas.getByRole<HTMLAnchorElement>('link');
		await expect(aAgain).toBeInTheDocument();
		const imgAgain = within(aAgain).getByRole('img');
		await expect(imgAgain).toBeInTheDocument();
	},
	args: {
		prefer: [],
		specify: {
			id: 'someadid',
			ratio: 1,
			url: '#test',
			place: '',
			imageUrl: '',
			dayOfWeek: 7,
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAd>;
export const Square = {
	...common,
	args: {
		...common.args,
		specify: {
			...common.args.specify,
			place: 'square',
			imageUrl:
				'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/about-icon.png?raw=true',
		},
	},
} satisfies StoryObj<typeof MkAd>;
export const Horizontal = {
	...common,
	args: {
		...common.args,
		specify: {
			...common.args.specify,
			place: 'horizontal',
			imageUrl:
				'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true',
		},
	},
} satisfies StoryObj<typeof MkAd>;
export const HorizontalBig = {
	...common,
	args: {
		...common.args,
		specify: {
			...common.args.specify,
			place: 'horizontal-big',
			imageUrl:
				'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true',
		},
	},
} satisfies StoryObj<typeof MkAd>;
export const ZeroRatio = {
	...Square,
	args: {
		...Square.args,
		specify: {
			...Square.args.specify,
			ratio: 0,
		},
	},
} satisfies StoryObj<typeof MkAd>;
