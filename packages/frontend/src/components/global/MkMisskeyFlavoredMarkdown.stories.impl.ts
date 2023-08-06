// @ts-nocheck
/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { within } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import MkMisskeyFlavoredMarkdown from './MkMisskeyFlavoredMarkdown.ts';
export const Default = {
	render(args) {
		return {
			components: {
				MkMisskeyFlavoredMarkdown,
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
			template: '<MkMisskeyFlavoredMarkdown v-bind="props" />',
		};
	},
	async play({ canvasElement, args }) {
		const canvas = within(canvasElement);
		if (args.plain) {
			const aiHelloMiskist = canvas.getByText('@ai *Hello*, #Miskist!');
			await expect(aiHelloMiskist).toBeInTheDocument();
		} else {
			const ai = canvas.getByText('@ai');
			await expect(ai).toBeInTheDocument();
			await expect(ai.closest('a')).toHaveAttribute('href', '/@ai');
			const hello = canvas.getByText('Hello');
			await expect(hello).toBeInTheDocument();
			await expect(hello.style.fontStyle).toBe('oblique');
			const miskist = canvas.getByText('#Miskist');
			await expect(miskist).toBeInTheDocument();
			await expect(miskist).toHaveAttribute('href', args.isNote ?? true ? '/tags/Miskist' : '/user-tags/Miskist');
		}
		const heart = canvas.getByAltText('❤');
		await expect(heart).toBeInTheDocument();
		await expect(heart).toHaveAttribute('src', '/twemoji/2764.svg');
	},
	args: {
		text: '@ai *Hello*, #Miskist! ❤',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMisskeyFlavoredMarkdown>;
export const Plain = {
	...Default,
	args: {
		...Default.args,
		plain: true,
	},
} satisfies StoryObj<typeof MkMisskeyFlavoredMarkdown>;
export const Nowrap = {
	...Default,
	args: {
		...Default.args,
		nowrap: true,
	},
} satisfies StoryObj<typeof MkMisskeyFlavoredMarkdown>;
export const IsNotNote = {
	...Default,
	args: {
		...Default.args,
		isNote: false,
	},
} satisfies StoryObj<typeof MkMisskeyFlavoredMarkdown>;
