<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div :class="$style.header">
		<MkSelect v-model="type" :class="$style.typeSelect">
			<option value="isLocal">{{ i18n.ts._role._condition.isLocal }}</option>
			<option value="isRemote">{{ i18n.ts._role._condition.isRemote }}</option>
			<option value="isSuspended">{{ i18n.ts._role._condition.isSuspended }}</option>
			<option value="isLocked">{{ i18n.ts._role._condition.isLocked }}</option>
			<option value="isBot">{{ i18n.ts._role._condition.isBot }}</option>
			<option value="isCat">{{ i18n.ts._role._condition.isCat }}</option>
			<option value="isExplorable">{{ i18n.ts._role._condition.isExplorable }}</option>
			<option value="roleAssignedTo">{{ i18n.ts._role._condition.roleAssignedTo }}</option>
			<option value="createdLessThan">{{ i18n.ts._role._condition.createdLessThan }}</option>
			<option value="createdMoreThan">{{ i18n.ts._role._condition.createdMoreThan }}</option>
			<option value="followersLessThanOrEq">{{ i18n.ts._role._condition.followersLessThanOrEq }}</option>
			<option value="followersMoreThanOrEq">{{ i18n.ts._role._condition.followersMoreThanOrEq }}</option>
			<option value="followingLessThanOrEq">{{ i18n.ts._role._condition.followingLessThanOrEq }}</option>
			<option value="followingMoreThanOrEq">{{ i18n.ts._role._condition.followingMoreThanOrEq }}</option>
			<option value="notesLessThanOrEq">{{ i18n.ts._role._condition.notesLessThanOrEq }}</option>
			<option value="notesMoreThanOrEq">{{ i18n.ts._role._condition.notesMoreThanOrEq }}</option>
			<option value="and">{{ i18n.ts._role._condition.and }}</option>
			<option value="or">{{ i18n.ts._role._condition.or }}</option>
			<option value="not">{{ i18n.ts._role._condition.not }}</option>
		</MkSelect>
		<button v-if="draggable" class="drag-handle _button" :class="$style.dragHandle">
			<i class="ti ti-menu-2"></i>
		</button>
		<button v-if="draggable" class="_button" :class="$style.remove" @click="removeSelf">
			<i class="ti ti-x"></i>
		</button>
	</div>

	<div v-if="type === 'and' || type === 'or'" class="_gaps">
		<div ref="dndParentEl" class="_gaps">
			<div v-for="valueId in valueIds" :key="valueId" :class="$style.item">
				<RolesEditorFormula :modelValue="valueKv[valueId]" draggable @update:modelValue="valuesItemUpdated" @remove="removeItem(valueId)"/>
			</div>
		</div>
		<MkButton rounded style="margin: 0 auto;" @click="addValue"><i class="ti ti-plus"></i> {{ i18n.ts.add }}</MkButton>
	</div>

	<div v-else-if="assertValueNot(v)" :class="$style.item">
		<RolesEditorFormula v-model="v.value"/>
	</div>

	<MkInput v-else-if="['createdMoreThan', 'createdLessThan'].includes(type) && 'sec' in v" v-model="v.sec" type="number">
		<template #suffix>sec</template>
	</MkInput>

	<MkInput v-else-if="['followersLessThanOrEq', 'followersMoreThanOrEq', 'followingLessThanOrEq', 'followingMoreThanOrEq', 'notesLessThanOrEq', 'notesMoreThanOrEq'].includes(type) && 'value' in v" v-model="v.value" type="number">
	</MkInput>

	<MkSelect v-else-if="type === 'roleAssignedTo' && 'roleId' in v" v-model="v.roleId">
		<option v-for="role in roles.filter(r => r.target === 'manual')" :key="role.id" :value="role.id">{{ role.name }}</option>
	</MkSelect>
</div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import * as Misskey from 'misskey-js';
import { animations } from '@formkit/drag-and-drop';
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import MkInput from '@/components/MkInput.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { deepClone } from '@/scripts/clone.js';
import { rolesCache } from '@/cache.js';

const emit = defineEmits<{
	(ev: 'update:modelValue', value: Misskey.entities.RoleCondFormulaValue): void;
	(ev: 'remove'): void;
}>();

const props = defineProps<{
	modelValue: Misskey.entities.RoleCondFormulaValue;
	draggable?: boolean;
}>();

function assertLogicFormula(f: Misskey.entities.RoleCondFormulaValue): f is Misskey.entities.RoleCondFormulaLogics {
	return ['and', 'or'].includes(f.type);
}

function assertValueNot(f: Misskey.entities.RoleCondFormulaValue): f is Misskey.entities.RoleCondFormulaValueNot {
	return f.type === 'not';
}

const dndParentEl = shallowRef<HTMLElement>();
const v = ref(deepClone(props.modelValue));

const valueKv = computed(() => {
	if (assertLogicFormula(v.value)) {
		return Object.fromEntries(v.value.values.map(v => [v.id, v] as const));
	} else {
		return [];
	}
});

function updateValueIds(to: Misskey.entities.RoleCondFormulaValue) {
	if (assertLogicFormula(to)) {
		return to.values.map(v => v.id);
	} else {
		return [];
	}
}

const valueIds = ref(updateValueIds(v.value));

watch(v, () => {
	valueIds.value = updateValueIds(v.value);
}, { deep: true });

dragAndDrop({
	parent: dndParentEl,
	values: valueIds,
	// TODO: v0.2.0時点では親子階層のドラッグアンドドロップは不安定
	//group: 'roleFormula',
	dragHandle: '.drag-handle',
	plugins: [animations()],
	onDragend: () => {
		if (assertLogicFormula(v.value)) {
			v.value.values = valueIds.value.map(id => {
				if (assertLogicFormula(v.value)) {
					return v.value.values.find(v => v.id === id) ?? null;
				} else {
					return null;
				}
			}).filter(v => v !== null);
		}
	},
});

const roles = await rolesCache.fetch();

watch(() => props.modelValue, () => {
	if (JSON.stringify(props.modelValue) === JSON.stringify(v.value)) return;
	v.value = deepClone(props.modelValue);
}, { deep: true });

watch(v, () => {
	emit('update:modelValue', v.value);
}, { deep: true });

const type = computed({
	get: () => v.value.type,
	set: (t) => {
		v.value.type = t;

		if (v.value.type === 'and') v.value.values = [];
		if (v.value.type === 'or') v.value.values = [];
		if (v.value.type === 'not') v.value.value = { id: uuid(), type: 'isRemote' };
		if (v.value.type === 'roleAssignedTo') v.value.roleId = '';
		if (v.value.type === 'createdLessThan') v.value.sec = 86400;
		if (v.value.type === 'createdMoreThan') v.value.sec = 86400;
		if (v.value.type === 'followersLessThanOrEq') v.value.value = 10;
		if (v.value.type === 'followersMoreThanOrEq') v.value.value = 10;
		if (v.value.type === 'followingLessThanOrEq') v.value.value = 10;
		if (v.value.type === 'followingMoreThanOrEq') v.value.value = 10;
		if (v.value.type === 'notesLessThanOrEq') v.value.value = 10;
		if (v.value.type === 'notesMoreThanOrEq') v.value.value = 10;
	},
});

function addValue() {
	if (!assertLogicFormula(v.value)) return;
	v.value.values.push({ id: uuid(), type: 'isRemote' });
}

function valuesItemUpdated(item: Misskey.entities.RoleCondFormulaValue) {
	if (!assertLogicFormula(v.value)) return;
	const i = v.value.values.findIndex(_item => _item.id === item.id);
	v.value.values[i] = item;
}

function removeItem(itemId: string) {
	if (!assertLogicFormula(v.value)) return;
	v.value.values = v.value.values.filter(_item => _item.id !== itemId);
}

function removeSelf() {
	emit('remove');
}
</script>

<style lang="scss" module>
.header {
	display: flex;
}

.typeSelect {
	flex: 1;
}

.dragHandle {
	cursor: move;
	margin-left: 10px;
}

.remove {
	margin-left: 10px;
}

.item {
	border: solid 2px var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	padding: 12px;

	&:hover {
		border-color: var(--MI_THEME-accent);
	}
}
</style>
