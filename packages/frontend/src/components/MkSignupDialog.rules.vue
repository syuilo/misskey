<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<div :class="$style.banner">
		<i class="ti ti-checklist"></i>
	</div>
	<MkSpacer :marginMin="20" :marginMax="28">
		<div class="_gaps_m">
			<div v-if="instance.disableRegistration">
				<MkInfo warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
			</div>

			<div style="text-align: center;">
				<div>{{ i18n.ts.pleaseConfirmBelowBeforeSignup }}</div>
				<div style="font-weight: bold; margin-top: 0.5em;">{{ i18n.ts.beSureToReadThisAsItIsImportant }}</div>
			</div>

			<MkFolder v-if="availableServerRules" :defaultOpen="true">
				<template #label>{{ i18n.ts.serverRules }}</template>
				<template #suffix><i v-if="agreeServerRules" class="ti ti-check" style="color: var(--success)"></i></template>

				<ol class="_gaps_s" :class="$style.rules">
					<li v-for="item in instance.serverRules" :class="$style.rule"><div :class="$style.ruleText" v-html="item"></div></li>
				</ol>

				<MkSwitch :modelValue="agreeServerRules" style="margin-top: 16px;" @update:modelValue="updateAgreeServerRules">{{ i18n.ts.agree }}</MkSwitch>
			</MkFolder>

			<MkFolder v-if="availableTos" :defaultOpen="true">
				<template #label>{{ i18n.ts.termsOfService }}</template>
				<template #suffix><i v-if="agreeTos" class="ti ti-check" style="color: var(--success)"></i></template>

				<a :href="instance.tosUrl" class="_link" target="_blank">{{ i18n.ts.termsOfService }} <i class="ti ti-external-link"></i></a>

				<MkSwitch :modelValue="agreeTos" style="margin-top: 16px;" @update:modelValue="updateAgreeTos">{{ i18n.ts.agree }}</MkSwitch>
			</MkFolder>

			<MkFolder :defaultOpen="true">
				<template #label>{{ i18n.ts.basicNotesBeforeCreateAccount }}</template>
				<template #suffix><i v-if="agreeNote" class="ti ti-check" style="color: var(--success)"></i></template>

				<a href="https://misskey-hub.net/docs/notes.html" class="_link" target="_blank">{{ i18n.ts.basicNotesBeforeCreateAccount }} <i class="ti ti-external-link"></i></a>

				<MkSwitch :modelValue="agreeNote" style="margin-top: 16px;" data-cy-signup-rules-notes-agree @update:modelValue="updateAgreeNote">{{ i18n.ts.agree }}</MkSwitch>
			</MkFolder>

			<div v-if="!agreed" style="text-align: center;">{{ i18n.ts.pleaseAgreeAllToContinue }}</div>

			<div class="_buttonsCenter">
				<MkButton inline rounded @click="emit('cancel')">{{ i18n.ts.cancel }}</MkButton>
				<MkButton inline primary rounded gradate :disabled="!agreed" data-cy-signup-rules-continue @click="emit('done')">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
			</div>
		</div>
	</MkSpacer>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { computed, onMounted, ref, watch } from 'vue';
import { instance } from '@/instance';
import { i18n } from '@/i18n';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os';

const availableServerRules = instance.serverRules.length > 0;
const availableTos = instance.tosUrl != null;

const agreeServerRules = ref(false);
const agreeTos = ref(false);
const agreeNote = ref(false);

const agreed = computed(() => {
	return (!availableServerRules || agreeServerRules.value) && (!availableTos || agreeTos.value) && agreeNote.value;
});

const emit = defineEmits<{
	(ev: 'cancel'): void;
	(ev: 'done'): void;
}>();

async function updateAgreeServerRules(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.t('iHaveReadXCarefullyAndAgree', { x: i18n.ts.serverRules }),
		});
		if (confirm.canceled) return;
		agreeServerRules.value = true;
	} else {
		agreeServerRules.value = false;
	}
}

async function updateAgreeTos(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.t('iHaveReadXCarefullyAndAgree', { x: i18n.ts.termsOfService }),
		});
		if (confirm.canceled) return;
		agreeTos.value = true;
	} else {
		agreeTos.value = false;
	}
}

async function updateAgreeNote(v: boolean) {
	if (v) {
		const confirm = await os.confirm({
			type: 'question',
			title: i18n.ts.doYouAgree,
			text: i18n.t('iHaveReadXCarefullyAndAgree', { x: i18n.ts.basicNotesBeforeCreateAccount }),
		});
		if (confirm.canceled) return;
		agreeNote.value = true;
	} else {
		agreeNote.value = false;
	}
}
</script>

<style lang="scss" module>
.banner {
	padding: 16px;
	text-align: center;
	font-size: 26px;
	background-color: var(--accentedBg);
	color: var(--accent);
}

.rules {
	counter-reset: item;
	list-style: none;
	padding: 0;
	margin: 0;
}

.rule {
	display: flex;
	gap: 8px;
	word-break: break-word;

	&::before {
		flex-shrink: 0;
		display: flex;
		position: sticky;
		top: calc(var(--stickyTop, 0px) + 8px);
		counter-increment: item;
		content: counter(item);
		width: 32px;
		height: 32px;
		line-height: 32px;
		background-color: var(--accentedBg);
		color: var(--accent);
		font-size: 13px;
		font-weight: bold;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
	}
}

.ruleText {
	padding-top: 6px;
}
</style>
