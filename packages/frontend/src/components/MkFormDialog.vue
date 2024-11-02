<!--
SPDX-FileCopyrightText: syuilo and misskey-project
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
	@closed="emit('closed')"
>
	<template #header>
		{{ title }}
	</template>

	<MkSpacer :marginMin="20" :marginMax="32">
		<div v-if="Object.keys(form).filter(item => !form[item].hidden).length > 0" class="_gaps_m">
			<template v-for="(v, k) in Object.fromEntries(Object.entries(form))">
				<template v-if="typeof v.hidden == 'function' ? v.hidden(values) : v.hidden"></template>
				<MkInput v-else-if="v.type === 'number'" v-model="values[k]" type="number" :step="v.step || 1">
					<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="v.description" #caption>{{ v.description }}</template>
				</MkInput>
				<MkInput v-else-if="v.type === 'string' && !v.multiline" v-model="values[k]" type="text" :mfmAutocomplete="v.treatAsMfm">
					<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="v.description" #caption>{{ v.description }}</template>
				</MkInput>
				<MkTextarea v-else-if="v.type === 'string' && v.multiline" v-model="values[k]" :mfmAutocomplete="v.treatAsMfm" :mfmPreview="v.treatAsMfm">
					<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="v.description" #caption>{{ v.description }}</template>
				</MkTextarea>
				<MkSwitch v-else-if="v.type === 'boolean'" v-model="values[k]">
					<span v-text="v.label || k"></span>
					<template v-if="v.description" #caption>{{ v.description }}</template>
				</MkSwitch>
				<MkSelect v-else-if="v.type === 'enum'" v-model="values[k]">
					<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="option in v.enum" :key="option.value" :value="option.value">{{ option.label }}</option>
				</MkSelect>
				<MkRadios v-else-if="v.type === 'radio'" v-model="values[k]">
					<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
					<option v-for="option in v.options" :key="option.value" :value="option.value">{{ option.label }}</option>
				</MkRadios>
				<MkRange v-else-if="v.type === 'range'" v-model="values[k]" :min="v.min" :max="v.max" :step="v.step" :textConverter="v.textConverter">
					<template #label><span v-text="v.label || k"></span><span v-if="v.required === false"> ({{ i18n.ts.optional }})</span></template>
					<template v-if="v.description" #caption>{{ v.description }}</template>
				</MkRange>
				<MkButton v-else-if="v.type === 'button'" @click="v.action($event, values)">
					<span v-text="v.content || k"></span>
				</MkButton>
				<XFile
					v-else-if="v.type === 'drive-file'"
					:fileId="v.defaultFileId"
					:validate="async f => !v.validate || await v.validate(f)"
					@update="f => values[k] = f"
				/>
			</template>
		</div>
		<div v-else class="_fullinfo">
			<img :src="infoImageUrl" class="_ghost"/>
			<div>{{ i18n.ts.nothing }}</div>
		</div>
	</MkSpacer>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { reactive, shallowRef } from 'vue';
import MkInput from './MkInput.vue';
import MkTextarea from './MkTextarea.vue';
import MkSwitch from './MkSwitch.vue';
import MkSelect from './MkSelect.vue';
import MkRange from './MkRange.vue';
import MkButton from './MkButton.vue';
import MkRadios from './MkRadios.vue';
import XFile from './MkFormDialog.file.vue';
import type { Form } from '@/scripts/form.js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import { i18n } from '@/i18n.js';
import { infoImageUrl } from '@/instance.js';

const props = defineProps<{
	title: string;
	form: Form;
}>();

const emit = defineEmits<{
	(ev: 'done', v: {
		canceled: true;
	} | {
		result: Record<string, any>;
	}): void;
	(ev: 'closed'): void;
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
	dialog.value?.close();
}

function cancel() {
	emit('done', {
		canceled: true,
	});
	dialog.value?.close();
}
</script>
