/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import MkDriveFileThumbnail from './MkDriveFileThumbnail.vue';
import { file } from '../../.storybook/fakes.js';
export const Default = {
	render(args) {
		return {
			components: {
				MkDriveFileThumbnail,
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
			template: '<MkDriveFileThumbnail v-bind="props" />',
		};
	},
	args: {
		file: file(),
		fit: 'contain',
	},
	parameters: {
		chromatic: {
			// NOTE: ロードが終わるまで待つ
			delay: 3000,
		},
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDriveFileThumbnail>;
