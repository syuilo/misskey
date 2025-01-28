<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800" :marginMin="16" :marginMax="32">
		<div class="cwepdizn _gaps_m">
			<MkFolder :defaultOpen="true">
				<template #label>{{ i18n.ts.backgroundColor }}</template>
				<div class="cwepdizn-colors">
					<div class="row">
						<button v-for="color in bgColors.filter(x => x.kind === 'light')" :key="color.color" class="color _button" :class="{ active: theme.props.bg === color.color }" @click="setBgColor(color)">
							<div class="preview" :style="{ background: color.forPreview }"></div>
						</button>
					</div>
					<div class="row">
						<button v-for="color in bgColors.filter(x => x.kind === 'dark')" :key="color.color" class="color _button" :class="{ active: theme.props.bg === color.color }" @click="setBgColor(color)">
							<div class="preview" :style="{ background: color.forPreview }"></div>
						</button>
					</div>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #label>{{ i18n.ts.accentColor }}</template>
				<div class="cwepdizn-colors">
					<div class="row">
						<button v-for="color in accentColors" :key="color" class="color rounded _button" :class="{ active: theme.props.accent === color }" @click="setAccentColor(color)">
							<div class="preview" :style="{ background: color }"></div>
						</button>
					</div>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #label>{{ i18n.ts.textColor }}</template>
				<div class="cwepdizn-colors">
					<div class="row">
						<button v-for="color in fgColors" :key="color" class="color char _button" :class="{ active: (theme.props.fg === color.forLight) || (theme.props.fg === color.forDark) }" @click="setFgColor(color)">
							<div class="preview" :style="{ color: color.forPreview ? color.forPreview : theme.base === 'light' ? '#5f5f5f' : '#dadada' }">A</div>
						</button>
					</div>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="false">
				<template #icon><i class="ti ti-code"></i></template>
				<template #label>{{ i18n.ts.editCode }}</template>

				<div class="_gaps_m">
					<MkCodeEditor v-model="themeCode" lang="json5">
						<template #label>{{ i18n.ts._theme.code }}</template>
					</MkCodeEditor>
					<MkButton primary @click="applyThemeCode">{{ i18n.ts.apply }}</MkButton>
				</div>
			</MkFolder>

			<MkFolder :defaultOpen="false">
				<template #label>{{ i18n.ts.addDescription }}</template>

				<div class="_gaps_m">
					<MkTextarea v-model="description">
						<template #label>{{ i18n.ts._theme.description }}</template>
					</MkTextarea>
				</div>
			</MkFolder>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { watch, ref, computed } from 'vue';
import { toUnicode } from 'punycode.js';
import tinycolor from 'tinycolor2';
import { v4 as uuid } from 'uuid';
import JSON5 from 'json5';

import lightTheme from '@@/themes/_light.json5';
import darkTheme from '@@/themes/_dark.json5';
import MkButton from '@/components/MkButton.vue';
import MkCodeEditor from '@/components/MkCodeEditor.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkFolder from '@/components/MkFolder.vue';

import { $i } from '@/account.js';
import { applyTheme } from '@/scripts/theme.js';
import type { Theme } from '@/scripts/theme.js';
import { host } from '@@/js/config.js';
import * as os from '@/os.js';
import { ColdDeviceStorage, defaultStore } from '@/store.js';
import { addTheme } from '@/theme-store.js';
import { i18n } from '@/i18n.js';
import { useLeaveGuard } from '@/scripts/use-leave-guard.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const bgColors = [
	{ color: '#f5f5f5', kind: 'light', forPreview: '#f5f5f5' },
	{ color: '#f0eee9', kind: 'light', forPreview: '#f3e2b9' },
	{ color: '#e9eff0', kind: 'light', forPreview: '#bfe3e8' },
	{ color: '#f0e9ee', kind: 'light', forPreview: '#f1d1e8' },
	{ color: '#dce2e0', kind: 'light', forPreview: '#a4dccc' },
	{ color: '#e2e0dc', kind: 'light', forPreview: '#d8c7a5' },
	{ color: '#d5dbe0', kind: 'light', forPreview: '#b0cae0' },
	{ color: '#dad5d5', kind: 'light', forPreview: '#d6afaf' },
	{ color: '#2b2b2b', kind: 'dark', forPreview: '#444444' },
	{ color: '#362e29', kind: 'dark', forPreview: '#735c4d' },
	{ color: '#303629', kind: 'dark', forPreview: '#506d2f' },
	{ color: '#293436', kind: 'dark', forPreview: '#258192' },
	{ color: '#2e2936', kind: 'dark', forPreview: '#504069' },
	{ color: '#252722', kind: 'dark', forPreview: '#3c462f' },
	{ color: '#212525', kind: 'dark', forPreview: '#303e3e' },
	{ color: '#191919', kind: 'dark', forPreview: '#272727' },
] as const;
const accentColors = ['#e36749', '#f29924', '#98c934', '#34c9a9', '#34a1c9', '#606df7', '#8d34c9', '#e84d83'];
const fgColors = [
	{ color: 'none', forLight: '#5f5f5f', forDark: '#dadada', forPreview: null },
	{ color: 'red', forLight: '#7f6666', forDark: '#e4d1d1', forPreview: '#ca4343' },
	{ color: 'yellow', forLight: '#736955', forDark: '#e0d5c0', forPreview: '#d49923' },
	{ color: 'green', forLight: '#586d5b', forDark: '#d1e4d4', forPreview: '#4cbd5c' },
	{ color: 'cyan', forLight: '#5d7475', forDark: '#d1e3e4', forPreview: '#2abdc3' },
	{ color: 'blue', forLight: '#676880', forDark: '#d1d2e4', forPreview: '#7275d8' },
	{ color: 'pink', forLight: '#84667d', forDark: '#e4d1e0', forPreview: '#b12390' },
];

const theme = ref<Partial<Theme>>({
	base: 'light',
	props: lightTheme.props,
});
const description = ref<string | null>(null);
const themeCode = ref<string | null>(null);
const changed = ref(false);

useLeaveGuard(changed);

function showPreview() {
	os.pageWindow('/preview');
}

function setBgColor(color: typeof bgColors[number]) {
	if (theme.value.base !== color.kind) {
		const base = color.kind === 'dark' ? darkTheme : lightTheme;
		for (const prop of Object.keys(base.props)) {
			if (prop === 'accent') continue;
			if (prop === 'fg') continue;
			theme.value.props[prop] = base.props[prop];
		}
	}
	theme.value.base = color.kind;
	theme.value.props.bg = color.color;

	if (theme.value.props.fg) {
		const matchedFgColor = fgColors.find(x => [tinycolor(x.forLight).toRgbString(), tinycolor(x.forDark).toRgbString()].includes(tinycolor(theme.value.props.fg).toRgbString()));
		if (matchedFgColor) setFgColor(matchedFgColor);
	}
}

function setAccentColor(color) {
	theme.value.props.accent = color;
}

function setFgColor(color) {
	theme.value.props.fg = theme.value.base === 'light' ? color.forLight : color.forDark;
}

function apply() {
	themeCode.value = JSON5.stringify(theme.value, null, '\t');
	applyTheme(theme.value, false);
	changed.value = true;
}

function applyThemeCode() {
	let parsed;

	try {
		parsed = JSON5.parse(themeCode.value);
	} catch (err) {
		os.alert({
			type: 'error',
			text: i18n.ts._theme.invalid,
		});
		return;
	}

	theme.value = parsed;
}

async function saveAs() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.name,
		minLength: 1,
	});
	if (canceled) return;

	theme.value.id = uuid();
	theme.value.name = name;
	theme.value.author = `@${$i.username}@${toUnicode(host)}`;
	if (description.value) theme.value.desc = description.value;
	await addTheme(theme.value);
	applyTheme(theme.value);
	if (defaultStore.state.darkMode) {
		ColdDeviceStorage.set('darkTheme', theme.value);
	} else {
		ColdDeviceStorage.set('lightTheme', theme.value);
	}
	changed.value = false;
	os.alert({
		type: 'success',
		text: i18n.tsx._theme.installed({ name: theme.value.name }),
	});
}

watch(theme, apply, { deep: true });

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-eye',
	text: i18n.ts.preview,
	handler: showPreview,
}, {
	asFullButton: true,
	icon: 'ti ti-check',
	text: i18n.ts.saveAs,
	handler: saveAs,
}]);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.themeEditor,
	icon: 'ti ti-palette',
}));
</script>

<style lang="scss" scoped>
.cwepdizn {
	::v-deep(.cwepdizn-colors) {
		text-align: center;

		> .row {
			> .color {
				display: inline-block;
				position: relative;
				width: 64px;
				height: 64px;
				border-radius: 8px;

				> .preview {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					margin: auto;
					width: 42px;
					height: 42px;
					border-radius: 4px;
					box-shadow: 0 2px 4px rgb(0 0 0 / 30%);
					transition: transform 0.15s ease;
				}

				&:hover {
					> .preview {
						transform: scale(1.1);
					}
				}

				&.active {
					box-shadow: 0 0 0 2px var(--MI_THEME-divider) inset;
				}

				&.rounded {
					border-radius: 999px;

					> .preview {
						border-radius: 999px;
					}
				}

				&.char {
					line-height: 42px;
				}
			}
		}
	}
}
</style>
