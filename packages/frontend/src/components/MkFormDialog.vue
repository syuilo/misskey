<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="450"
	:canClose="false"
	:withOkButton="true"
	:okButtonDisabled="false"
	@click="cancel()"
	@ok="ok()"
	@close="cancel()"
	@closed="$emit('closed')"
>
	<template #header>
		{{ title }}
	</template>

	<MkSpacer :marginMin="20" :marginMax="32">
		<div class="_gaps_m">
			<template v-for="item in Object.keys(form).filter(item => !form[item].hidden)">
				<MkInput v-if="form[item].type === 'number'" v-model="values[item]" type="number" :step="form[item].step || 1">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkInput>
				<MkInput v-else-if="form[item].type === 'string' && !form[item].multiline" v-model="values[item]" type="text">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkInput>
				<MkTextarea v-else-if="form[item].type === 'string' && form[item].multiline" v-model="values[item]">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkTextarea>
				<MkSwitch v-else-if="form[item].type === 'boolean'" v-model="values[item]">
					<span v-text="form[item].label || item"></span>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkSwitch>
				<MkSelect v-else-if="form[item].type === 'enum'" v-model="values[item]">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="item in form[item].enum" :key="item.value" :value="item.value">{{ item.label }}</option>
				</MkSelect>
				<MkRadios v-else-if="form[item].type === 'radio'" v-model="values[item]">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="item in form[item].options" :key="item.value" :value="item.value">{{ item.label }}</option>
				</MkRadios>
				<MkRange v-else-if="form[item].type === 'range'" v-model="values[item]" :min="form[item].min" :max="form[item].max" :step="form[item].step" :textConverter="form[item].textConverter">
					<template #label><span v-text="form[item].label || item"></span><span v-if="form[item].required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="form[item].description" #caption>{{ form[item].description }}</template>
				</MkRange>
				<MkButton v-else-if="form[item].type === 'button'" @click="form[item].action($event, values)">
					<span v-text="form[item].content || item"></span>
				</MkButton>
			</template>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { reactive, shallowRef } from 'vue';
import MkInput from './MkInput.vue';
import MkTextarea from './MkTextarea.vue';
import MkSwitch from './MkSwitch.vue';
import MkSelect from './MkSelect.vue';
import MkRange from './MkRange.vue';
import MkButton from './MkButton.vue';
import MkRadios from './MkRadios.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n';

const props = defineProps<{
	title: string;
	form: any;
}>();

const emit = defineEmits<{
	(ev: 'done', v: {
		canceled?: boolean;
		result?: any;
	}): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();
const values = reactive({});

for (const item in props.form) {
	values[item] = props.form[item].default ?? null;
}

function ok() {
	emit('done', {
		result: values,
	});
	dialog.value.close();
}

function cancel() {
	emit('done', {
		canceled: true,
	});
	dialog.value.close();
}
</script>
