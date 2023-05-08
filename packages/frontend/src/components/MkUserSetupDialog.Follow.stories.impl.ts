/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import MkUserSetupDialog_Follow from './MkUserSetupDialog.Follow.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkUserSetupDialog_Follow,
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
			template: '<MkUserSetupDialog_Follow v-bind="props" />',
		};
	},
	args: {
		
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserSetupDialog_Follow>;
