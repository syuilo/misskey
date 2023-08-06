<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div v-if="c.type === 'root'" :class="$style.root">
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size"/>
		</template>
	</div>
	<span v-else-if="c.type === 'text'" :class="{ [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }" :style="{ fontSize: c.size ? `${c.size * 100}%` : null, fontWeight: c.bold ? 'bold' : null, color: c.color ?? null }">{{ c.text }}</span>
	<Mfm v-else-if="c.type === 'mfm'" :class="{ [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }" :style="{ fontSize: c.size ? `${c.size * 100}%` : null, fontWeight: c.bold ? 'bold' : null, color: c.color ?? null }" :text="c.text"/>
	<MkButton v-else-if="c.type === 'button'" :primary="c.primary" :rounded="c.rounded" :disabled="c.disabled" :small="size === 'small'" inline @click="c.onClick">{{ c.text }}</MkButton>
	<div v-else-if="c.type === 'buttons'" class="_buttons" :style="{ justifyContent: align }">
		<MkButton v-for="button in c.buttons" :primary="button.primary" :rounded="button.rounded" :disabled="button.disabled" inline :small="size === 'small'" @click="button.onClick">{{ button.text }}</MkButton>
	</div>
	<MkSwitch v-else-if="c.type === 'switch'" :modelValue="valueForSwitch" @update:modelValue="onSwitchUpdate">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkSwitch>
	<MkTextarea v-else-if="c.type === 'textarea'" :modelValue="c.default" @update:modelValue="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkTextarea>
	<MkInput v-else-if="c.type === 'textInput'" :small="size === 'small'" :modelValue="c.default" @update:modelValue="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkInput>
	<MkInput v-else-if="c.type === 'numberInput'" :small="size === 'small'" :modelValue="c.default" type="number" @update:modelValue="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkInput>
	<MkSelect v-else-if="c.type === 'select'" :small="size === 'small'" :modelValue="c.default" @update:modelValue="c.onChange">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
		<option v-for="item in c.items" :key="item.value" :value="item.value">{{ item.text }}</option>
	</MkSelect>
	<MkButton v-else-if="c.type === 'postFormButton'" :primary="c.primary" :rounded="c.rounded" :small="size === 'small'" inline @click="openPostForm">{{ c.text }}</MkButton>
	<MkFolder v-else-if="c.type === 'folder'" :defaultOpen="c.opened">
		<template #label>{{ c.title }}</template>
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size"/>
		</template>
	</MkFolder>
	<div v-else-if="c.type === 'container'" :class="[$style.container, { [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }]" :style="{ textAlign: c.align ?? null, backgroundColor: c.bgColor ?? null, color: c.fgColor ?? null, borderWidth: c.borderWidth ? `${c.borderWidth}px` : 0, borderColor: c.borderColor ?? 'var(--divider)', padding: c.padding ? `${c.padding}px` : 0, borderRadius: c.rounded ? '8px' : 0 }">
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size" :align="c.align"/>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { Ref } from 'vue';
import * as os from '@/os';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import { AsUiComponent } from '@/scripts/aiscript/ui';
import MkFolder from '@/components/MkFolder.vue';

const props = withDefaults(defineProps<{
	component: AsUiComponent;
	components: Ref<AsUiComponent>[];
	size: 'small' | 'medium' | 'large';
	align: 'left' | 'center' | 'right';
}>(), {
	size: 'medium',
	align: 'left',
});

const c = props.component;

function g(id) {
	return props.components.find(x => x.value.id === id).value;
}

let valueForSwitch = $ref(c.default ?? false);

function onSwitchUpdate(v) {
	valueForSwitch = v;
	if (c.onChange) c.onChange(v);
}

function openPostForm() {
	os.post({
		initialText: c.form.text,
		instant: true,
	});
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.container {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.fontSerif {
	font-family: serif;
}

.fontMonospace {
	font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
}
</style>
