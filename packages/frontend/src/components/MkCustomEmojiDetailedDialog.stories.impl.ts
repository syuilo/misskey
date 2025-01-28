/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import type { StoryObj } from '@storybook/vue3';
import { emojiDetailed } from '../../.storybook/fakes.js';
import MkCustomEmojiDetailedDialog from './MkCustomEmojiDetailedDialog.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkCustomEmojiDetailedDialog,
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
			template: '<MkCustomEmojiDetailedDialog v-bind="props" />',
		};
	},
	args: {
		emoji: emojiDetailed(),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCustomEmojiDetailedDialog>;
