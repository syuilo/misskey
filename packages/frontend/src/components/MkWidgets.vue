<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<template v-if="edit">
		<header :class="$style.editHeader">
			<MkSelect v-model="widgetAdderSelected" style="margin-bottom: var(--MI-margin)" data-cy-widget-select>
				<template #label>{{ i18n.ts.selectWidget }}</template>
				<option v-for="widget in widgetDefs" :key="widget" :value="widget">{{ i18n.ts._widgets[widget] }}</option>
			</MkSelect>
			<MkButton inline primary data-cy-widget-add @click="addWidget"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
			<MkButton inline @click="$emit('exit')">{{ i18n.ts.close }}</MkButton>
		</header>
		<div ref="dndParentEl" :class="$style.editEditing">
			<div v-for="widgetId in widgetIds" :key="widgetId" :class="[$style.widget, $style.customizeContainer]" data-cy-customize-container>
				<button :class="$style.customizeContainerConfig" class="_button" @click.prevent.stop="configWidget(widgetId)"><i class="ti ti-settings"></i></button>
				<button :class="$style.customizeContainerRemove" data-cy-customize-container-remove class="_button" @click.prevent.stop="removeWidget(getWidgetById(widgetId)!)"><i class="ti ti-x"></i></button>
				<div class="handle">
					<component :is="`widget-${getWidgetById(widgetId)!.name}`" :ref="el => widgetRefs[widgetId] = el" class="widget" :class="$style.customizeContainerHandleWidget" :widget="getWidgetById(widgetId)!" @updateProps="updateWidget(widgetId, $event)"/>
				</div>
			</div>
		</div>
	</template>
	<component :is="`widget-${widget.name}`" v-for="widget in widgets" v-else :key="widget.id" :ref="el => widgetRefs[widget.id] = el" :class="$style.widget" :widget="widget" @updateProps="updateWidget(widget.id, $event)" @contextmenu.stop="onContextmenu(widget, $event)"/>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import { animations } from '@formkit/drag-and-drop';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { widgets as widgetDefs } from '@/widgets/index.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { isLink } from '@@/js/is-link.js';

import type { Widget, WidgetProps } from '@/widgets/widget.js';

const props = defineProps<{
	widgets: Widget[];
	edit: boolean;
}>();

const emit = defineEmits<{
	(ev: 'updateWidgets', widgets: Widget[]): void;
	(ev: 'addWidget', widget: Widget): void;
	(ev: 'removeWidget', widget: Widget): void;
	(ev: 'updateWidget', widget: Partial<Widget>): void;
	(ev: 'exit'): void;
}>();

function updateWidgetIds(to: Widget[]) {
	return to.map(w => w.id);
}

function getWidgetById(id: string) {
	return props.widgets.find(w => w.id === id) ?? null;
}

const widgetIds = ref(updateWidgetIds(props.widgets));

watch(() => props.widgets, (to) => {
	const updated = updateWidgetIds(to);
	widgetIds.value = updated;
});

const dndParentEl = shallowRef<HTMLElement>();

dragAndDrop({
	parent: dndParentEl,
	values: widgetIds,
	plugins: [animations()],
	dragHandle: '.handle',
	onDragend: () => {
		// Widget ids to widget object array
		const widgets = widgetIds.value.map(id => props.widgets.find(w => w.id === id) ?? null).filter(w => w !== null);
		emit('updateWidgets', widgets);
	},
});

const widgetRefs = {};
const configWidget = (id: string) => {
	widgetRefs[id].configure();
};

const widgetAdderSelected = ref<string | null>(null);
const addWidget = () => {
	if (widgetAdderSelected.value == null) return;

	emit('addWidget', {
		name: widgetAdderSelected.value,
		id: uuid(),
		data: {},
	});

	widgetAdderSelected.value = null;
};

const removeWidget = (widget: Widget) => {
	emit('removeWidget', widget);
};

const updateWidget = (id: string, data: Partial<WidgetProps>) => {
	emit('updateWidget', { id, data });
};

function onContextmenu(widget: Widget, ev: MouseEvent) {
	const element = ev.target as HTMLElement | null;
	if (element && isLink(element)) return;
	if (element && (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(element.tagName) || element.attributes['contenteditable'])) return;
	if (window.getSelection()?.toString() !== '') return;

	os.contextMenu([{
		type: 'label',
		text: i18n.ts._widgets[widget.name],
	}, {
		icon: 'ti ti-settings',
		text: i18n.ts.settings,
		action: () => {
			configWidget(widget.id);
		},
	}], ev);
}
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
}

.widget {
	contain: content;
	margin: var(--MI-margin) 0;

	&:first-of-type {
		margin-top: 0;
	}
}

.edit {
	&Header {
		margin: 16px 0;

		> * {
			width: 100%;
			padding: 4px;
		}
	}

	&Editing {
		min-height: 100px;
	}
}

.customizeContainer {
	position: relative;
	cursor: move;

	&Config,
	&Remove {
		position: absolute;
		z-index: 10000;
		top: 8px;
		width: 32px;
		height: 32px;
		color: #fff;
		background: rgba(#000, 0.7);
		border-radius: 4px;
	}

	&Config {
		right: 8px + 8px + 32px;
	}

	&Remove {
		right: 8px;
	}

	&Handle {

		&Widget {
			pointer-events: none;
		}
	}

}

</style>
