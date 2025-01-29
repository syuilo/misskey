<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	v-if="cell.row.using"
	ref="rootEl"
	class="mk_grid_td"
	:class="$style.cell"
	:style="{ maxWidth: cellWidth, minWidth: cellWidth }"
	:tabindex="-1"
	data-grid-cell
	:data-grid-cell-row="cell.row.index"
	:data-grid-cell-col="cell.column.index"
	@keydown="onCellKeyDown"
	@dblclick.prevent="onCellDoubleClick"
>
	<div
		:class="[
			$style.root,
			[(cell.violation.valid || cell.selected) ? {} : $style.error],
			[cell.selected ? $style.selected : {}],
			// 行が選択されているときは範囲選択色の適用を行側に任せる
			[(cell.ranged && !cell.row.ranged) ? $style.ranged : {}],
			[needsContentCentering ? $style.center : {}],
		]"
	>
		<div v-if="!editing" :class="[$style.contentArea]" :style="cellType === 'boolean' ? 'justify-content: center' : ''">
			<div ref="contentAreaEl" :class="$style.content">
				<div v-if="cellType === 'text'">
					{{ cell.value }}
				</div>
				<div v-if="cellType === 'number'">
					{{ cell.value }}
				</div>
				<div v-if="cellType === 'date'">
					{{ cell.value }}
				</div>
				<div v-else-if="cellType === 'boolean'">
					<div :class="[$style.bool, {
						[$style.boolTrue]: cell.value === true,
						'ti ti-check': cell.value === true,
					}]"></div>
				</div>
				<div v-else-if="cellType === 'image'">
					<img
						:src="cell.value"
						:alt="cell.value"
						:class="$style.viewImage"
						@load="emitContentSizeChanged"
					/>
				</div>
			</div>
		</div>
		<div v-else ref="inputAreaEl" :class="$style.inputArea">
			<input
				v-if="cellType === 'text'"
				type="text"
				:class="$style.editingInput"
				:value="editingValue"
				@input="onInputText"
				@mousedown.stop
				@contextmenu.stop
			/>
			<input
				v-if="cellType === 'number'"
				type="number"
				:class="$style.editingInput"
				:value="editingValue"
				@input="onInputText"
				@mousedown.stop
				@contextmenu.stop
			/>
			<input
				v-if="cellType === 'date'"
				type="date"
				:class="$style.editingInput"
				:value="editingValue"
				@input="onInputText"
				@mousedown.stop
				@contextmenu.stop
			/>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, toRefs, watch } from 'vue';
import { GridEventEmitter, Size } from '@/components/grid/grid.js';
import { useTooltip } from '@/scripts/use-tooltip.js';
import * as os from '@/os.js';
import { CellValue, GridCell } from '@/components/grid/cell.js';
import { equalCellAddress, getCellAddress } from '@/components/grid/grid-utils.js';
import { GridRowSetting } from '@/components/grid/row.js';

const emit = defineEmits<{
	(ev: 'operation:beginEdit', sender: GridCell): void;
	(ev: 'operation:endEdit', sender: GridCell): void;
	(ev: 'change:value', sender: GridCell, newValue: CellValue): void;
	(ev: 'change:contentSize', sender: GridCell, newSize: Size): void;
}>();
const props = defineProps<{
	cell: GridCell,
	rowSetting: GridRowSetting,
	bus: GridEventEmitter,
}>();

const { cell, bus } = toRefs(props);

const rootEl = shallowRef<InstanceType<typeof HTMLTableCellElement>>();
const contentAreaEl = shallowRef<InstanceType<typeof HTMLDivElement>>();
const inputAreaEl = shallowRef<InstanceType<typeof HTMLDivElement>>();

/** 値が編集中かどうか */
const editing = ref<boolean>(false);
/** 編集中の値. {@link beginEditing}と{@link endEditing}内、および各inputタグやそのコールバックからの操作のみを想定する */
const editingValue = ref<CellValue>(undefined);

const cellWidth = computed(() => cell.value.column.width);
const cellType = computed(() => cell.value.column.setting.type);
const needsContentCentering = computed(() => {
	switch (cellType.value) {
		case 'boolean':
			return true;
		default:
			return false;
	}
});

watch(() => [cell.value.value], () => {
	// 中身がセットされた直後はサイズが分からないので、次のタイミングで更新する
	nextTick(emitContentSizeChanged);
}, { immediate: true });

watch(() => cell.value.selected, () => {
	if (cell.value.selected) {
		requestFocus();
	}
});

function onCellDoubleClick(ev: MouseEvent) {
	switch (ev.type) {
		case 'dblclick': {
			beginEditing(ev.target as HTMLElement);
			break;
		}
	}
}

function onOutsideMouseDown(ev: MouseEvent) {
	const isOutside = ev.target instanceof Node && !rootEl.value?.contains(ev.target);
	if (isOutside || !equalCellAddress(cell.value.address, getCellAddress(ev.target as HTMLElement))) {
		endEditing(true, false);
	}
}

function onCellKeyDown(ev: KeyboardEvent) {
	if (!editing.value) {
		ev.preventDefault();
		switch (ev.code) {
			case 'NumpadEnter':
			case 'Enter':
			case 'F2': {
				beginEditing(ev.target as HTMLElement);
				break;
			}
		}
	} else {
		switch (ev.code) {
			case 'Escape': {
				endEditing(false, true);
				break;
			}
			case 'NumpadEnter':
			case 'Enter': {
				if (!ev.isComposing) {
					endEditing(true, true);
				}
			}
		}
	}
}

function onInputText(ev: Event) {
	editingValue.value = (ev.target as HTMLInputElement).value;
}

function onForceRefreshContentSize() {
	emitContentSizeChanged();
}

function registerOutsideMouseDown() {
	unregisterOutsideMouseDown();
	addEventListener('mousedown', onOutsideMouseDown);
}

function unregisterOutsideMouseDown() {
	removeEventListener('mousedown', onOutsideMouseDown);
}

async function beginEditing(target: HTMLElement) {
	if (editing.value || !cell.value.selected || !cell.value.column.setting.editable) {
		return;
	}

	if (cell.value.column.setting.customValueEditor) {
		emit('operation:beginEdit', cell.value);
		const newValue = await cell.value.column.setting.customValueEditor(
			cell.value.row,
			cell.value.column,
			cell.value.value,
			target,
		);
		emit('operation:endEdit', cell.value);

		if (newValue !== cell.value.value) {
			emitValueChange(newValue);
		}

		requestFocus();
	} else {
		switch (cellType.value) {
			case 'number':
			case 'date':
			case 'text': {
				editingValue.value = cell.value.value;
				editing.value = true;
				registerOutsideMouseDown();
				emit('operation:beginEdit', cell.value);

				await nextTick(() => {
					// inputの展開後にフォーカスを当てたい
					if (inputAreaEl.value) {
						(inputAreaEl.value.querySelector('*') as HTMLElement).focus();
					}
				});
				break;
			}
			case 'boolean': {
				// とくに特殊なUIは設けず、トグルするだけ
				emitValueChange(!cell.value.value);
				break;
			}
		}
	}
}

function endEditing(applyValue: boolean, requireFocus: boolean) {
	if (!editing.value) {
		return;
	}

	const newValue = editingValue.value;
	editingValue.value = undefined;

	emit('operation:endEdit', cell.value);
	unregisterOutsideMouseDown();

	if (applyValue && newValue !== cell.value.value) {
		emitValueChange(newValue);
	}

	editing.value = false;

	if (requireFocus) {
		requestFocus();
	}
}

function requestFocus() {
	nextTick(() => {
		rootEl.value?.focus();
	});
}

function emitValueChange(newValue: CellValue) {
	const _cell = cell.value;
	emit('change:value', _cell, newValue);
}

function emitContentSizeChanged() {
	emit('change:contentSize', cell.value, {
		width: contentAreaEl.value?.clientWidth ?? 0,
		height: contentAreaEl.value?.clientHeight ?? 0,
	});
}

useTooltip(rootEl, (showing) => {
	if (cell.value.violation.valid) {
		return;
	}

	const content = cell.value.violation.violations.filter(it => !it.valid).map(it => it.result.message).join('\n');
	const result = os.popup(defineAsyncComponent(() => import('@/components/grid/MkCellTooltip.vue')), {
		showing,
		content,
		targetElement: rootEl.value!,
	}, {
		closed: () => {
			result.dispose();
		},
	});
});

onMounted(() => {
	bus.value.on('forceRefreshContentSize', onForceRefreshContentSize);
});

onUnmounted(() => {
	bus.value.off('forceRefreshContentSize', onForceRefreshContentSize);
});

</script>

<style module lang="scss">
$cellHeight: 28px;

.cell {
	overflow: hidden;
	white-space: nowrap;
	height: $cellHeight;
	max-height: $cellHeight;
	min-height: $cellHeight;
	cursor: cell;

	&:focus {
		outline: none;
	}
}

.root {
	display: flex;
	flex-direction: row;
	align-items: center;
	box-sizing: border-box;
	height: 100%;

	// selected適用時に中身がズレてしまうので、透明の線をあらかじめ引いておきたい
	border: solid 0.5px transparent;

	&.selected {
		border: solid 0.5px var(--MI_THEME-accentLighten);
	}

	&.ranged {
		background-color: var(--MI_THEME-accentedBg);
	}

	&.center {
		justify-content: center;
	}

	&.error {
		border: solid 0.5px var(--MI_THEME-error);
	}
}

.contentArea, .inputArea {
	display: flex;
	align-items: center;
	width: 100%;
	max-width: 100%;
}

.content {
	display: inline-block;
	padding: 0 8px;
}

.viewImage {
	width: auto;
	max-height: $cellHeight;
	height: $cellHeight;
	object-fit: cover;
}

.bool {
	position: relative;
	width: 18px;
	height: 18px;
	background: var(--MI_THEME-panel);
	border: solid 2px var(--MI_THEME-divider);
	border-radius: 4px;
	box-sizing: border-box;

	&.boolTrue {
		border-color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accent);

		&::before {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			color: var(--MI_THEME-fgOnAccent);
			font-size: 12px;
			line-height: 18px;
		}
	}
}

.editingInput {
	padding: 0 8px;
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	min-height: $cellHeight - 2;
	max-height: $cellHeight - 2;
	height: $cellHeight - 2;
	outline: none;
	border: none;
	font-family: 'Hiragino Maru Gothic Pro', "BIZ UDGothic", Roboto, HelveticaNeue, Arial, sans-serif;
}

</style>
