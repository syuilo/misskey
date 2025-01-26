<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps_m rsljpzjq">
	<div v-adaptive-border class="rfqxtzch _panel">
		<div
			class="toggle"
			:class="{ disabled: syncDeviceDarkMode }"
		>
			<div class="toggleWrapper">
				<input id="dn" v-model="darkMode" type="checkbox" class="dn" :disabled="syncDeviceDarkMode"/>
				<label for="dn" class="toggle">
					<span class="before">{{ i18n.ts.light }}</span>
					<span class="after">{{ i18n.ts.dark }}</span>
					<span class="toggle__handler">
						<span class="crater crater--1"></span>
						<span class="crater crater--2"></span>
						<span class="crater crater--3"></span>
					</span>
					<span class="star star--1"></span>
					<span class="star star--2"></span>
					<span class="star star--3"></span>
					<span class="star star--4"></span>
					<span class="star star--5"></span>
					<span class="star star--6"></span>
				</label>
			</div>
		</div>
		<div class="sync">
			<MkSwitch v-model="syncDeviceDarkMode">{{ i18n.ts.syncDeviceDarkMode }}</MkSwitch>
		</div>
	</div>

	<div class="selects">
		<MkSelect v-model="lightThemeId" large class="select">
			<template #label>{{ i18n.ts.themeForLightMode }}</template>
			<template #prefix><i class="ti ti-sun"></i></template>
			<option v-if="instanceLightTheme" :key="'instance:' + instanceLightTheme.id" :value="instanceLightTheme.id">{{ instanceLightTheme.name }}</option>
			<optgroup v-if="installedLightThemes.length > 0" :label="i18n.ts._theme.installedThemes">
				<option v-for="x in installedLightThemes" :key="'installed:' + x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="i18n.ts._theme.builtinThemes">
				<option v-for="x in builtinLightThemes" :key="'builtin:' + x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</MkSelect>
		<MkSelect v-model="darkThemeId" large class="select">
			<template #label>{{ i18n.ts.themeForDarkMode }}</template>
			<template #prefix><i class="ti ti-moon"></i></template>
			<option v-if="instanceDarkTheme" :key="'instance:' + instanceDarkTheme.id" :value="instanceDarkTheme.id">{{ instanceDarkTheme.name }}</option>
			<optgroup v-if="installedDarkThemes.length > 0" :label="i18n.ts._theme.installedThemes">
				<option v-for="x in installedDarkThemes" :key="'installed:' + x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
			<optgroup :label="i18n.ts._theme.builtinThemes">
				<option v-for="x in builtinDarkThemes" :key="'builtin:' + x.id" :value="x.id">{{ x.name }}</option>
			</optgroup>
		</MkSelect>
	</div>

	<FormSection>
		<div class="_formLinksGrid">
			<FormLink to="/settings/theme/manage"><template #icon><i class="ti ti-tool"></i></template>{{ i18n.ts._theme.manage }}<template #suffix>{{ themesCount }}</template></FormLink>
			<FormLink to="https://assets.misskey.io/theme/list" external><template #icon><i class="ti ti-world"></i></template>{{ i18n.ts._theme.explore }}</FormLink>
			<FormLink to="/settings/theme/install"><template #icon><i class="ti ti-download"></i></template>{{ i18n.ts._theme.install }}</FormLink>
			<FormLink to="/theme-editor"><template #icon><i class="ti ti-paint"></i></template>{{ i18n.ts._theme.make }}</FormLink>
		</div>
	</FormSection>

	<MkButton v-if="wallpaper == null" @click="setWallpaper">{{ i18n.ts.setWallpaper }}</MkButton>
	<MkButton v-else @click="wallpaper = null">{{ i18n.ts.removeWallpaper }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { computed, onActivated, ref, watch } from 'vue';
import JSON5 from 'json5';
import MkSwitch from '@/components/MkSwitch.vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSection from '@/components/form/section.vue';
import FormLink from '@/components/form/link.vue';
import MkButton from '@/components/MkButton.vue';
import { getBuiltinThemesRef } from '@/scripts/theme.js';
import { selectFile } from '@/scripts/select-file.js';
import { isDeviceDarkmode } from '@/scripts/is-device-darkmode.js';
import { ColdDeviceStorage, defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { uniqueBy } from '@/scripts/array.js';
import { fetchThemes, getThemes } from '@/theme-store.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { miLocalStorage } from '@/local-storage.js';
import { reloadAsk } from '@/scripts/reload-ask.js';
import * as os from '@/os.js';

const installedThemes = ref(getThemes());
const builtinThemes = getBuiltinThemesRef();

const instanceDarkTheme = computed(() => instance.defaultDarkTheme ? JSON5.parse(instance.defaultDarkTheme) : null);
const installedDarkThemes = computed(() => installedThemes.value.filter(t => t.base === 'dark' || t.kind === 'dark'));
const builtinDarkThemes = computed(() => builtinThemes.value.filter(t => t.base === 'dark' || t.kind === 'dark'));
const instanceLightTheme = computed(() => instance.defaultLightTheme ? JSON5.parse(instance.defaultLightTheme) : null);
const installedLightThemes = computed(() => installedThemes.value.filter(t => t.base === 'light' || t.kind === 'light'));
const builtinLightThemes = computed(() => builtinThemes.value.filter(t => t.base === 'light' || t.kind === 'light'));
const themes = computed(() => uniqueBy([instanceDarkTheme.value, instanceLightTheme.value, ...builtinThemes.value, ...installedThemes.value].filter(x => x != null), theme => theme.id));

const darkTheme = ColdDeviceStorage.ref('darkTheme');
const darkThemeId = computed({
	get() {
		return darkTheme.value.id;
	},
	set(id) {
		const t = themes.value.find(x => x.id === id);
		if (t) { // テーマエディタでテーマを作成したときなどは、themesに反映されないため undefined になる
			ColdDeviceStorage.set('darkTheme', t);
		}
	},
});
const lightTheme = ColdDeviceStorage.ref('lightTheme');
const lightThemeId = computed({
	get() {
		return lightTheme.value.id;
	},
	set(id) {
		const t = themes.value.find(x => x.id === id);
		if (t) { // テーマエディタでテーマを作成したときなどは、themesに反映されないため undefined になる
			ColdDeviceStorage.set('lightTheme', t);
		}
	},
});

const darkMode = computed(defaultStore.makeGetterSetter('darkMode'));
const syncDeviceDarkMode = computed(ColdDeviceStorage.makeGetterSetter('syncDeviceDarkMode'));
const wallpaper = ref(miLocalStorage.getItem('wallpaper'));
const themesCount = installedThemes.value.length;

watch(syncDeviceDarkMode, () => {
	if (syncDeviceDarkMode.value) {
		defaultStore.set('darkMode', isDeviceDarkmode());
	}
});

watch(wallpaper, async () => {
	if (wallpaper.value == null) {
		miLocalStorage.removeItem('wallpaper');
	} else {
		miLocalStorage.setItem('wallpaper', wallpaper.value);
	}
	await reloadAsk({ reason: i18n.ts.reloadToApplySetting, unison: true });
});

onActivated(() => {
	fetchThemes().then(() => {
		installedThemes.value = getThemes();
	});
});

fetchThemes().then(() => {
	installedThemes.value = getThemes();
});

function setWallpaper(event) {
	selectFile(event.currentTarget ?? event.target, null).then(file => {
		wallpaper.value = file.url;
	});
}

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: i18n.ts.theme,
	icon: 'ti ti-palette',
}));
</script>

<style lang="scss" scoped>
.rfqxtzch {
	border-radius: 6px;

	> .toggle {
		position: relative;
		padding: 26px 0;
		text-align: center;
		overflow: clip;

		&.disabled::after {
			position: absolute;
			z-index: 3;
			content: '';
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: var(--panel);
			opacity: .5;
			cursor: not-allowed;
		}

		> .toggleWrapper {
			display: inline-block;
			text-align: left;
			overflow: clip;
			padding: 0 100px;
			vertical-align: bottom;

			input {
				position: absolute;
				left: -99em;
			}
		}

		.dn:focus-visible ~ .toggle {
			outline: 2px solid var(--MI_THEME-focus);
			outline-offset: 2px;
		}

		.toggle {
			cursor: pointer;
			display: inline-block;
			position: relative;
			width: 90px;
			height: 50px;
			margin: 4px; // focus用のアウトライン
			background-color: #83D8FF;
			border-radius: 90px - 6;
			transition: background-color 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;

			> .before, > .after {
				position: absolute;
				top: 15px;
				transition: color 1s ease;
			}

			> .before {
				left: -70px;
				color: var(--MI_THEME-accent);
			}

			> .after {
				right: -68px;
				color: var(--MI_THEME-fg);
			}
		}

		.toggle__handler {
			display: inline-block;
			position: relative;
			z-index: 1;
			top: 3px;
			left: 3px;
			width: 50px - 6;
			height: 50px - 6;
			background-color: #FFCF96;
			border-radius: 50px;
			box-shadow: 0 2px 6px rgba(0,0,0,.3);
			transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
			transform:  rotate(-45deg);

			.crater {
				position: absolute;
				background-color: #E8CDA5;
				opacity: 0;
				transition: opacity 200ms ease-in-out !important;
				border-radius: 100%;
			}

			.crater--1 {
				top: 18px;
				left: 10px;
				width: 4px;
				height: 4px;
			}

			.crater--2 {
				top: 28px;
				left: 22px;
				width: 6px;
				height: 6px;
			}

			.crater--3 {
				top: 10px;
				left: 25px;
				width: 8px;
				height: 8px;
			}
		}

		.star {
			position: absolute;
			background-color: #ffffff;
			transition: all 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
			border-radius: 50%;
		}

		.star--1 {
			top: 10px;
			left: 35px;
			z-index: 0;
			width: 30px;
			height: 3px;
		}

		.star--2 {
			top: 18px;
			left: 28px;
			z-index: 1;
			width: 30px;
			height: 3px;
		}

		.star--3 {
			top: 27px;
			left: 40px;
			z-index: 0;
			width: 30px;
			height: 3px;
		}

		.star--4,
		.star--5,
		.star--6 {
			opacity: 0;
			transition: all 300ms 0 cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
		}

		.star--4 {
			top: 16px;
			left: 11px;
			z-index: 0;
			width: 2px;
			height: 2px;
			transform: translate3d(3px,0,0);
		}

		.star--5 {
			top: 32px;
			left: 17px;
			z-index: 0;
			width: 3px;
			height: 3px;
			transform: translate3d(3px,0,0);
		}

		.star--6 {
			top: 36px;
			left: 28px;
			z-index: 0;
			width: 2px;
			height: 2px;
			transform: translate3d(3px,0,0);
		}

		input:checked {
			+ .toggle {
				background-color: #749DD6;

				> .before {
					color: var(--MI_THEME-fg);
				}

				> .after {
					color: var(--MI_THEME-accent);
				}

				.toggle__handler {
					background-color: #FFE5B5;
					transform: translate3d(40px, 0, 0) rotate(0);

					.crater { opacity: 1; }
				}

				.star--1 {
					width: 2px;
					height: 2px;
				}

				.star--2 {
					width: 4px;
					height: 4px;
					transform: translate3d(-5px, 0, 0);
				}

				.star--3 {
					width: 2px;
					height: 2px;
					transform: translate3d(-7px, 0, 0);
				}

				.star--4,
				.star--5,
				.star--6 {
					opacity: 1;
					transform: translate3d(0,0,0);
				}

				.star--4 {
					transition: all 300ms 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}

				.star--5 {
					transition: all 300ms 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}

				.star--6 {
					transition: all 300ms 400ms cubic-bezier(0.445, 0.05, 0.55, 0.95) !important;
				}
			}
		}
	}

	> .sync {
		padding: 14px 16px;
		border-top: solid 0.5px var(--MI_THEME-divider);
	}
}

.rsljpzjq {
	> .selects {
		display: flex;
		gap: 1.5em var(--MI-margin);
		flex-wrap: wrap;

		> .select {
			flex: 1;
			min-width: 280px;
		}
	}
}
</style>
