<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<script lang="ts">
// @ts-nocheck
import { defineComponent, h, resolveDirective, withDirectives } from 'vue';

export default defineComponent({
	props: {
		modelValue: {
			required: true,
		},
	},
	setup(props, { emit, slots }) {
		const options = slots.default();

		return () => h('div', {
			class: 'pxhvhrfw',
		}, options.map(option => withDirectives(h('button', {
			class: ['_button', { active: props.modelValue === option.props.value }],
			key: option.key,
			disabled: props.modelValue === option.props.value,
			onClick: () => {
				emit('update:modelValue', option.props.value);
			},
		}, option.children), [
			[resolveDirective('click-anime')],
		])));
	},
});
</script>

<style lang="scss">
.pxhvhrfw {
	display: flex;
	font-size: 90%;

	> button {
		flex: 1;
		padding: 10px 8px;
		border-radius: 999px;

		&:disabled {
			opacity: 1 !important;
			cursor: default;
		}

		&.active {
			color: var(--accent);
			background: var(--accentedBg);
		}

		&:not(.active):hover {
			color: var(--fgHighlighted);
			background: var(--panelHighlight);
		}

		&:not(:first-child) {
			margin-left: 8px;
		}

		> .icon {
			margin-right: 6px;
		}
	}
}

@container (max-width: 500px) {
	.pxhvhrfw {
		font-size: 80%;

		> button {
			padding: 11px 8px;
		}
	}
}
</style>
