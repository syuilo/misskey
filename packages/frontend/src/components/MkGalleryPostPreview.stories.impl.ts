/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { expect, userEvent, waitFor, within } from '@storybook/test';
import type { StoryObj } from '@storybook/vue3';
import { galleryPost } from '../../.storybook/fakes.js';
import MkGalleryPostPreview from './MkGalleryPostPreview.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkGalleryPostPreview,
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
			template: '<MkGalleryPostPreview v-bind="props" />',
		};
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);
		const links = canvas.getAllByRole('link');
		expect(links).toHaveLength(2);
		expect(links[0]).toHaveAttribute('href', `/gallery/${galleryPost().id}`);
		expect(links[1]).toHaveAttribute('href', `/@${galleryPost().user.username}@${galleryPost().user.host}`);
		const images = canvas.getAllByRole<HTMLImageElement>('img');
		await waitFor(() => expect(Promise.all(images.map((image) => image.decode()))).resolves.toBeDefined());
	},
	args: {
		post: galleryPost(),
	},
	decorators: [
		() => ({
			template: '<div style="width:260px"><story /></div>',
		}),
	],
	parameters: {
		layout: 'centered',
		chromatic: {
			// FIXME: flaky
			disableSnapshot: true,
		},
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const Hover = {
	...Default,
	async play(context) {
		await Default.play(context);
		const canvas = within(context.canvasElement);
		const links = canvas.getAllByRole('link');
		await waitFor(() => userEvent.hover(links[0]));
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const HoverThenUnhover = {
	...Default,
	async play(context) {
		await Hover.play(context);
		const canvas = within(context.canvasElement);
		const links = canvas.getAllByRole('link');
		await waitFor(() => userEvent.unhover(links[0]));
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const Sensitive = {
	...Default,
	args: {
		...Default.args,
		post: galleryPost(true),
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const SensitiveHover = {
	...Hover,
	args: {
		...Hover.args,
		post: galleryPost(true),
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
export const SensitiveHoverThenUnhover = {
	...HoverThenUnhover,
	args: {
		...HoverThenUnhover.args,
		post: galleryPost(true),
	},
} satisfies StoryObj<typeof MkGalleryPostPreview>;
