<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="cpjygsrt">
	<header>
		<div class="title"><slot name="header"></slot></div>
		<div class="buttons">
			<slot name="func"></slot>
			<button v-if="removable" class="_button" @click="remove()">
				<i class="ti ti-trash"></i>
			</button>
			<button v-if="draggable" class="drag-handle _button">
				<i class="ti ti-menu-2"></i>
			</button>
			<button class="_button" @click="toggleContent(!showBody)">
				<template v-if="showBody"><i class="ti ti-chevron-up"></i></template>
				<template v-else><i class="ti ti-chevron-down"></i></template>
			</button>
		</div>
	</header>
	<div v-show="showBody" class="body">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const props = withDefaults(defineProps<{
	expanded?: boolean;
	removable?: boolean;
	draggable?: boolean;
}>(), {
	expanded: true,
	removable: true,
});

const emit = defineEmits<{
	(ev: 'toggle', show: boolean): void;
	(ev: 'remove'): void;
}>();

const showBody = ref(props.expanded);

function toggleContent(show: boolean) {
	showBody.value = show;
	emit('toggle', show);
}

function remove() {
	emit('remove');
}
</script>

<style lang="scss" scoped>
.cpjygsrt {
	position: relative;
	overflow: hidden;
	background: var(--MI_THEME-panel);
	border: solid 2px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.1));
	border-radius: 8px;

	&:hover {
		border: solid 2px light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.15));
	}

	&.warn {
		border: solid 2px #dec44c;
	}

	&.error {
		border: solid 2px #f00;
	}

	> header {
		> .title {
			z-index: 1;
			margin: 0;
			padding: 0 16px;
			line-height: 42px;
			font-size: 0.9em;
			font-weight: bold;
			box-shadow: 0 1px rgba(#000, 0.07);

			> i {
				margin-right: 6px;
			}

			&:empty {
				display: none;
			}
		}

		> .buttons {
			position: absolute;
			z-index: 2;
			top: 0;
			right: 0;

			> button {
				padding: 0;
				width: 42px;
				font-size: 0.9em;
				line-height: 42px;
			}

			.drag-handle {
				cursor: move;
			}
		}
	}

	> .body {
		::v-deep(.juejbjww), ::v-deep(.eiipwacr) {
			&:not(.inline):first-child {
				margin-top: 28px;
			}

			&:not(.inline):last-child {
				margin-bottom: 20px;
			}
		}
	}
}
</style>
