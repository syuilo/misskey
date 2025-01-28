/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import type { StoryObj } from '@storybook/vue3';
import { action } from '@storybook/addon-actions';
import MkCodeEditor from './MkCodeEditor.vue';
const code = `for (let i, 100) {
	<: if (i % 15 == 0) "FizzBuzz"
		elif (i % 3 == 0) "Fizz"
		elif (i % 5 == 0) "Buzz"
		else i
}`;
export const Default = {
	render(args) {
		return {
			components: {
				MkCodeEditor,
			},
			data() {
				return {
					code,
				};
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
				events() {
					return {
						'change': action('change'),
						'keydown': action('keydown'),
						'enter': action('enter'),
						'update:modelValue': action('update:modelValue'),
					};
				},
			},
			template: '<MkCodeEditor v-model="code" v-bind="props" v-on="events" />',
		};
	},
	args: {
		lang: 'aiscript',
	},
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		() => ({
			template: '<div style="display: flex; align-items: center; justify-content: center; height: 100vh"><div style="max-width: 800px; width: 100%; margin: 3rem"><Suspense><story/></Suspense></div></div>',
		}),
	],
} satisfies StoryObj<typeof MkCodeEditor>;
