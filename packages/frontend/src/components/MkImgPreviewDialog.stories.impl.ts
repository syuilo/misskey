/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StoryObj } from '@storybook/vue3';
import { file } from '../../.storybook/fakes.js';
import MkImgPreviewDialog from './MkImgPreviewDialog.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkImgPreviewDialog,
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
			template: '<MkImgPreviewDialog v-bind="props" />',
		};
	},
	args: {
		file: file(),
	},
	parameters: {
		chromatic: {
			// NOTE: ロードが終わるまで待つ
			delay: 3000,
		},
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkImgPreviewDialog>;
