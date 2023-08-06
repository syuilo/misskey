<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div>
	<span v-if="!available">{{ i18n.ts.waiting }}<MkEllipsis/></span>
	<div ref="captchaEl"></div>
</div>
</template>

<script lang="ts" setup>
// @ts-nocheck
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { defaultStore } from '@/store';
import { i18n } from '@/i18n';

// APIs provided by Captcha services
export type Captcha = {
	render(container: string | Node, options: {
		readonly [_ in 'sitekey' | 'theme' | 'type' | 'size' | 'tabindex' | 'callback' | 'expired' | 'expired-callback' | 'error-callback' | 'endpoint']?: unknown;
	}): string;
	remove(id: string): void;
	execute(id: string): void;
	reset(id?: string): void;
	getResponse(id: string): string;
};

type CaptchaProvider = 'hcaptcha' | 'recaptcha' | 'turnstile';

type CaptchaContainer = {
	readonly [_ in CaptchaProvider]?: Captcha;
};

declare global {
	interface Window extends CaptchaContainer { }
}

const props = defineProps<{
	provider: CaptchaProvider;
	sitekey: string | null; // null will show error on request
	modelValue?: string | null;
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: string | null): void;
}>();

const available = ref(false);

const captchaEl = shallowRef<HTMLDivElement | undefined>();

const variable = computed(() => {
	switch (props.provider) {
		case 'hcaptcha': return 'hcaptcha';
		case 'recaptcha': return 'grecaptcha';
		case 'turnstile': return 'turnstile';
	}
});

const loaded = !!window[variable.value];

const src = computed(() => {
	switch (props.provider) {
		case 'hcaptcha': return 'https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off';
		case 'recaptcha': return 'https://www.recaptcha.net/recaptcha/api.js?render=explicit';
		case 'turnstile': return 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
	}
});

const scriptId = computed(() => `script-${props.provider}`);

const captcha = computed<Captcha>(() => window[variable.value] || {} as unknown as Captcha);

if (loaded) {
	available.value = true;
} else {
	(document.getElementById(scriptId.value) ?? document.head.appendChild(Object.assign(document.createElement('script'), {
		async: true,
		id: scriptId.value,
		src: src.value,
	})))
		.addEventListener('load', () => available.value = true);
}

function reset() {
	if (captcha.value.reset) captcha.value.reset();
}

function requestRender() {
	if (captcha.value.render && captchaEl.value instanceof Element) {
		captcha.value.render(captchaEl.value, {
			sitekey: props.sitekey,
			theme: defaultStore.state.darkMode ? 'dark' : 'light',
			callback: callback,
			'expired-callback': callback,
			'error-callback': callback,
		});
	} else {
		window.setTimeout(requestRender, 1);
	}
}

function callback(response?: string) {
	emit('update:modelValue', typeof response === 'string' ? response : null);
}

onMounted(() => {
	if (available.value) {
		requestRender();
	} else {
		watch(available, requestRender);
	}
});

onBeforeUnmount(() => {
	reset();
});

defineExpose({
	reset,
});

</script>
